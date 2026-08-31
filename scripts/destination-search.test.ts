import assert from 'node:assert/strict';
import {
  parseDestinationDetails,
  parseDestinationSuggestions
} from '../src/data/destinationSearch';
import {
  destinationFromUrl,
  destinationPath,
  destinationTargets,
  writeDestinationToUrl
} from '../src/destinations';
import { distanceMeters, findNearbyParking } from '../src/map/nearbyParking';
import type { BicycleParkingFeature } from '../src/types';

const suggestions = parseDestinationSuggestions({
  features: [
    {
      properties: {
        coarse_location: '千代田区, 東京都, 日本',
        gid: 'place:tokyo-station',
        name: '東京駅'
      }
    },
    {
      properties: {
        coarse_location: '大阪市, 大阪府, 日本',
        gid: 'place:osaka-station',
        name: '大阪駅'
      }
    },
    {
      properties: {
        coarse_location: '新宿区, 東京都, 日本',
        gid: 'place:parking',
        name: '新宿駅東口自転車駐輪場'
      }
    },
    {
      properties: {
        coarse_location: '千代田区, 東京都, 日本',
        gid: 'place:tokyo-station-duplicate',
        name: '東京駅'
      }
    }
  ]
});

assert.deepEqual(suggestions, [
  {
    context: '千代田区, 東京都, 日本',
    id: 'place:tokyo-station',
    name: '東京駅'
  }
]);

const destination = parseDestinationDetails(
  {
    features: [
      {
        geometry: { coordinates: [139.7671, 35.6812], type: 'Point' },
        properties: {
          coarse_location: '千代田区, 東京都, 日本',
          name: '東京駅'
        }
      }
    ]
  },
  suggestions[0]
);
assert.equal(destination?.latitude, 35.6812);
assert.equal(destination?.longitude, 139.7671);
assert.equal(
  parseDestinationDetails(
    { features: [{ geometry: { coordinates: [135.5, 34.7], type: 'Point' } }] },
    suggestions[0]
  ),
  undefined
);

function parking(id: string, latitude: number, longitude: number): BicycleParkingFeature {
  return {
    type: 'Feature',
    geometry: { coordinates: [longitude, latitude], type: 'Point' },
    properties: {
      id,
      municipality: '千代田区',
      name: id,
      source_title: 'Official source',
      source_url: 'https://example.com'
    }
  };
}

const nearby = findNearbyParking(
  [
    parking('far', 35.7, 139.7671),
    parking('near', 35.682, 139.7671),
    {
      ...parking('duplicate-id', 35.682, 139.7671),
      properties: {
        ...parking('duplicate-id', 35.682, 139.7671).properties,
        name: 'near'
      }
    },
    parking('middle', 35.686, 139.7671)
  ],
  35.6812,
  139.7671,
  2,
  2_000
);
assert.deepEqual(nearby.map(({ feature }) => feature.properties.id), ['near', 'middle']);
assert.ok(distanceMeters(35.6812, 139.7671, 35.682, 139.7671) > 80);
assert.ok(distanceMeters(35.6812, 139.7671, 35.682, 139.7671) < 100);

assert.equal(new Set(destinationTargets.map(({ id }) => id)).size, destinationTargets.length);
assert.equal(destinationPath('tokyo-station'), '/parking/tokyo-station/');
assert.deepEqual(
  destinationFromUrl('/parking/tokyo-station/', new URLSearchParams(), 'en'),
  {
    context: 'Marunouchi, Chiyoda',
    id: 'curated:tokyo-station',
    latitude: 35.68124,
    longitude: 139.76712,
    name: 'Tokyo Station'
  }
);

const sharedDestination = destinationFromUrl(
  '/',
  new URLSearchParams({
    destination: '東京タワー',
    destinationContext: '港区, 東京都',
    dlat: '35.65858',
    dlng: '139.74543'
  }),
  'ja'
);
assert.equal(sharedDestination?.name, '東京タワー');
assert.equal(sharedDestination?.latitude, 35.65858);
assert.equal(
  destinationFromUrl(
    '/',
    new URLSearchParams({ destination: 'Invalid', dlat: '0', dlng: '0' }),
    'en'
  ),
  undefined
);

const sharedParams = new URLSearchParams();
writeDestinationToUrl(sharedParams, sharedDestination, '/');
assert.equal(sharedParams.get('destination'), '東京タワー');
assert.equal(sharedParams.get('dlat'), '35.65858');

const curatedParams = new URLSearchParams({ destination: 'old value' });
writeDestinationToUrl(
  curatedParams,
  destinationFromUrl('/parking/tokyo-station/', new URLSearchParams(), 'ja'),
  '/parking/tokyo-station/'
);
assert.equal(curatedParams.has('destination'), false);

console.log('Destination search parsing and nearby parking checks passed.');
