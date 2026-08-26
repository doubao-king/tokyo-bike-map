import assert from 'node:assert/strict';
import { assertParkingCollection } from '../src/data/loadParking';

const valid = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'parking-1',
        name: 'Test bicycle parking',
        municipality: 'Test City',
        capacity: 100,
        source_title: 'Official dataset',
        source_url: 'https://example.test/dataset'
      },
      geometry: { type: 'Point', coordinates: [139.7, 35.7] }
    }
  ]
};

assert.doesNotThrow(() => assertParkingCollection(valid));
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
