-- szgaokao D1 建表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  pw TEXT NOT NULL,
  authorized INTEGER NOT NULL DEFAULT 0,
  code TEXT,
  expiry INTEGER,
  session_seq INTEGER NOT NULL DEFAULT 0,
  devices TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER,
  is_test INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS codes (
  code TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'permanent',
  days INTEGER,
  max_acts INTEGER NOT NULL DEFAULT 1,
  acts INTEGER NOT NULL DEFAULT 0,
  used_by TEXT NOT NULL DEFAULT '[]',
  used_at INTEGER,
  created_at INTEGER
);
