import { NextResponse } from "next/server";
import { getAllApiKeys } from "@/lib/api-keys";

export async function GET() {
  try {
    const keys = await getAllApiKeys();

    const healthStats = {
      total: keys.length,
      active: keys.filter((k) => k.isActive).length,
      healthy: keys.filter((k) => k.isActive && k.isHealthy).length,
      unhealthy: keys.filter((k) => k.isActive && !k.isHealthy).length,
      disabled: keys.filter((k) => !k.isActive).length,
    };

    const keyDetails = keys.map((key) => ({
      id: key.id,
      isActive: key.isActive,
      isHealthy: key.isHealthy,
      failureCount: key.failureCount,
      lastUsedAt: key.lastUsedAt,
      lastFailureAt: key.lastFailureAt,
      // Don't expose the actual API key for security
      keyPreview: `${key.apiKey.substring(0, 8)}...${key.apiKey.substring(key.apiKey.length - 4)}`,
    }));

    return NextResponse.json({
      stats: healthStats,
      keys: keyDetails,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    console.error("Failed to get API keys health:", error);
    return NextResponse.json(
      { error: "Failed to get API keys health" },
      { status: 500 },
    );
  }
}
