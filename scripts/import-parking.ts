import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import type { BicycleParkingCollection, BicycleParkingFeature } from '../src/types';
import parkingManifest from '../data/parking-sources.json';

interface ParkingSource {
  data_url: string;
  publisher: string;
  source_updated_at?: string;
  source_url: string;
  title: string;
}

interface ParkingCandidate {
  address?: string;
  capacity?: number;
  facilityId: string;
  latitude: number;
  longitude: number;
  municipality: string;
  name: string;
  sourcePublisher: string;
  sourceTitle: string;
  sourceUpdatedAt?: string;
  sourceUrl: string;
}

type CsvRow = Record<string, string>;

const primary = parkingManifest.primary as ParkingSource;
const supplements = parkingManifest.supplements as ParkingSource[];
const cacheDirectory = resolve('data/cache/parking');
const outputPath = resolve('public/data/bicycle-parking.geojson');
const cacheMaxAgeMs = 24 * 60 * 60 * 1000;

const wards = [
  '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区', '江東区',
  '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区', '杉並区', '豊島区',
  '北区', '荒川区', '板橋区', '練馬区', '足立区', '葛飾区', '江戸川区'
];
const cities = [
  '八王子市', '立川市', '武蔵野市', '三鷹市', '青梅市', '府中市', '昭島市', '調布市',
  '町田市', '小金井市', '小平市', '日野市', '東村山市', '国分寺市', '国立市', '福生市',
  '狛江市', '東大和市', '清瀬市', '東久留米市', '武蔵村山市', '多摩市', '稲城市',
  '羽村市', 'あきる野市', '西東京市'
];

const latitudeFields = ['公営駐輪場_緯度', '所在地_緯度', '住所_緯度', '緯度', '緯度１'];
const longitudeFields = ['公営駐輪場_経度', '所在地_経度', '住所_経度', '経度', '経度１'];
const nameFields = ['公営駐輪場_名称', '施設_名称', '名称', '名称（所在地）'];
const idFields = ['公営駐輪場_ID', '施設_ID', 'ID', 'NO', 'No', '通番'];
const addressFields = ['所在地_連結表記', '住所_連結表記', '所在地', '住所', '位置'];
const capacityFields = [
  '公営駐輪場_最大駐輪台数',
  '最大駐輪台数',
  '収容台数_自転車',
  '収容台数',
  '台数（台）'
];
const coordinateSuffixes = ['１', '２', '３', '４', '５', '６'];

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

function parseCsv(buffer: ArrayBuffer): CsvRow[] {
  return parse(decodeCsv(buffer), {
    bom: true,
    columns: (headers: string[]) => headers.map((header) => header.replace(/^\uFEFF/, '').trim()),
    relax_column_count: true,
    relax_quotes: true,
    skip_empty_lines: true,
    trim: true
  }) as CsvRow[];
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

function municipalityFromPrimaryRow(row: CsvRow): string | undefined {
  const municipality = clean(row['区市町村']);
  if (municipality && /[区市町村]$/.test(municipality)) return municipality;

  return clean(row['情報提供元'])
    ?.split(/[・、/／]/)
    .map((value) => value.trim())
    .find((value) => /[区市町村]$/.test(value));
}

function primaryCoordinates(row: CsvRow): [number, number] | undefined {
  const coordinateValues = coordinateSuffixes
    .flatMap((suffix) => [parseCoordinate(row[`緯度${suffix}`]), parseCoordinate(row[`経度${suffix}`])])
    .filter((value): value is number => value !== undefined);

  for (let index = 0; index < coordinateValues.length - 1; index += 1) {
    const latitude = coordinateValues[index];
    const longitude = coordinateValues[index + 1];
    if (latitude >= 26 && latitude <= 36 && longitude >= 138.8 && longitude <= 143) {
      return [latitude, longitude];
    }
  }

  return undefined;
}

function isBicycleParking(row: CsvRow): boolean {
  const kind = clean(row['ジャンル２']) ?? '';
  const name = clean(row['名称']) ?? '';
  if (kind.includes('自転車')) return true;
  return kind === '' && /駐輪場/.test(name) && !/(原動機|自動二輪|バイク)/.test(name);
}

function primaryCandidate(row: CsvRow): ParkingCandidate | undefined {
  if (!isBicycleParking(row)) return undefined;

  const facilityId = clean(row['拠点ID']);
  const municipality = municipalityFromPrimaryRow(row);
  const name = clean(row['名称']);
  const coordinates = primaryCoordinates(row);
  if (!facilityId || !municipality || !name || !coordinates) return undefined;

  return {
    address: clean(row['所在地']),
    capacity: parseCapacity(row['収容台数']),
    facilityId: `tokyo-${facilityId}`,
    latitude: coordinates[0],
    longitude: coordinates[1],
    municipality,
    name,
    sourcePublisher: primary.publisher,
    sourceTitle: primary.title,
    sourceUpdatedAt: primary.source_updated_at,
    sourceUrl: primary.source_url
  };
}

function supplementalCandidate(
  row: CsvRow,
  source: ParkingSource,
  index: number
): ParkingCandidate | undefined {
  const name = pick(row, nameFields);
  const latitude = parseCoordinate(pick(row, latitudeFields));
  const longitude = parseCoordinate(pick(row, longitudeFields));
  if (!name || latitude === undefined || longitude === undefined) return undefined;

  return {
    address: pick(row, addressFields),
    capacity: parseCapacity(pick(row, capacityFields)),
    facilityId: `${source.publisher}-${pick(row, idFields) ?? index + 1}`,
    latitude,
    longitude,
    municipality: source.publisher,
    name,
    sourcePublisher: source.publisher,
    sourceTitle: source.title,
    sourceUpdatedAt: source.source_updated_at,
    sourceUrl: source.source_url
  };
}

function toFeature(candidate: ParkingCandidate): BicycleParkingFeature {
  const safeId = candidate.facilityId.replace(/[^A-Za-z0-9_-]/g, '-');
  return {
    type: 'Feature',
    properties: {
      id: `official-parking-${safeId}`,
      name: candidate.name,
      municipality: candidate.municipality,
      ...(candidate.address ? { address: candidate.address } : {}),
      ...(candidate.capacity !== undefined ? { capacity: candidate.capacity } : {}),
      source_publisher: candidate.sourcePublisher,
      source_title: candidate.sourceTitle,
      source_url: candidate.sourceUrl,
      ...(candidate.sourceUpdatedAt ? { source_updated_at: candidate.sourceUpdatedAt } : {})
    },
    geometry: {
      type: 'Point',
      coordinates: [candidate.longitude, candidate.latitude]
    }
  };
}

const primaryRows = parseCsv(await fetchCached(primary.data_url, 'tokyo-bicycle-parking.csv'));
const candidates = primaryRows
  .map(primaryCandidate)
  .filter((value): value is ParkingCandidate => Boolean(value));

for (const source of supplements) {
  try {
    const rows = parseCsv(
      await fetchCached(source.data_url, `${encodeURIComponent(source.publisher)}-bicycle-parking.csv`)
    );
    rows.forEach((row, index) => {
      const candidate = supplementalCandidate(row, source, index);
      if (candidate) candidates.push(candidate);
    });
  } catch (error) {
    console.warn(
      `Skipping ${source.publisher}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

const features = candidates
  .sort((left, right) =>
    `${left.municipality}:${left.name}`.localeCompare(`${right.municipality}:${right.name}`, 'ja')
  )
  .map(toFeature);
const municipalities = [...new Set(features.map((feature) => feature.properties.municipality))]
  .sort((left, right) => left.localeCompare(right, 'ja'));
const missingRequiredAreas = [...wards, ...cities].filter((area) => !municipalities.includes(area));

if (features.length < 1_700 || missingRequiredAreas.length > 0) {
  throw new Error(
    `Parking import coverage failed: ${features.length} facilities; missing ${missingRequiredAreas.join(', ') || 'none'}.`
  );
}

const collection: BicycleParkingCollection = {
  type: 'FeatureCollection',
  metadata: {
    generated_at: new Date().toISOString(),
    municipalities,
    source: `${primary.publisher} ${primary.title}`,
    source_checked: parkingManifest.last_checked,
    source_updated_at: primary.source_updated_at ?? parkingManifest.last_checked,
    coverage: {
      wards: wards.length,
      cities: cities.length,
      other_municipalities: municipalities.length - wards.length - cities.length
    }
  },
  features
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(collection)}\n`, 'utf8');
console.log(
  `Wrote ${features.length} official bicycle-parking facilities from ${municipalities.length} municipalities to ${outputPath}`
);
