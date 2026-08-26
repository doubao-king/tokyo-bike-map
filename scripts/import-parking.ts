import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import type { BicycleParkingCollection, BicycleParkingFeature } from '../src/types';
import parkingManifest from '../data/parking-sources.json';

interface ManifestSource {
  package_id: string;
  publisher: string;
  title: string;
}

interface CatalogResource {
  format?: string;
  name?: string;
  url?: string;
}

interface CatalogPackage {
  metadata_modified?: string;
  resources?: CatalogResource[];
}

interface CatalogResponse {
  result?: CatalogPackage;
  success?: boolean;
}

interface ParkingCandidate {
  address?: string;
  capacity?: number;
  facilityId?: string;
  latitude?: number;
  longitude?: number;
  municipality: string;
  name: string;
  sourceTitle: string;
  sourceUpdatedAt?: string;
  sourceUrl: string;
}

type CsvRow = Record<string, string>;

const sources = parkingManifest.sources as ManifestSource[];
const cacheDirectory = resolve('data/cache/parking');
const outputPath = resolve('public/data/bicycle-parking.geojson');
const cacheMaxAgeMs = 24 * 60 * 60 * 1000;

const latitudeFields = [
  '公営駐輪場_緯度',
  '所在地_緯度',
  '住所_緯度',
  '緯度',
  '緯度１'
];
const longitudeFields = [
  '公営駐輪場_経度',
  '所在地_経度',
  '住所_経度',
  '経度',
  '経度１'
];
const nameFields = ['公営駐輪場_名称', '施設_名称', '名称', '名称（所在地）'];
const idFields = ['公営駐輪場_ID', '施設_ID', 'ID', 'NO', 'No', '通番'];
const addressFields = [
  '所在地_連結表記',
  '住所_連結表記',
  '所在地',
  '住所',
  '位置'
];
const capacityFields = [
  '公営駐輪場_最大駐輪台数',
  '最大駐輪台数',
  '収容台数_自転車',
  '収容台数',
  '台数（台）'
];

function clean(value: string | undefined): string | undefined {
  const normalized = value?.replace(/^\uFEFF/, '').trim();
  return normalized ? normalized : undefined;
}

function pick(row: CsvRow, fields: string[]): string | undefined {
  for (const field of fields) {
    const value = clean(row[field]);
    if (value) return value;
  }
  return undefined;
}

function parseCoordinate(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCapacity(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.replace(/,/g, '').match(/\d+/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function decodeCsv(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('shift_jis').decode(buffer);
  }
}

async function fetchCached(url: string, cacheName: string): Promise<ArrayBuffer> {
  await mkdir(cacheDirectory, { recursive: true });
  const cachePath = resolve(cacheDirectory, cacheName);
  const isRecent = await stat(cachePath)
    .then((file) => Date.now() - file.mtimeMs <= cacheMaxAgeMs)
    .catch(() => false);

  if (isRecent) {
    const cached = await readFile(cachePath);
    return cached.buffer.slice(cached.byteOffset, cached.byteOffset + cached.byteLength);
  }

  const response = await fetch(url, {
    headers: { 'user-agent': 'TokyoBikeMap/1.0 (+https://tokyo-bike-map.manymao.com)' },
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  const buffer = await response.arrayBuffer();
  await writeFile(cachePath, Buffer.from(buffer));
  return buffer;
}

async function fetchPackage(source: ManifestSource): Promise<CatalogPackage> {
  const url = `https://catalog.data.metro.tokyo.lg.jp/api/3/action/package_show?id=${encodeURIComponent(source.package_id)}`;
  const buffer = await fetchCached(url, `${source.package_id}.json`);
  const payload = JSON.parse(new TextDecoder().decode(buffer)) as CatalogResponse;
  if (!payload.success || !payload.result) throw new Error('Catalog package response was invalid.');
  return payload.result;
}

function rowCandidate(
  row: CsvRow,
  source: ManifestSource,
  metadataModified: string | undefined
): ParkingCandidate | undefined {
  const name = pick(row, nameFields);
  if (!name) return undefined;

  return {
    address: pick(row, addressFields),
    capacity: parseCapacity(pick(row, capacityFields)),
    facilityId: pick(row, idFields),
    latitude: parseCoordinate(pick(row, latitudeFields)),
    longitude: parseCoordinate(pick(row, longitudeFields)),
    municipality: source.publisher,
    name,
    sourceTitle: source.title,
    sourceUpdatedAt: metadataModified?.slice(0, 10),
    sourceUrl: `https://catalog.data.metro.tokyo.lg.jp/dataset/${source.package_id}`
  };
}

function mergeCandidate(target: ParkingCandidate, incoming: ParkingCandidate): ParkingCandidate {
  return {
    ...target,
    address: target.address ?? incoming.address,
    capacity: target.capacity ?? incoming.capacity,
    facilityId: target.facilityId ?? incoming.facilityId,
    latitude: target.latitude ?? incoming.latitude,
    longitude: target.longitude ?? incoming.longitude,
    name: target.name.length >= incoming.name.length ? target.name : incoming.name
  };
}

function candidateKey(source: ManifestSource, candidate: ParkingCandidate): string {
  const identity = candidate.facilityId ?? candidate.name.replace(/[\s　()（）・]/g, '').toLowerCase();
  return `${source.publisher}:${identity}`;
}

function toFeature(candidate: ParkingCandidate, index: number): BicycleParkingFeature | undefined {
  const { latitude, longitude } = candidate;
  if (
    latitude === undefined ||
    longitude === undefined ||
    latitude < 26 ||
    latitude > 36 ||
    longitude < 138.8 ||
    longitude > 143
  ) {
    return undefined;
  }

  return {
    type: 'Feature',
    properties: {
      id: `official-parking-${index + 1}`,
      name: candidate.name,
      municipality: candidate.municipality,
      ...(candidate.address ? { address: candidate.address } : {}),
      ...(candidate.capacity !== undefined ? { capacity: candidate.capacity } : {}),
      source_title: candidate.sourceTitle,
      source_url: candidate.sourceUrl,
      ...(candidate.sourceUpdatedAt ? { source_updated_at: candidate.sourceUpdatedAt } : {})
    },
    geometry: {
      type: 'Point',
      coordinates: [longitude, latitude]
    }
  };
}

const candidates = new Map<string, ParkingCandidate>();
const successfulPublishers = new Set<string>();

for (const source of sources) {
  try {
    const catalogPackage = await fetchPackage(source);
    const csvResources = (catalogPackage.resources ?? []).filter(
      (resource) => resource.format?.toUpperCase() === 'CSV' && resource.url
    );

    for (let index = 0; index < csvResources.length; index += 1) {
      const resource = csvResources[index];
      if (!resource.url) continue;

      try {
        const buffer = await fetchCached(
          resource.url,
          `${source.package_id}-${index}-${encodeURIComponent(resource.name ?? 'resource')}.csv`
        );
        const text = decodeCsv(buffer);
        if (/^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text)) {
          console.warn(`Skipping HTML response for ${source.publisher}: ${resource.name ?? resource.url}`);
          continue;
        }

        const rows = parse(text, {
          bom: true,
          columns: (headers: string[]) => headers.map((header) => header.replace(/^\uFEFF/, '').trim()),
          relax_column_count: true,
          relax_quotes: true,
          skip_empty_lines: true,
          trim: true
        }) as CsvRow[];

        rows.forEach((row) => {
          const candidate = rowCandidate(row, source, catalogPackage.metadata_modified);
          if (!candidate) return;
          const key = candidateKey(source, candidate);
          candidates.set(key, candidates.has(key) ? mergeCandidate(candidates.get(key)!, candidate) : candidate);
        });
      } catch (error) {
        console.warn(
          `Skipping ${source.publisher} resource ${resource.name ?? resource.url}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  } catch (error) {
    console.warn(
      `Skipping ${source.publisher}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

const features = [...candidates.values()]
  .sort((left, right) =>
    `${left.municipality}:${left.name}`.localeCompare(`${right.municipality}:${right.name}`, 'ja')
  )
  .map(toFeature)
  .filter((feature): feature is BicycleParkingFeature => Boolean(feature));

features.forEach((feature) => successfulPublishers.add(feature.properties.municipality));

if (features.length < 100 || successfulPublishers.size < 10) {
  throw new Error(
    `Parking import produced insufficient coverage: ${features.length} facilities across ${successfulPublishers.size} municipalities.`
  );
}

const collection: BicycleParkingCollection & { metadata: Record<string, unknown> } = {
  type: 'FeatureCollection',
  metadata: {
    generated_at: new Date().toISOString(),
    municipalities: [...successfulPublishers].sort((left, right) => left.localeCompare(right, 'ja')),
    source: 'Tokyo Open Data Catalog municipal datasets',
    source_checked: parkingManifest.last_checked
  },
  features
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(collection)}\n`, 'utf8');
console.log(
  `Wrote ${features.length} official bicycle-parking facilities from ${successfulPublishers.size} municipalities to ${outputPath}`
);
