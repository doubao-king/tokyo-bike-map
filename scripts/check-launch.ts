import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';
import { productionTileDefaults } from '../src/map/tileConfig';
import { validateLaunchConfig } from './launch-config';

const env = loadEnv('production', process.cwd(), '');
const tileUrl = env.VITE_TILE_URL?.trim() || productionTileDefaults.url;
const attribution = env.VITE_TILE_ATTRIBUTION?.trim() || productionTileDefaults.attribution;
const dataLicenseExists = await access(resolve('public/data/LICENSE.md'))
  .then(() => true)
  .catch(() => false);
const errors = validateLaunchConfig({ attribution, dataLicenseExists, tileUrl });

if (errors.length > 0) {
  console.error(`Launch preflight failed:\n- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Launch preflight passed.');
}
