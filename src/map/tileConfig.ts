export interface TileConfig {
  attribution: string;
  maxZoom: number;
  url: string;
}

const stadiaTileUrl = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';
const stadiaAttribution =
  '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noreferrer">Stadia Maps</a> ' +
  '&copy; <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> ' +
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

export const productionTileDefaults: TileConfig = {
  attribution: stadiaAttribution,
  maxZoom: 20,
  url: stadiaTileUrl
};

function configuredMaxZoom(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 24 ? parsed : 19;
}

export function getTileConfig(): TileConfig {
  return {
    url: import.meta.env.VITE_TILE_URL?.trim() || productionTileDefaults.url,
    attribution: import.meta.env.VITE_TILE_ATTRIBUTION?.trim() || productionTileDefaults.attribution,
    maxZoom: configuredMaxZoom(import.meta.env.VITE_TILE_MAX_ZOOM ?? String(productionTileDefaults.maxZoom))
  };
}
