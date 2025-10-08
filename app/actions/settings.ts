"use server";
import { db, ensureSchema } from "@/lib/db";
import { settings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function getAllowedTokens(): Promise<string[]> {
    await ensureSchema();
    const rows = await db.select().from(settings).where(eq(settings.key, "ALLOWED_TOKENS")).limit(1);
    if (!rows.length) return [];
    const val = rows[0].value as string;
    try {
        return JSON.parse(val);
    } catch {
        return val.split("\n").map((s) => s.trim()).filter(Boolean);
    }
}

export async function saveAllowedTokens(formData: FormData) {
    await ensureSchema();
    const raw = String(formData.get("tokens") || "");
    const tokens = raw.split("\n").map((s) => s.trim()).filter(Boolean);
    const value = JSON.stringify(tokens);
    const existing = await db.select().from(settings).where(eq(settings.key, "ALLOWED_TOKENS")).limit(1);
    if (existing.length) {
        await db.update(settings).set({ value }).where(eq(settings.key, "ALLOWED_TOKENS"));
    } else {
        await db.insert(settings).values({ key: "ALLOWED_TOKENS", value });
    }
}