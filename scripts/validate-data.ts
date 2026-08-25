import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assertSegmentCollection } from '../src/data/segmentSchema';

const dataPath = resolve('public/data/osm-segments.geojson');
const payload: unknown = JSON.parse(await readFile(dataPath, 'utf8'));
assertSegmentCollection(payload);

const ids = new Set<string>();
const counts = new Map<string, number>();

payload.features.forEach((feature) => {
  const properties = feature.properties;

  if (ids.has(properties.id)) {
    throw new Error(`Duplicate segment id: ${properties.id}`);
  }
  ids.add(properties.id);

  if (properties.verification === 'osm') {
    if (!properties.classification_confidence || properties.classification_method !== 'osm_tag_inference') {
      throw new Error(`OSM segment lacks classification provenance: ${properties.id}`);
    }

    if (!properties.source.retrieved_at) {
      throw new Error(`OSM segment lacks a retrieval date: ${properties.id}`);
    }

    if (properties.verified_at) {
      throw new Error(`OSM retrieval must not be recorded as field verification: ${properties.id}`);
    }

    if (
      properties.source.name !== 'OpenStreetMap' ||
      properties.source.license !== 'ODbL' ||
      !properties.source.url?.startsWith('https://www.openstreetmap.org/way/')
    ) {
      throw new Error(`OSM segment has invalid source attribution: ${properties.id}`);
    }
  }

  const cls = properties.comfort_class;
  counts.set(cls, (counts.get(cls) ?? 0) + 1);
});

console.log(
  `Validated ${payload.features.length} segments (${[...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([cls, count]) => `${cls}:${count}`)
    .join(' ')})`
);
