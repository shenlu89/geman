import { createClient } from "@libsql/client";
import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";

let isLibsql = false as boolean;
let db: any;
let libsqlClient: ReturnType<typeof createClient> | null = null;
let sqlite: Database.Database | null = null;

const url = process.env.DATABASE_URL;

if (
  url &&
  (url.startsWith("libsql:") ||
    url.startsWith("http://") ||
    url.startsWith("https://"))
) {
  isLibsql = true;
  libsqlClient = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  db = drizzleLibsql(libsqlClient);
} else {
  const file = url?.replace(/^file:/, "") || "./db.sqlite";
  sqlite = new Database(file);
  db = drizzleSqlite(sqlite);
}

export { db, isLibsql };

export async function ensureSchema() {
  const createUsers = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );`;

  const createSessions = `
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );`;

  const createSettings = `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`;

  if (isLibsql && libsqlClient) {
    await libsqlClient.execute(createUsers);
    await libsqlClient.execute(createSessions);
    await libsqlClient.execute(createSettings);
  } else if (sqlite) {
    sqlite.exec(createUsers);
    sqlite.exec(createSessions);
    sqlite.exec(createSettings);
  }
}
