CREATE TABLE IF NOT EXISTS feedback_reports (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (
    category IN ('road_change', 'parking_change', 'missing_information', 'difficult_location', 'other')
  ),
  details TEXT NOT NULL CHECK (length(details) BETWEEN 10 AND 1500),
  observed_on TEXT,
  map_url TEXT NOT NULL CHECK (length(map_url) <= 2048),
  latitude REAL NOT NULL CHECK (latitude BETWEEN 24 AND 36),
  longitude REAL NOT NULL CHECK (longitude BETWEEN 138.5 AND 143),
  zoom INTEGER NOT NULL CHECK (zoom BETWEEN 10 AND 19),
  language TEXT NOT NULL CHECK (language IN ('ja', 'en', 'zh')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'reviewing', 'resolved', 'rejected')
  ),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS feedback_reports_status_created_idx
  ON feedback_reports (status, created_at DESC);
