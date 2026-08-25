import assert from 'node:assert/strict';
import { validateLaunchConfig } from './launch-config';

assert.deepEqual(
  validateLaunchConfig({ attribution: '', dataLicenseExists: false, tileUrl: '' }),
  [
    'VITE_TILE_URL is required for launch.',
    'VITE_TILE_ATTRIBUTION is required for launch.',
    'public/data/LICENSE.md is required for launch.'
  ]
);

assert.ok(
  validateLaunchConfig({
    attribution:
      '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    dataLicenseExists: true,
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  }).some((error) => error.includes('community tile.openstreetmap.org'))
);

assert.ok(
  validateLaunchConfig({
    attribution:
      '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    dataLicenseExists: true,
    tileUrl: 'https://your-tile-provider.example/{z}/{x}/{y}.png'
  }).some((error) => error.includes('example tile provider'))
);

assert.ok(
  validateLaunchConfig({
    attribution:
      '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    dataLicenseExists: true,
    tileUrl: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png'
  }).some((error) => error.includes('Stadia Maps attribution'))
);

assert.deepEqual(
  validateLaunchConfig({
    attribution:
      '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    dataLicenseExists: true,
    tileUrl: 'https://tiles.example.com/{z}/{x}/{y}.png'
  }),
  []
);

console.log('Launch configuration tests passed');
