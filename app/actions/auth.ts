"use server";

import { db } from "@/lib/db";
import { users, sessions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { ensureSchema } from "@/lib/db";

export async function getSession() {
    await ensureSchema();
    const cookieStore = await cookies();
    const cookie = cookieStore.get("session_token");
    if (!cookie) return null;
    const sess = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, cookie.value))
        .limit(1);
    if (!sess.length) return null;
    const userRow = await db
        .select()
        .from(users)
        .where(eq(users.id, sess[0].userId))
        .limit(1);
    if (!userRow.length) return null;
    return { user: { id: userRow[0].id, email: userRow[0].email, role: userRow[0].role } };
}

export async function signOutAdmin() {
    await ensureSchema();
    const cookieStore = await cookies();
    const cookie = cookieStore.get("session_token");
    if (cookie) {
        await db.delete(sessions).where(eq(sessions.token, cookie.value));
        cookieStore.delete("session_token");
    }
    redirect("/login");
}

export async function hasAnyUser() {
    await ensureSchema();
    const rows = await db.select().from(users).limit(1);
    return rows.length > 0;
}

export async function register(formData: FormData) {
    await ensureSchema();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    if (!email || !password) throw new Error("Email and password are required");

    const exists = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (exists.length) throw new Error("Email already registered");

    const count = (await db.select().from(users)).length;
    const role = count === 0 ? "admin" : "user";
    const hash = await bcrypt.hash(password, 10);
    const inserted = await db
        .insert(users)
        .values({ email, passwordHash: hash, role })
        .returning();

    const userId = inserted[0].id as number;
    const token = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days

    await db.insert(sessions).values({ token, userId, expiresAt });
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    redirect("/");
}

export async function signIn(formData: FormData) {
    await ensureSchema();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!rows.length) throw new Error("Invalid credentials");
    const user = rows[0] as any;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error("Invalid credentials");

    const token = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
    await db.insert(sessions).values({ token, userId: user.id, expiresAt });
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    redirect("/");
}

export async function resetUsers() {
    await ensureSchema();
    const cookieStore = await cookies();
    const cookie = cookieStore.get("session_token");

    // Delete all sessions and users
    await db.delete(sessions);
    await db.delete(users);

    // Clear current login cookie (if present)
    if (cookie) {
        cookieStore.delete("session_token");
    }

    // Redirect to registration page
    redirect("/register");
}