import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type {
  BicycleParkingCollection,
  BicyclePumpCollection,
  BicyclePumpCost,
  BicyclePumpFeature,
  BicyclePumpFacilityType,
  BicyclePumpProperties
} from '../src/types';
import pumpManifest from '../data/pump-sources.json';

interface OverpassElement {
  center?: { lat: number; lon: number };
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  type: 'node' | 'relation' | 'way';
}

interface OverpassResponse {
  elements: OverpassElement[];
}

interface ChainSource {
  id: string;
  names: string[];
  publisher: string;
  title: string;
  url: string;
}

interface OfficialFacility {
  cost: BicyclePumpCost;
  parking_id: string;
  title: string;
  url: string;
}

interface DirectFacility {
  coordinates: [number, number];
  cost: BicyclePumpCost;
  facility_type: BicyclePumpFacilityType;
  id: string;
  name: string;
  opening_hours?: string;
  operator?: string;
  service_source_title?: string;
  service_source_url?: string;
  source_title: string;
  source_url: string;
  verification: BicyclePumpProperties['verification'];
}

const tokyoMainlandRegions = [
  '35.45,138.90,35.92,139.52',
  '35.45,139.52,35.69,139.74',
  '35.45,139.74,35.69,139.96',
  '35.69,139.52,35.92,139.74',
  '35.69,139.74,35.92,139.96'
] as const;
const overpassEndpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
] as const;
const chains = pumpManifest.chains as ChainSource[];
const directFacilities = pumpManifest.direct_facilities as DirectFacility[];
const officialFacilities = pumpManifest.official_facilities as OfficialFacility[];
const cacheDirectory = resolve('data/cache/pumps');
const outputPath = resolve('public/data/bicycle-pumps.geojson');
const cacheMaxAgeMs = 24 * 60 * 60 * 1000;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
}

function queryForRegion(bbox: string): string {
  const chainNames = chains.flatMap((chain) => chain.names).join('|');
  return [
    '[out:json][timeout:120];',
    'area["ISO3166-2"="JP-13"]["boundary"="administrative"]->.tokyo;',
    '(',
    `nwr["service:bicycle:pump"="yes"](area.tokyo)(${bbox});`,
    `nwr["shop"="bicycle"]["name"~"${chainNames}",i](area.tokyo)(${bbox});`,
    ');',
    'out center tags;'
  ].join('');
}

async function fetchOverpass(query: string): Promise<OverpassResponse> {
  const errors: string[] = [];

  for (const endpoint of overpassEndpoints) {
    try {
      const response = await fetch(endpoint, {
        body: new URLSearchParams({ data: query }),
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'user-agent': 'TokyoBikeMap/1.0 (+https://tokyo-bike-map.manymao.com)'
        },
        method: 'POST',
        signal: AbortSignal.timeout(150_000)
      });
      if (response.ok) return (await response.json()) as OverpassResponse;
      errors.push(`${endpoint}: ${response.status} ${response.statusText}`);
    } catch (error) {
      errors.push(`${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`All Overpass endpoints failed:\n${errors.join('\n')}`);
}

async function fetchRegion(bbox: string, index: number): Promise<OverpassResponse> {
  await mkdir(cacheDirectory, { recursive: true });
  const cachePath = resolve(cacheDirectory, `tokyo-mainland-${index + 1}.json`);
  const cached = await stat(cachePath)
    .then((file) => Date.now() - file.mtimeMs <= cacheMaxAgeMs)
    .catch(() => false);

  if (cached) return JSON.parse(await readFile(cachePath, 'utf8')) as OverpassResponse;

  const response = await fetchOverpass(queryForRegion(bbox));
  await writeFile(cachePath, JSON.stringify(response), 'utf8');
  return response;
}

function chainForName(name: string): ChainSource | undefined {
  const normalized = name.trim().toLocaleLowerCase('ja');
  if (normalized.startsWith('リサイクル')) return undefined;

  return chains.find((chain) =>
    chain.names.some((candidate) => normalized.startsWith(candidate.toLocaleLowerCase('ja')))
  );
}

function osmFeature(element: OverpassElement): BicyclePumpFeature | undefined {
  const tags = element.tags ?? {};
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (latitude === undefined || longitude === undefined) return undefined;

  const chain = tags.name ? chainForName(tags.name) : undefined;
  const hasExplicitPump = tags['service:bicycle:pump'] === 'yes';
  if (!chain && !hasExplicitPump) return undefined;
  const explicitFee = tags.fee?.toLocaleLowerCase('en');
  const cost: BicyclePumpCost = chain || explicitFee === 'no'
    ? 'free'
    : explicitFee && explicitFee !== 'free'
    ? 'paid'
    : 'free';

  const properties: BicyclePumpProperties = {
    id: `osm-${element.type}-${element.id}`,
    name: tags.name ?? tags.operator ?? '公共の空気入れ',
    facility_type: tags.shop === 'bicycle' ? 'bicycle_shop' : 'public_pump',
    cost,
    ...(tags.opening_hours ? { opening_hours: tags.opening_hours } : {}),
    ...(tags.operator ? { operator: tags.operator } : {}),
    ...(tags.valves ? { valves: tags.valves } : {}),
    source_title: 'OpenStreetMap',
    source_url: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    ...(chain
      ? { service_source_title: chain.title, service_source_url: chain.url }
      : {}),
    source_checked_at: pumpManifest.last_checked,
    verification: chain ? 'official+osm' : 'osm'
  };

  return {
    type: 'Feature',
    properties,
    geometry: { type: 'Point', coordinates: [longitude, latitude] }
  };
}

function officialFeatures(parking: BicycleParkingCollection): BicyclePumpFeature[] {
  const parkingById = new Map(parking.features.map((feature) => [feature.properties.id, feature]));

  return officialFacilities.map((facility) => {
    const parkingFeature = parkingById.get(facility.parking_id);
    if (!parkingFeature) throw new Error(`Pump source refers to missing parking ${facility.parking_id}.`);

    return {
      type: 'Feature',
      properties: {
        id: `pump-${facility.parking_id}`,
        name: parkingFeature.properties.name,
        facility_type: 'parking_facility',
        cost: facility.cost,
        operator: parkingFeature.properties.municipality,
        source_title: facility.title,
        source_url: facility.url,
        source_checked_at: pumpManifest.last_checked,
        verification: 'official'
      },
      geometry: parkingFeature.geometry
    };
  });
}

function directFeatures(): BicyclePumpFeature[] {
  return directFacilities.map((facility) => ({
    type: 'Feature',
    properties: {
      id: facility.id,
      name: facility.name,
      facility_type: facility.facility_type,
      cost: facility.cost,
      ...(facility.opening_hours ? { opening_hours: facility.opening_hours } : {}),
      ...(facility.operator ? { operator: facility.operator } : {}),
      source_title: facility.source_title,
      source_url: facility.source_url,
      ...(facility.service_source_title
        ? { service_source_title: facility.service_source_title }
        : {}),
      ...(facility.service_source_url
        ? { service_source_url: facility.service_source_url }
        : {}),
      source_checked_at: pumpManifest.last_checked,
      verification: facility.verification
    },
    geometry: { type: 'Point', coordinates: facility.coordinates }
  }));
}

const responses: OverpassResponse[] = [];
for (let index = 0; index < tokyoMainlandRegions.length; index += 1) {
  console.log(`Fetching bicycle pumps for Tokyo region ${index + 1}/${tokyoMainlandRegions.length}...`);
  responses.push(await fetchRegion(tokyoMainlandRegions[index], index));
  if (index < tokyoMainlandRegions.length - 1) await wait(2_000);
}

const elements = new Map<string, OverpassElement>();
responses.forEach((response) => {
  response.elements.forEach((element) => elements.set(`${element.type}:${element.id}`, element));
});

const parking = JSON.parse(
  await readFile(resolve('public/data/bicycle-parking.geojson'), 'utf8')
) as BicycleParkingCollection;
const features = [
  ...[...elements.values()].map(osmFeature).filter((value): value is BicyclePumpFeature => Boolean(value)),
  ...officialFeatures(parking),
  ...directFeatures()
].sort((left, right) => left.properties.name.localeCompare(right.properties.name, 'ja'));
const counts: Record<BicyclePumpCost, number> = { free: 0, paid: 0, unknown: 0 };
features.forEach((feature) => {
  counts[feature.properties.cost] += 1;
});

const collection: BicyclePumpCollection = {
  type: 'FeatureCollection',
  metadata: {
    counts,
    generated_at: new Date().toISOString(),
    source_checked: pumpManifest.last_checked
  },
  features
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(collection)}\n`, 'utf8');
console.log(
  `Wrote ${features.length} bicycle pumps to ${outputPath} ` +
    `(free ${counts.free}, paid ${counts.paid}, unknown ${counts.unknown})`
);
