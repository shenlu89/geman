// File path: app/v1beta/models/[model]/route.ts

import { type NextRequest, NextResponse } from "next/server";
// Assume these action files exist in your project
import {
  getNextApiKey,
  recordApiSuccess,
  recordApiFailure,
  logApiKeyCall,
} from "@/lib/api-keys";
import { ProxyAgent } from "undici";

// ---------------------------
// Environment variables
// ---------------------------
const GEMINI_API_BASE = (
  process.env.GEMINI_API_BASE ||
  "https://generativelanguage.googleapis.com/v1beta"
).replace(/\/+$/, "");

// ---------------------------
// Core Proxy Logic (kept mostly unchanged)
// ---------------------------
async function proxyRequest(request: NextRequest, model: string) {
  let selectedKeyId: number | null = null;

  const dispatcher =
    process.env.NODE_ENV === "development" && process.env.HTTP_PROXY
      ? new ProxyAgent(process.env.HTTP_PROXY)
      : undefined;

  try {
    const keyInfo = await getNextApiKey();
    if (!keyInfo) {
      return NextResponse.json(
        { error: "No available API keys configured." },
        { status: 503 },
      );
    }

    selectedKeyId = keyInfo.id;
    const apiKey = keyInfo.apiKey;
    const body = await request.json();

    const isOpenAIFormat = body.messages && Array.isArray(body.messages);
    let geminiRequestBody;
    let responseTransformer;

    if (isOpenAIFormat) {
      geminiRequestBody = convertOpenAIToGemini(body);
      responseTransformer = convertGeminiToOpenAI;
    } else {
      geminiRequestBody = body;
      responseTransformer = (r: any) => r;
    }

    // Main change: use model from URL
    const endpoint = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;
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
      await logApiKeyCall(selectedKeyId!, false, geminiResponse.status).catch(
        console.error,
      );

      // Error handling remains unchanged
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
            error: `Upstream path not found: check GEMINI_API_BASE and model ('${model}')`,
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

    // Remaining logic unchanged
    const geminiBodyStr = await geminiResponse.text();
    let geminiData: any;
    try {
      geminiData = JSON.parse(geminiBodyStr);
    } catch (err) {
      console.error("Invalid JSON from Gemini:", geminiBodyStr);
      await recordApiFailure(selectedKeyId).catch(console.error);
      await logApiKeyCall(selectedKeyId!, false, geminiResponse.status).catch(
        console.error,
      );
      return NextResponse.json(
        { error: "Invalid JSON from upstream", details: geminiBodyStr },
        { status: 502 },
      );
    }

    await recordApiSuccess(selectedKeyId).catch(console.error);
    await logApiKeyCall(selectedKeyId!, true, geminiResponse.status).catch(
      console.error,
    );
    const finalResponse = responseTransformer(geminiData, model);
    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error("Proxy error:", error);
    if (selectedKeyId !== null) {
      await recordApiFailure(selectedKeyId).catch(console.error);
      await logApiKeyCall(selectedKeyId!, false).catch(console.error);
    }
    // Generic error handling unchanged
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------
// Route entry POST function (key changes)
// ---------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: { model: string } },
) {
  // New: authentication - check access token before all operations
  const clientToken = request.nextUrl.searchParams.get("key");
  const serverToken = process.env.ALLOWED_TOKEN;

  if (!serverToken || clientToken !== serverToken) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid access token." },
      { status: 401 },
    );
  }

  // After token validation, extract dynamic model parameter
  // For example, from "gemini-2.0-flash:generateContent" extract "gemini-2.0-flash"
  const modelName = params.model.split(":")[0];
  if (!modelName) {
    return NextResponse.json(
      { error: "Invalid model format in URL." },
      { status: 400 },
    );
  }

  // Call the core proxy logic and pass modelName
  return proxyRequest(request, modelName);
}

// ---------------------------
// OpenAI → Gemini conversion (unchanged)
// ---------------------------
function convertOpenAIToGemini(openAIBody: any) {
  const { messages, temperature, max_tokens } = openAIBody;
  const contents = messages
    .map((message: any) => {
      // Your conversion logic...
      if (message.role === "system") {
        return {
          role: "user",
          parts: [{ text: `System Prompt: ${message.content}` }],
        };
      }
      if (message.role === "user") {
        return { role: "user", parts: [{ text: message.content }] };
      }
      if (message.role === "assistant") {
        return { role: "model", parts: [{ text: message.content }] };
      }
      return null;
    })
    .filter(Boolean);

  const geminiBody: any = { contents };
  if (temperature !== undefined || max_tokens !== undefined) {
    geminiBody.generationConfig = {};
    if (temperature !== undefined)
      geminiBody.generationConfig.temperature = temperature;
    if (max_tokens !== undefined)
      geminiBody.generationConfig.maxOutputTokens = max_tokens;
  }
  return geminiBody;
}

// ---------------------------
// Gemini → OpenAI conversion (slightly adjusted to accept model)
// ---------------------------
function convertGeminiToOpenAI(geminiResponse: any, model: string) {
  const candidate = geminiResponse?.candidates?.[0];
  const content = candidate?.content?.parts?.[0]?.text || "";
  return {
    id: `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: model, // use dynamic model name
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
// GET endpoint: health check (unchanged)
// ---------------------------
export async function GET() {
  return NextResponse.json({
    message: "Gemini/OpenAI Proxy API is active.",
    status: "ok",
    note: "Send a POST request to /v1beta/models/[model-name]:generateContent to use the proxy.",
  });
}
