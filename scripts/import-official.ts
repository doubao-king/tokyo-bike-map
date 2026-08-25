import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { Feature, LineString, MultiLineString, Position } from 'geojson';
import proj4 from 'proj4';
import * as shapefile from 'shapefile';
import type {
  OfficialReferenceCollection,
  OfficialReferenceFeature,
  OfficialReferenceProperties,
  SegmentSource
} from '../src/types';

const catalogUrl = 'https://catalog.data.metro.tokyo.lg.jp/dataset/t000014d0000000026';
const retrievedAt = new Date().toISOString();

const paths = {
  recommended: resolve(
    'data/raw/tokyo-metropolitan/recommended-routes/recommended-routes.shp'
  ),
  priority: resolve(
    'data/raw/tokyo-metropolitan/priority-sections/priority-sections.shp'
  ),
  output: resolve('data/processed/official-reference.geojson')
};

proj4.defs(
  'EPSG:2451',
  '+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 +units=m +no_defs'
);

type LineFeature = Feature<LineString | MultiLineString>;

function source(details: Pick<SegmentSource, 'source_date' | 'reference_date'>): SegmentSource {
  return {
    name: '東京都建設局',
    url: catalogUrl,
    retrieved_at: retrievedAt,
    license: 'CC BY 4.0',
    ...details
  };
}

function stringProperties(properties: Record<string, unknown> | null): Record<string, string> {
  return Object.fromEntries(
    Object.entries(properties ?? {}).map(([key, value]) => [key, String(value ?? '')])
  );
}

function transformPosition(position: Position): Position {
  const [longitude, latitude] = proj4('EPSG:2451', 'EPSG:4326', [position[0], position[1]]);
  return [longitude, latitude, ...position.slice(2)];
}

function transformTokyoZone9(geometry: LineString | MultiLineString): LineString | MultiLineString {
  if (geometry.type === 'LineString') {
    return { ...geometry, coordinates: geometry.coordinates.map(transformPosition) };
  }

  return {
    ...geometry,
    coordinates: geometry.coordinates.map((line) => line.map(transformPosition))
  };
}

async function readLineFeatures(path: string): Promise<LineFeature[]> {
  const dbfPath = path.replace(/\.shp$/, '.dbf');
  const reader = await shapefile.open(path, dbfPath, { encoding: 'shift-jis' });
  const features: LineFeature[] = [];

  while (true) {
    const record = await reader.read();

    if (record.done) {
      break;
    }

    const feature = record.value;
    if (feature.geometry?.type !== 'LineString' && feature.geometry?.type !== 'MultiLineString') {
      throw new Error(`Expected line geometry in ${path}.`);
    }

    features.push(feature as LineFeature);
  }

  return features;
}

function officialFeature(
  geometry: LineString | MultiLineString,
  properties: OfficialReferenceProperties
): OfficialReferenceFeature {
  return { type: 'Feature', geometry, properties };
}

async function importRecommendedRoutes(): Promise<OfficialReferenceFeature[]> {
  const rawFeatures = await readLineFeatures(paths.recommended);

  return rawFeatures.map((feature, index) => {
    const fields = stringProperties(feature.properties as Record<string, unknown> | null);
    const built = fields['整備状況'] === '整備済';

    return officialFeature(feature.geometry, {
      id: `tokyo-metropolitan-recommended-${String(index + 1).padStart(3, '0')}`,
      name: `東京都自転車推奨ルート ${fields['区間番号'] || index + 1}`,
      reference_type: 'recommended_route',
      status: built ? 'built' : 'planned',
      source: source({ source_date: '2015-04', reference_date: '2015-04' }),
      notes:
        'Official route geometry and source-date status. The source does not identify physical separation or comfort class.',
      official_fields: fields
    });
  });
}

async function importPrioritySections(): Promise<OfficialReferenceFeature[]> {
  const rawFeatures = await readLineFeatures(paths.priority);

  return rawFeatures.map((feature, index) => {
    const fields = stringProperties(feature.properties as Record<string, unknown> | null);
    const built = fields['凡例名称'] === '平成23年度までの整備済み箇所';

    return officialFeature(transformTokyoZone9(feature.geometry), {
      id: `tokyo-metropolitan-priority-${String(index + 1).padStart(3, '0')}`,
      name: `東京都 ${fields['凡例名称'] || '優先整備区間'}`,
      reference_type: 'priority_section',
      status: built ? 'built' : 'planned',
      source: source({
        source_date: '2012-10',
        reference_date: built ? 'built through FY2011' : '2012-10 plan'
      }),
      notes:
        'Archived official planning geometry. It must not override newer as-built or field-verified information.',
      official_fields: fields
    });
  });
}

const collection: OfficialReferenceCollection = {
  type: 'FeatureCollection',
  features: [...(await importRecommendedRoutes()), ...(await importPrioritySections())]
};

await mkdir(dirname(paths.output), { recursive: true });
await writeFile(paths.output, `${JSON.stringify(collection)}\n`, 'utf8');

const builtCount = collection.features.filter((feature) => feature.properties.status === 'built').length;
console.log(
  `Wrote ${collection.features.length} official references (${builtCount} built-at-source-date) to ${paths.output}`
);
