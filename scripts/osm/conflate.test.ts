import assert from 'node:assert/strict';
import type { LineString, Position } from 'geojson';
import type {
  ComfortClass,
  CyclingSegmentCollection,
  CyclingSegmentFeature
} from '../../src/types';
import { conflateComfortSegments } from './conflate';

function segment(
  id: string,
  comfortClass: ComfortClass,
  coordinates: Position[]
): CyclingSegmentFeature {
  return {
    type: 'Feature',
    properties: {
      id,
      name: id,
      comfort_class: comfortClass,
      facility_type: 'test',
      car_separation: comfortClass === 'D' ? 'no' : 'yes',
      pedestrian_shared: 'no',
      parking_conflict: 'unknown',
      verification: 'demo',
      source: { name: 'Conflation regression test' },
      status: 'built'
    },
    geometry: { type: 'LineString', coordinates }
  };
}

const strongCoordinates: Position[] = [
  [139.7, 35.6],
  [139.701, 35.6]
];
const crossingCoordinates: Position[] = [
  [139.7005, 35.5995],
  [139.7005, 35.6005]
];

const input: CyclingSegmentCollection = {
  type: 'FeatureCollection',
  features: [
    segment('strong-b', 'B', strongCoordinates),
    segment('d-with-tails', 'D', [
      [139.6997, 35.60002],
      [139.7013, 35.60002]
    ]),
    segment('d-crossing', 'D', crossingCoordinates),
    segment('d-duplicate', 'D', strongCoordinates)
  ]
};

const { collection, stats } = conflateComfortSegments(input);

assert.equal(stats.fullySuppressed, 1);
assert.equal(stats.trimmed, 1);
assert.equal(collection.features.length, 3);
assert.ok(stats.suppressedMeters > 80);
assert.equal(
  collection.features.some((feature) => feature.properties.id === 'd-duplicate'),
  false
);

const tailedFeature = collection.features.find(
  (feature) => feature.properties.id === 'd-with-tails'
);
assert.ok(tailedFeature);
assert.equal(tailedFeature.geometry.type, 'MultiLineString');
assert.equal(tailedFeature.geometry.coordinates.length, 2);

const crossingFeature = collection.features.find(
  (feature) => feature.properties.id === 'd-crossing'
);
assert.ok(crossingFeature);
assert.deepEqual((crossingFeature.geometry as LineString).coordinates, crossingCoordinates);

console.log('OSM conflation tests passed');
