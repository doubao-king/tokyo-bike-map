import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isFeedbackHoneypotFilled,
  validateFeedbackSubmission,
  type FeedbackSubmission
} from '../src/feedback';
import { createFeedbackMapUrl } from '../src/ui/feedback';

const origin = 'https://tokyo-bike-map.manymao.com';
const now = new Date('2026-08-27T03:00:00Z');
const validSubmission: FeedbackSubmission = {
  category: 'parking_change',
  details: 'The bicycle parking facility at this location has closed.',
  language: 'en',
  mapUrl: `${origin}/?lat=35.70000&lng=139.70000&z=15&roads=separated`,
  observedOn: '2026-08-26',
  personalInfoConfirmed: true,
  website: ''
};

const valid = validateFeedbackSubmission(validSubmission, origin, now);
assert.equal(valid.ok, true);
if (valid.ok) {
  assert.equal(valid.value.category, 'parking_change');
  assert.equal(valid.value.latitude, 35.7);
  assert.equal(valid.value.longitude, 139.7);
  assert.equal(valid.value.zoom, 15);
  assert.equal(valid.value.observedOn, '2026-08-26');
}

assert.equal(
  validateFeedbackSubmission({ ...validSubmission, details: ' too short ' }, origin, now).ok,
  false
);
assert.equal(
  validateFeedbackSubmission({ ...validSubmission, category: 'spam' }, origin, now).ok,
  false
);
assert.equal(
  validateFeedbackSubmission({ ...validSubmission, observedOn: '2026-08-28' }, origin, now).ok,
  false
);
assert.equal(
  validateFeedbackSubmission({ ...validSubmission, personalInfoConfirmed: false }, origin, now).ok,
  false
);
assert.equal(
  validateFeedbackSubmission(
    { ...validSubmission, mapUrl: 'https://example.com/?lat=35.7&lng=139.7&z=15' },
    origin,
    now
  ).ok,
  false
);
assert.equal(
  validateFeedbackSubmission(
    { ...validSubmission, mapUrl: `${origin}/?lat=50&lng=139.7&z=15` },
    origin,
    now
  ).ok,
  false
);

assert.equal(isFeedbackHoneypotFilled({ website: 'https://spam.example' }), true);
assert.equal(isFeedbackHoneypotFilled({ website: '' }), false);
assert.equal(
  createFeedbackMapUrl(
    `${origin}/?feedback=1&lat=35.7&lng=139.7&z=15#temporary`
  ),
  `${origin}/?lat=35.7&lng=139.7&z=15`
);

const migration = readFileSync('migrations/0002_create_feedback_reports.sql', 'utf8');
assert.match(migration, /CREATE TABLE IF NOT EXISTS feedback_reports/);
assert.match(migration, /status TEXT NOT NULL DEFAULT 'pending'/);
assert.doesNotMatch(migration, /email|user_agent|ip_address/i);

console.log('Account-free feedback validation passed.');
