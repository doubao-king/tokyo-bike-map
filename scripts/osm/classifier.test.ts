import assert from 'node:assert/strict';
import { classifyOsmWay, shouldIncludeOsmWay } from './classifier';

assert.equal(
  shouldIncludeOsmWay({ highway: 'cycleway', cycleway: 'crossing', crossing: 'uncontrolled' }),
  false
);
assert.equal(shouldIncludeOsmWay({ highway: 'path', bicycle: 'no' }), false);

assert.deepEqual(
  classifyOsmWay({ highway: 'cycleway', segregated: 'yes', bicycle: 'designated' }),
  {
    comfortClass: 'A',
    facilityType: 'cycleway',
    carSeparation: 'yes',
    pedestrianShared: 'no',
    parkingConflict: 'unknown',
    confidence: 'high',
    notes: 'Preliminary OSM classification for an independently mapped cycleway.'
  }
);

assert.equal(classifyOsmWay({ highway: 'cycleway', foot: 'yes' }).comfortClass, 'B');
assert.equal(classifyOsmWay({ highway: 'primary', 'cycleway:left': 'separate' }).confidence, 'low');
assert.equal(classifyOsmWay({ highway: 'primary', cycleway: 'lane' }).comfortClass, 'C');
assert.equal(
  classifyOsmWay({ highway: 'tertiary', bicycle: 'designated' }).comfortClass,
  'D'
);
assert.equal(
  classifyOsmWay({ highway: 'path', bicycle: 'designated', segregated: 'no' }).comfortClass,
  'B'
);
assert.equal(
  classifyOsmWay({ highway: 'footway', bicycle: 'designated', segregated: 'yes' }).comfortClass,
  'B'
);

console.log('OSM classifier tests passed');
