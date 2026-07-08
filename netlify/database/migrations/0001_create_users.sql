CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  commune TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'email',
  role TEXT NOT NULL DEFAULT 'beta-player',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
