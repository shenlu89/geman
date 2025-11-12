// lib/db.ts
import { createClient } from "@libsql/client";
import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";

const url = process.env.DATABASE_URL || "file:./db.sqlite";
const isLibsql = /^libsql:|^https?:\/\//.test(url);

export const db = isLibsql
  ? drizzleLibsql(
    createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    }),
    { schema }
  )
  : drizzleSqlite(
    new Database(url.replace(/^file:/, "") || "./db.sqlite"),
    { schema }
  );

export { isLibsql };
