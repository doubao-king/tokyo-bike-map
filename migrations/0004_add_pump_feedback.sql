CREATE TABLE feedback_reports_with_pumps (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (
    category IN (
      'road_change', 'parking_change', 'pump_change', 'missing_information',
      'difficult_location', 'other'
    )
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
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subject_type TEXT NOT NULL DEFAULT 'map_location'
    CHECK (subject_type IN ('map_location', 'parking', 'pump', 'segment')),
  subject_id TEXT CHECK (subject_id IS NULL OR length(subject_id) <= 256),
  subject_name TEXT CHECK (subject_name IS NULL OR length(subject_name) <= 300)
);

INSERT INTO feedback_reports_with_pumps (
  id, category, details, observed_on, map_url, latitude, longitude, zoom, language,
  status, created_at, subject_type, subject_id, subject_name
)
SELECT
  id, category, details, observed_on, map_url, latitude, longitude, zoom, language,
  status, created_at, subject_type, subject_id, subject_name
FROM feedback_reports;

DROP TABLE feedback_reports;
ALTER TABLE feedback_reports_with_pumps RENAME TO feedback_reports;

CREATE INDEX feedback_reports_status_created_idx
  ON feedback_reports (status, created_at DESC);
CREATE INDEX feedback_reports_subject_idx
  ON feedback_reports (subject_type, subject_id);
