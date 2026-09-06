import assert from 'node:assert/strict';
import { assertPumpCollection } from '../src/data/loadPumps';

const valid = {
  type: 'FeatureCollection',
  metadata: {
    counts: { free: 1, paid: 0, unknown: 0 },
    generated_at: '2026-09-06T00:00:00.000Z',
    source_checked: '2026-09-06'
  },
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'pump-osm-node-1',
        name: 'Test pump',
        facility_type: 'public_pump',
        cost: 'free',
        source_title: 'OpenStreetMap',
        source_url: 'https://www.openstreetmap.org/node/1',
        source_checked_at: '2026-09-06',
        verification: 'osm'
      },
      geometry: { type: 'Point', coordinates: [139.7, 35.7] }
    }
  ]
};

assert.doesNotThrow(() => assertPumpCollection(valid));
assert.throws(
  () => assertPumpCollection({ ...valid, metadata: undefined }),
  /metadata is missing source information/
);
assert.throws(
  () =>
    assertPumpCollection({
      ...valid,
      features: [{ ...valid.features[0], properties: { ...valid.features[0].properties, cost: 'maybe' } }]
    }),
  /invalid cost/
);
assert.throws(
  () =>
    assertPumpCollection({
      ...valid,
      features: [{ ...valid.features[0], geometry: { type: 'Point', coordinates: [0, 0] } }]
    }),
  /invalid Tokyo coordinates/
);

console.log('Bicycle-pump schema tests passed.');
