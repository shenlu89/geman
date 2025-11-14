import { NextResponse } from "next/server";
import { db } from "@/db";
import { apiKeys, apiKeyCalls } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: apiKeys.id,
        apiKey: apiKeys.apiKey,
        callCount: sql<number>`count(${apiKeyCalls.id})`,
        successCount: sql<number>`sum(case when ${apiKeyCalls.success} = 1 then 1 else 0 end)`,
        failureCount: sql<number>`sum(case when ${apiKeyCalls.success} = 0 then 1 else 0 end)`,
        lastCallAt: sql<number | null>`max(${apiKeyCalls.createdAt})`,
      })
      .from(apiKeys)
      .leftJoin(apiKeyCalls, eq(apiKeyCalls.keyId, apiKeys.id))
      .groupBy(apiKeys.id, apiKeys.apiKey)
      .orderBy(asc(apiKeys.id));

    const data = rows.map((r: any) => {
      const callCount = Number(r.callCount ?? 0);
      const successCount = Number(r.successCount ?? 0);
      const failureCount = Number(r.failureCount ?? 0);
      const successRate =
        callCount > 0 ? Math.round((successCount / callCount) * 100) : null;
      const apiKey: string = r.apiKey ?? "";
      const keyPreview = apiKey
        ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
        : "";
      return {
        id: r.id,
        keyPreview,
        callCount,
        successCount,
        failureCount,
        successRate,
        lastCallAt: r.lastCallAt ?? null,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch call stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch call stats" },
      { status: 500 },
    );
  }
}
