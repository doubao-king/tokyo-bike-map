CREATE TABLE IF NOT EXISTS page_views (
  counter_key TEXT PRIMARY KEY,
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO page_views (counter_key, view_count) VALUES ('map', 0);
