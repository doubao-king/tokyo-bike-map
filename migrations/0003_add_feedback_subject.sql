ALTER TABLE feedback_reports
  ADD COLUMN subject_type TEXT NOT NULL DEFAULT 'map_location'
  CHECK (subject_type IN ('map_location', 'parking', 'segment'));

ALTER TABLE feedback_reports
  ADD COLUMN subject_id TEXT CHECK (subject_id IS NULL OR length(subject_id) <= 256);

ALTER TABLE feedback_reports
  ADD COLUMN subject_name TEXT CHECK (subject_name IS NULL OR length(subject_name) <= 300);

CREATE INDEX IF NOT EXISTS feedback_reports_subject_idx
  ON feedback_reports (subject_type, subject_id);
