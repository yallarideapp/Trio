-- TRIO Mobile: first schema. Money is stored in fils (1 JD = 1000 fils).
CREATE TABLE content (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL);
INSERT INTO counters (name, value) VALUES ('order', 1000);
CREATE TABLE orders (
  number TEXT PRIMARY KEY,
  seq INTEGER NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  note TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  governorate TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  fulfilment TEXT NOT NULL,
  lang TEXT NOT NULL,
  total_fils INTEGER NOT NULL
);
CREATE INDEX orders_by_date ON orders (seq DESC);
CREATE TABLE order_lines (
  order_number TEXT NOT NULL,
  position INTEGER NOT NULL,
  variant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  storage TEXT NOT NULL,
  condition TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_fils INTEGER NOT NULL,
  PRIMARY KEY (order_number, position)
);
CREATE TABLE admin (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  iterations INTEGER NOT NULL,
  generation INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  generation INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE attempts (key TEXT NOT NULL, at INTEGER NOT NULL);
CREATE INDEX attempts_by_key ON attempts (key, at);
