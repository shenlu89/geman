import { drizzle } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import Database from "better-sqlite3";
import { users, sessions, settings } from "@/db/schema";
import { sql } from "drizzle-orm";

const url = process.env.DATABASE_URL;

async function resetDatabase() {
  let db: any;
  let isLibsql = false;

  // Determine database type and create connection
  if (url && (url.startsWith("libsql:") || url.startsWith("http://") || url.startsWith("https://"))) {
    // Use libsql/Turso
    const client = createClient({ url });
    db = drizzleLibsql(client);
    isLibsql = true;
    console.log("🔗 Using libsql/Turso database");
  } else {
    // Use local SQLite
    const file = url && url.startsWith("file:") ? url.replace(/^file:/, "") : "./db.sqlite";
    const sqlite = new Database(file);
    db = drizzle(sqlite);
    console.log(`🔗 Using local SQLite database: ${file}`);
  }

  try {
    // Enable foreign key constraints (SQLite only)
    if (!isLibsql) {
      await db.run(sql`PRAGMA foreign_keys = ON`);
    }

    // Ensure tables exist (using Drizzle schema)
    console.log("📋 Ensuring tables exist...");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await db.delete(sessions);
    await db.delete(users);
    await db.delete(settings);

    console.log("✅ Reset complete: all tables cleared");
  } catch (error) {
    console.error("❌ Error during reset:", error);
    process.exit(1);
  }
}

resetDatabase();
