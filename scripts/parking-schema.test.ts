import assert from 'node:assert/strict';
import { assertParkingCollection } from '../src/data/loadParking';

const valid = {
  type: 'FeatureCollection',
  metadata: {
    generated_at: '2026-08-27T00:00:00.000Z',
    municipalities: ['Test City'],
    source: 'Official source',
    source_checked: '2026-08-27',
    source_updated_at: '2026-04-02',
    coverage: { wards: 0, cities: 1, other_municipalities: 0 }
  },
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'parking-1',
        name: 'Test bicycle parking',
        municipality: 'Test City',
        capacity: 100,
        source_publisher: 'Test City',
        source_title: 'Official dataset',
        source_url: 'https://example.test/dataset'
      },
      geometry: { type: 'Point', coordinates: [139.7, 35.7] }
    }
  ]
};

assert.doesNotThrow(() => assertParkingCollection(valid));
assert.throws(
  () => assertParkingCollection({ type: 'FeatureCollection', features: valid.features }),
  /metadata is missing coverage/
);
assert.throws(
  () =>
    assertParkingCollection({
      ...valid,
      features: [{ ...valid.features[0], geometry: { type: 'Point', coordinates: [0, 0] } }]
    }),
  /invalid Tokyo coordinates/
);
assert.throws(
  () =>
    assertParkingCollection({
      ...valid,
      features: [{ ...valid.features[0], properties: { ...valid.features[0].properties, name: '' } }]
    }),
  /missing name/
);

console.log('Bicycle-parking schema tests passed.');
