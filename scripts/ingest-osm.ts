import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { Feature, FeatureCollection, LineString, Position } from 'geojson';
import { buildOsmProperties, shouldIncludeOsmWay, type OsmWayTags } from './osm/classifier';
import { conflateComfortSegments } from './osm/conflate';
import type { CyclingSegmentCollection, CyclingSegmentProperties } from '../src/types';

interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
}

interface OverpassWay {
  type: 'way';
  id: number;
  nodes: number[];
  tags?: OsmWayTags;
}

interface OverpassResponse {
  elements: Array<OverpassNode | OverpassWay>;
}

const tokyoQueryRegions = [
  { name: 'mainland-west', bbox: '35.45,138.90,35.92,139.52', filterToTokyo: true },
  { name: 'mainland-east-southwest', bbox: '35.45,139.52,35.69,139.74', filterToTokyo: true },
  { name: 'mainland-east-southeast', bbox: '35.45,139.74,35.69,139.96', filterToTokyo: true },
  { name: 'mainland-east-northwest', bbox: '35.69,139.52,35.92,139.74', filterToTokyo: true },
  { name: 'mainland-east-northeast', bbox: '35.69,139.74,35.92,139.96', filterToTokyo: true },
  { name: 'izu-islands', bbox: '32.30,139.00,34.90,140.10', filterToTokyo: false },
  { name: 'ogasawara-chichijima', bbox: '27.00,142.10,27.14,142.26', filterToTokyo: false },
  { name: 'ogasawara-hahajima', bbox: '26.58,142.10,26.72,142.26', filterToTokyo: false }
] as const;

const overpassEndpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
] as const;
const cacheMaxAgeMs = 6 * 60 * 60 * 1000;
const overpassUserAgent =
  process.env.OSM_USER_AGENT?.trim() || 'TokyoBikeMap-development/0.1';
const tokyoIslandBounds = [
  [34.65, 139.3, 34.85, 139.5],
  [34.48, 139.25, 34.55, 139.32],
  [34.2, 139.15, 34.46, 139.35],
  [34.15, 139.1, 34.27, 139.25],
  [33.98, 139.45, 34.15, 139.62],
  [33.82, 139.55, 33.93, 139.67],
  [33.0, 139.72, 33.18, 139.9],
  [32.43, 139.72, 32.5, 139.8],
  [27.0, 142.1, 27.14, 142.26],
  [26.58, 142.1, 26.72, 142.26]
] as const;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
}

interface IngestArgs {
  area?: 'tokyo';
  bbox?: string;
  out: string;
}

function parseArgs(argv: string[]): IngestArgs {
  const args = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];

    if (!key?.startsWith('--') || !value) {
      throw new Error(
        'Usage: npm run ingest:osm -- --area tokyo --out public/data/osm-segments.geojson'
      );
    }

    args.set(key, value);
  }

  const bbox = args.get('--bbox');
  const area = args.get('--area');
  const out = args.get('--out') ?? 'public/data/osm-segments.geojson';

  if (area !== undefined && area !== 'tokyo') {
    throw new Error('Only --area tokyo is currently supported.');
  }

  if (!area && (!bbox || bbox.split(',').length !== 4)) {
    throw new Error('Provide --area tokyo or --bbox "south,west,north,east".');
  }

  return { area: area as 'tokyo' | undefined, bbox, out };
}

function buildOverpassQuery({ area, bbox }: IngestArgs): string {
  if (!bbox) {
    throw new Error('An Overpass query region is required.');
  }

  const scope = area === 'tokyo' ? `(area.searchArea)(${bbox})` : `(${bbox})`;
  const areaSetup =
    area === 'tokyo'
      ? 'area["ISO3166-2"="JP-13"]["boundary"="administrative"]->.searchArea;'
      : '';

  return [
    '[out:json][timeout:180];',
    areaSetup,
    '(',
    `way["highway"="cycleway"]${scope};`,
    `way["cycleway"]${scope};`,
    `way["cycleway:left"]${scope};`,
    `way["cycleway:right"]${scope};`,
    `way["bicycle"="designated"]${scope};`,
    `way["highway"="path"]["bicycle"]${scope};`,
    `way["highway"="pedestrian"]["bicycle"]${scope};`,
    ');',
    'out body;',
    '>;',
    'out skel qt;'
  ].join('');
}

async function fetchOverpass(query: string): Promise<OverpassResponse> {
  const errors: string[] = [];

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    for (const endpoint of overpassEndpoints) {
      let response: Response;

      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'user-agent': overpassUserAgent
          },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(200_000)
        });
      } catch (error) {
        errors.push(`${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
        console.warn('Overpass request failed before receiving a response; trying the next mirror.');
        continue;
      }

      if (response.ok) {
        const payload: unknown = await response.json();
        if (
          typeof payload !== 'object' ||
          payload === null ||
          !Array.isArray((payload as { elements?: unknown }).elements)
        ) {
          errors.push(`${endpoint}: response did not contain an elements array`);
          continue;
        }
        return payload as OverpassResponse;
      }

      const errorBody = await response.text();
      errors.push(`${endpoint}: ${response.status} ${response.statusText} ${errorBody.slice(0, 160)}`);
      console.warn(`Overpass endpoint failed (${response.status}); trying the next mirror.`);
    }

    if (attempt < 3) {
      const retryDelay = attempt * 10_000;
      console.warn(`Waiting ${retryDelay / 1000}s before Overpass retry ${attempt + 1}.`);
      await wait(retryDelay);
    }
  }

  throw new Error(`All Overpass endpoints failed:\n${errors.join('\n')}`);
}

function mergeOverpassResponses(responses: OverpassResponse[]): OverpassResponse {
  const elements = new Map<string, OverpassNode | OverpassWay>();

  responses.forEach((response) => {
    response.elements.forEach((element) => {
      elements.set(`${element.type}:${element.id}`, element);
    });
  });

  return { elements: [...elements.values()] };
}

async function fetchTokyo(): Promise<OverpassResponse> {
  const responses: OverpassResponse[] = [];
  const cacheDirectory = resolve('data/cache/osm');
  await mkdir(cacheDirectory, { recursive: true });

  for (let index = 0; index < tokyoQueryRegions.length; index += 1) {
    const region = tokyoQueryRegions[index];
    const cachePath = resolve(cacheDirectory, `${region.name}.json`);
    const cached = await stat(cachePath)
      .then((file) => Date.now() - file.mtimeMs <= cacheMaxAgeMs)
      .catch(() => false);

    if (cached) {
      console.log(`Using recent Tokyo ${region.name} fetch.`);
      responses.push(JSON.parse(await readFile(cachePath, 'utf8')) as OverpassResponse);
      continue;
    }

    console.log(`Fetching Tokyo ${region.name}...`);
    const response = await fetchOverpass(
      buildOverpassQuery({
        area: region.filterToTokyo ? 'tokyo' : undefined,
        bbox: region.bbox,
        out: ''
      })
    );
    responses.push(response);
    await writeFile(cachePath, JSON.stringify(response), 'utf8');

    if (index < tokyoQueryRegions.length - 1) {
      await wait(4_000);
    }
  }

  return mergeOverpassResponses(responses);
}

type OsmLineSegmentFeature = Feature<LineString, CyclingSegmentProperties>;

function convertToSegments(data: OverpassResponse): FeatureCollection<LineString, CyclingSegmentProperties> {
  const retrievedAt = new Date().toISOString();
  const nodes = new Map<number, OverpassNode>();

  data.elements.forEach((element) => {
    if (element.type === 'node') {
      nodes.set(element.id, element);
    }
  });

  const features: OsmLineSegmentFeature[] = [];

  data.elements
    .filter((element): element is OverpassWay => element.type === 'way')
    .filter((way) => shouldIncludeOsmWay(way.tags ?? {}))
    .forEach((way) => {
      const coordinates: Position[] = way.nodes
        .map((nodeId) => nodes.get(nodeId))
        .filter((node): node is OverpassNode => Boolean(node))
        .map((node) => [node.lon, node.lat]);

      if (coordinates.length >= 2) {
        features.push({
          type: 'Feature',
          properties: buildOsmProperties({
            id: `osm-way-${way.id}`,
            tags: way.tags ?? {},
            retrievedAt,
            source: {
              name: 'OpenStreetMap',
              url: `https://www.openstreetmap.org/way/${way.id}`,
              retrieved_at: retrievedAt,
              license: 'ODbL'
            }
          }),
          geometry: {
            type: 'LineString',
            coordinates
          }
        });
      }
    });

  return {
    type: 'FeatureCollection',
    features
  };
}

function filterToTokyoCoverage(segments: CyclingSegmentCollection): CyclingSegmentCollection {
  return {
    ...segments,
    features: segments.features.filter((feature) => {
      const lines =
        feature.geometry.type === 'LineString'
          ? [feature.geometry.coordinates]
          : feature.geometry.coordinates;
      const [longitude, latitude] = lines[0][0];

      if (latitude >= 35) {
        return true;
      }

      return tokyoIslandBounds.some(
        ([south, west, north, east]) =>
          latitude >= south && latitude <= north && longitude >= west && longitude <= east
      );
    })
  };
}

const ingestArgs = parseArgs(process.argv.slice(2));
const { out } = ingestArgs;
const outputPath = resolve(out);
const overpassData =
  ingestArgs.area === 'tokyo'
    ? await fetchTokyo()
    : await fetchOverpass(buildOverpassQuery(ingestArgs));
const convertedSegments = convertToSegments(overpassData) as CyclingSegmentCollection;
const rawSegments =
  ingestArgs.area === 'tokyo' ? filterToTokyoCoverage(convertedSegments) : convertedSegments;
const { collection: segments, stats } = conflateComfortSegments(rawSegments);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(segments)}\n`, 'utf8');

console.log(
  `Wrote ${segments.features.length} preliminary OSM segments to ${outputPath} ` +
    `(${stats.fullySuppressed} D features removed, ${stats.trimmed} trimmed, ` +
    `${stats.suppressedMeters} overlapping metres suppressed)`
);
