import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL || "file:./db.sqlite";
const isTurso = /^libsql:|^https?:\/\//.test(url);

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: isTurso ? "turso" : "sqlite",
  dbCredentials: isTurso
    ? { url, authToken: process.env.TURSO_AUTH_TOKEN }
    : { url },
  verbose: true,
  strict: true,
});
