const Database = require("better-sqlite3");

const url = process.env.DATABASE_URL;
if (url && (url.startsWith("libsql:") || url.startsWith("http://") || url.startsWith("https://"))) {
    console.error("DATABASE_URL points to Turso/libsql; this script only supports local SQLite.");
    process.exit(1);
}

const file = url && url.startsWith("file:") ? url.replace(/^file:/, "") : "./data.sqlite";
const db = new Database(file);

db.exec(`
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
`);

db.exec(`DELETE FROM sessions; DELETE FROM users;`);
console.log(`✅ Reset complete: users and sessions cleared in ${file}`);