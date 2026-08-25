export interface LaunchConfig {
  attribution: string;
  dataLicenseExists: boolean;
  tileUrl: string;
}

export function validateLaunchConfig(config: LaunchConfig): string[] {
  const errors: string[] = [];

  if (!config.tileUrl) {
    errors.push('VITE_TILE_URL is required for launch.');
  } else {
    if (config.tileUrl.includes('tile.openstreetmap.org')) {
      errors.push('Commercial launch must not rely on the community tile.openstreetmap.org service.');
    }
    if (config.tileUrl.includes('your-tile-provider.example')) {
      errors.push('VITE_TILE_URL still contains the example tile provider.');
    }
    ['{z}', '{x}', '{y}'].forEach((placeholder) => {
      if (!config.tileUrl.includes(placeholder)) {
        errors.push(`VITE_TILE_URL is missing ${placeholder}.`);
      }
    });
    try {
      const checkableUrl = config.tileUrl
        .replace('{z}', '0')
        .replace('{x}', '0')
        .replace('{y}', '0')
        .replace('{s}', 'a');
      if (new URL(checkableUrl).protocol !== 'https:') {
        errors.push('VITE_TILE_URL must use HTTPS.');
      }
    } catch {
      errors.push('VITE_TILE_URL is not a valid URL template.');
    }
  }

  if (!config.attribution) {
    errors.push('VITE_TILE_ATTRIBUTION is required for launch.');
  } else {
    if (!config.attribution.includes('OpenStreetMap')) {
      errors.push('Tile attribution must credit OpenStreetMap.');
    }
    if (!config.attribution.includes('openstreetmap.org/copyright')) {
      errors.push('Tile attribution must link to OpenStreetMap licence information.');
    }
    if (config.tileUrl.includes('stadiamaps.com') && !config.attribution.includes('Stadia Maps')) {
      errors.push('Stadia Maps tiles require Stadia Maps attribution.');
    }
    if (config.tileUrl.includes('stadiamaps.com') && !config.attribution.includes('OpenMapTiles')) {
      errors.push('Stadia Maps tiles require OpenMapTiles attribution.');
    }
  }

  if (!config.dataLicenseExists) {
    errors.push('public/data/LICENSE.md is required for launch.');
  }

  return errors;
}
