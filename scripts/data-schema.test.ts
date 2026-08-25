import assert from 'node:assert/strict';
import { assertSegmentCollection } from '../src/data/segmentSchema';

function collection(overrides: Record<string, unknown> = {}): unknown {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          id: 'test-segment',
          name: 'Test segment',
          comfort_class: 'B',
          facility_type: 'cycleway',
          car_separation: 'yes',
          pedestrian_shared: 'no',
          parking_conflict: 'unknown',
          verification: 'osm',
          status: 'unknown',
          source: {
            name: 'OpenStreetMap',
            url: 'https://www.openstreetmap.org/way/1',
            retrieved_at: '2026-08-26T00:00:00.000Z'
          },
          ...overrides
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [139.7, 35.6],
            [139.71, 35.61]
          ]
        }
      }
    ]
  };
}

assert.doesNotThrow(() => assertSegmentCollection(collection()));
assert.throws(
  () => assertSegmentCollection(collection({ source: { name: 'Unsafe', url: 'javascript:alert(1)' } })),
  /invalid source.url/
);

const invalidGeometry = collection() as {
  features: Array<{ geometry: { coordinates: unknown } }>;
};
invalidGeometry.features[0].geometry.coordinates = [
  [Number.NaN, 35.6],
  [139.7, 35.61]
];
assert.throws(() => assertSegmentCollection(invalidGeometry), /invalid coordinate/);

console.log('Segment schema tests passed');
