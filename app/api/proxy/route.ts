// Top-level module edits (imports and env defaults)
import { type NextRequest, NextResponse } from "next/server";
import {
  getNextApiKey,
  recordApiSuccess,
  recordApiFailure,
} from "@/lib/api-keys";

// ---------------------------
// Environment variables (defaults and robust handling)
// ---------------------------
import { ProxyAgent } from "undici";
const GEMINI_API_BASE = (
  process.env.GEMINI_API_BASE ||
  "https://generativelanguage.googleapis.com/v1beta"
).replace(/\/+$/, "");
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

// ---------------------------
// ✅ Core Proxy Logic
// ---------------------------
async function proxyRequest(request: NextRequest, model?: string) {
  let selectedKeyId: number | null = null;

  // Use local HTTP proxy only in development
  const dispatcher =
    process.env.NODE_ENV === "development"
      ? new ProxyAgent(
        process.env.HTTP_PROXY ??
        process.env.HTTPS_PROXY ??
        "http://127.0.0.1:7890",
      )
      : undefined;

  try {
    // Get next available API key (LRU)
    const keyInfo = await getNextApiKey();

    if (!keyInfo) {
      return NextResponse.json(
        { error: "No available API keys. Please add and configure API keys." },
        { status: 503 },
      );
    }

    selectedKeyId = keyInfo.id;
    const apiKey = keyInfo.apiKey;

    // Parse request body
    const body = await request.json();

    const isOpenAIFormat = body.messages && Array.isArray(body.messages);

    let geminiRequestBody;
    let responseTransformer;

    // Auto-detect request format
    if (isOpenAIFormat) {
      geminiRequestBody = convertOpenAIToGemini(body);
      responseTransformer = convertGeminiToOpenAI;
    } else {
      geminiRequestBody = body;
      responseTransformer = (r: any) => r;
    }

    // Call Gemini API
    const effectiveModel = model || GEMINI_MODEL;
    const endpoint = `${GEMINI_API_BASE}/models/${effectiveModel}:generateContent?key=${apiKey}`;
    console.log(`Forwarding to: ${endpoint}`);

    const fetchOptions: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiRequestBody),
    };

    const geminiResponse = await fetch(
      endpoint,
      dispatcher ? { ...(fetchOptions as any), dispatcher } : fetchOptions,
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);

      await recordApiFailure(selectedKeyId).catch(console.error);

      if (geminiResponse.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429 },
        );
      } else if (
        geminiResponse.status === 401 ||
        geminiResponse.status === 403
      ) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      } else if (geminiResponse.status === 404) {
        return NextResponse.json(
          {
            error: `Upstream path not found: check GEMINI_API_BASE and model ('${effectiveModel}')`,
          },
          { status: 502 },
        );
      } else {
        return NextResponse.json(
          { error: "Gemini API error", details: errorText },
          { status: geminiResponse.status },
        );
      }
    }

    // Attempt to parse JSON (with error handling)
    let geminiData: any;
    try {
      geminiData = await geminiResponse.json();
    } catch (err) {
      console.error("Invalid JSON from Gemini:", err);
      await recordApiFailure(selectedKeyId).catch(console.error);
      return NextResponse.json(
        { error: "Invalid JSON from upstream" },
        { status: 502 },
      );
    }

    // Record success
    await recordApiSuccess(selectedKeyId).catch(console.error);

    // Transform response
    const finalResponse = responseTransformer(geminiData);

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error("Proxy error:", error);

    // Ensure failures are recorded in database
    if (selectedKeyId !== null) {
      await recordApiFailure(selectedKeyId).catch(console.error);
    }

    const code =
      (error as any)?.code ||
      (error as any)?.cause?.code ||
      (error as any)?.name;

    if (code === "UND_ERR_CONNECT_TIMEOUT" || code === "ConnectTimeoutError") {
      return NextResponse.json(
        { error: "Upstream timeout: cannot reach Gemini API" },
        { status: 504 },
      );
    }
    if (code === "ENOTFOUND") {
      return NextResponse.json(
        { error: "Upstream host not found: check GEMINI_API_BASE host" },
        { status: 502 },
      );
    }
    if (code === "ERR_SSL_WRONG_VERSION_NUMBER") {
      return NextResponse.json(
        { error: "TLS handshake failed: check http/https scheme and port" },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------
// ✅ Gemini / OpenAI Proxy Endpoint
// ---------------------------
export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

// ---------------------------
// OpenAI → Gemini conversion
// ---------------------------
function convertOpenAIToGemini(openAIBody: any) {
  const { messages, temperature, max_tokens } = openAIBody;

  const contents = messages
    .map((message: any) => {
      if (message.role === "system") {
        return {
          role: "user",
          parts: [{ text: `System: ${message.content}` }],
        };
      } else if (message.role === "user") {
        return { role: "user", parts: [{ text: message.content }] };
      } else if (message.role === "assistant") {
        return { role: "model", parts: [{ text: message.content }] };
      }
      return null;
    })
    .filter(Boolean);

  // Merge system messages
  const processedContents: any[] = [];
  let systemMessages: string[] = [];

  for (const content of contents) {
    const text = content.parts[0].text;
    if (text.startsWith("System: ")) {
      systemMessages.push(text);
    } else if (content.role === "user" && systemMessages.length > 0) {
      const combinedText = [...systemMessages, text].join("\n\n");
      processedContents.push({ role: "user", parts: [{ text: combinedText }] });
      systemMessages = [];
    } else {
      processedContents.push(content);
    }
  }

  const geminiBody: any = { contents: processedContents };

  // Optional generation parameters
  if (temperature !== undefined || max_tokens !== undefined) {
    geminiBody.generationConfig = {};
    if (temperature !== undefined) {
      geminiBody.generationConfig.temperature = temperature;
    }
    if (max_tokens !== undefined) {
      geminiBody.generationConfig.maxOutputTokens = max_tokens;
    }
  }

  return geminiBody;
}

// ---------------------------
// Gemini → OpenAI conversion
// ---------------------------
function convertGeminiToOpenAI(geminiResponse: any) {
  const candidate = geminiResponse?.candidates?.[0];
  const content = candidate?.content?.parts?.[0]?.text || "";

  return {
    id: `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: GEMINI_MODEL,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: candidate?.finishReason?.toLowerCase() || "stop",
      },
    ],
    usage: {
      prompt_tokens: geminiResponse?.usageMetadata?.promptTokenCount || 0,
      completion_tokens:
        geminiResponse?.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: geminiResponse?.usageMetadata?.totalTokenCount || 0,
    },
  };
}

// ---------------------------
// GET endpoint: health check
// ---------------------------
export async function GET() {
  return NextResponse.json({
    message: "Gemini/OpenAI Proxy API",
    model: GEMINI_MODEL,
    status: "active",
  });
}
