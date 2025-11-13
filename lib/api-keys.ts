"use server";

import { db } from "@/db"; // replace "@/lib/drizzle"
import { apiKeys, apiKeyCalls } from "@/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface ApiKey {
  id: number;
  apiKey: string;
  isActive: boolean;
  isHealthy: boolean;
  lastUsedAt: number | null;
  failureCount: number;
  lastFailureAt: number | null;
  createdAt: number;
}

/**
 * Add a new API key to the database
 */
export async function addApiKey(apiKey: string) {
  try {
    // Validate API key format (basic check)
    if (!apiKey || apiKey.trim().length < 10) {
      throw new Error("Invalid API key format");
    }

    await db.insert(apiKeys).values({
      apiKey: apiKey.trim(),
    });

    revalidatePath("/keys");
    return { success: true };
  } catch (error) {
    console.error("Failed to add API key:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add API key",
    };
  }
}

/**
 * Get all API keys for display in the dashboard
 */
export async function getAllApiKeys(): Promise<ApiKey[]> {
  try {
    const rows = await db
      .select({
        id: apiKeys.id,
        apiKey: apiKeys.apiKey,
        isActive: apiKeys.isActive,
        isHealthy: apiKeys.isHealthy,
        lastUsedAt: apiKeys.lastUsedAt,
        failureCount: apiKeys.failureCount,
        lastFailureAt: apiKeys.lastFailureAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .orderBy(asc(apiKeys.createdAt));

    // ensure ApiKey shape; avoid selecting non-existent `name` column
    return rows.map((r: any) => ({ ...r, name: null }));
  } catch (error) {
    console.error("Failed to fetch API keys:", error);
    return [];
  }
}

/**
 * Toggle the active status of an API key
 */
export async function toggleApiKeyStatus(id: number, isActive: boolean) {
  try {
    await db.update(apiKeys).set({ isActive }).where(eq(apiKeys.id, id));

    revalidatePath("/keys");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle API key status:", error);
    return {
      success: false,
      error: "Failed to update API key status",
    };
  }
}

/**
 * Delete an API key
 */
export async function deleteApiKey(id: number) {
  try {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
    revalidatePath("/keys");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete API key:", error);
    return {
      success: false,
      error: "Failed to delete API key",
    };
  }
}

/**
 * Get the next available API key using LRU (Least Recently Used) strategy
 * This is the core function for the polling mechanism
 */
export async function getNextApiKey(): Promise<{
  apiKey: string;
  id: number;
} | null> {
  try {
    return await db.transaction(async (tx: any) => {
      // Find the least recently used healthy and active key
      const availableKeys = await tx
        .select({
          id: apiKeys.id,
          apiKey: apiKeys.apiKey,
          lastUsedAt: apiKeys.lastUsedAt,
        })
        .from(apiKeys)
        .where(and(eq(apiKeys.isActive, true), eq(apiKeys.isHealthy, true)))
        .orderBy(asc(apiKeys.lastUsedAt)) // NULL values come first (never used)
        .limit(1);

      if (availableKeys.length === 0) {
        return null; // No available keys
      }

      const selectedKey = availableKeys[0];

      // Immediately update the last_used_at timestamp to prevent race conditions
      await tx
        .update(apiKeys)
        .set({ lastUsedAt: Math.floor(Date.now() / 1000) })
        .where(eq(apiKeys.id, selectedKey.id));

      return {
        apiKey: selectedKey.apiKey,
        id: selectedKey.id,
      };
    });
  } catch (error) {
    console.error("Failed to get next API key:", error);
    return null;
  }
}

/**
 * Record a successful API call
 */
export async function recordApiSuccess(keyId: number) {
  try {
    await db
      .update(apiKeys)
      .set({
        failureCount: 0,
        lastFailureAt: null,
      })
      .where(eq(apiKeys.id, keyId));
  } catch (error) {
    console.error("Failed to record API success:", error);
  }
}

/**
 * Record a failed API call and implement circuit breaker logic
 */
export async function recordApiFailure(keyId: number, maxFailures = 3) {
  try {
    await db.transaction(async (tx: any) => {
      // Get current failure count
      const [currentKey] = await tx
        .select({ failureCount: apiKeys.failureCount })
        .from(apiKeys)
        .where(eq(apiKeys.id, keyId));

      if (!currentKey) return;

      const newFailureCount = currentKey.failureCount + 1;
      const now = Math.floor(Date.now() / 1000);

      // Update failure count and timestamp
      await tx
        .update(apiKeys)
        .set({
          failureCount: newFailureCount,
          lastFailureAt: now,
          // Mark as unhealthy if failure count exceeds threshold
          isHealthy: newFailureCount < maxFailures,
        })
        .where(eq(apiKeys.id, keyId));
    });

    revalidatePath("/keys");
  } catch (error) {
    console.error("Failed to record API failure:", error);
  }
}

/**
 * Recover unhealthy keys after a cooldown period
 * This should be called by a cron job or background task
 */
export async function recoverUnhealthyKeys(cooldownMinutes = 5) {
  try {
    const cooldownSeconds = cooldownMinutes * 60;
    const cutoffTime = Math.floor(Date.now() / 1000) - cooldownSeconds;

    await db
      .update(apiKeys)
      .set({
        isHealthy: true,
        failureCount: 0,
      })
      .where(
        and(
          eq(apiKeys.isHealthy, false),
          sql`${apiKeys.lastFailureAt} < ${cutoffTime}`,
        ),
      );

    revalidatePath("/keys");
    return { success: true };
  } catch (error) {
    console.error("Failed to recover unhealthy keys:", error);
    return { success: false };
  }
}

/**
 * Log an API call event for monitoring. Non-blocking best-effort.
 */
export async function logApiKeyCall(
  keyId: number,
  success: boolean,
  statusCode?: number,
) {
  try {
    // remove: await ensureSchema();
    await db.insert(apiKeyCalls).values({ keyId, success, statusCode });
  } catch (error) {
    console.error("Failed to log API key call:", error);
  }
}

/**
 * Aggregate per-key call count and last call time.
 */
export async function getApiKeyCallStats(): Promise<
  Array<{
    id: number;
    callCount: number;
    lastCallAt: number | null;
    keyPreview: string;
  }>
> {
  try {
    const rows = await db
      .select({
        id: apiKeys.id,
        callCount: sql<number>`count(${apiKeyCalls.id})`,
        lastCallAt: sql<number | null>`max(${apiKeyCalls.createdAt})`,
        apiKey: apiKeys.apiKey,
      })
      .from(apiKeys)
      .leftJoin(apiKeyCalls, eq(apiKeyCalls.keyId, apiKeys.id))
      .groupBy(apiKeys.id, apiKeys.apiKey)
      .orderBy(asc(apiKeys.id));

    return rows.map((r: any) => ({
      id: r.id,
      callCount: Number(r.callCount ?? 0),
      lastCallAt: r.lastCallAt ?? null,
      keyPreview: r.apiKey
        ? `${r.apiKey.substring(0, 8)}...${r.apiKey.substring(r.apiKey.length - 4)}`
        : "",
    }));
  } catch (error) {
    console.error("Failed to fetch API key call stats:", error);
    return [];
  }
}
