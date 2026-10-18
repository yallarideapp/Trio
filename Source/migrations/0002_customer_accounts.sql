-- Shopper accounts are separate from the single shop administrator.
CREATE TABLE customers (
  id TEXT PRIMARY KEY CHECK (length(id) = 32),
  email TEXT NOT NULL UNIQUE CHECK (length(email) BETWEEN 3 AND 254 AND email = lower(email)),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 80),
  mobile TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL CHECK (length(password_hash) = 64),
  salt TEXT NOT NULL CHECK (length(salt) = 32),
  iterations INTEGER NOT NULL CHECK (iterations BETWEEN 10000 AND 100000),
  generation INTEGER NOT NULL DEFAULT 1 CHECK (generation >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE customer_sessions (
  token_hash TEXT PRIMARY KEY CHECK (length(token_hash) = 64),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  generation INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX customer_sessions_by_customer ON customer_sessions (customer_id);
CREATE INDEX customer_sessions_by_expiry ON customer_sessions (expires_at);

-- Guest orders remain valid. Only a verified customer session assigns ownership.
ALTER TABLE orders ADD COLUMN customer_id TEXT REFERENCES customers(id);
CREATE INDEX orders_by_customer ON orders (customer_id, seq DESC);
