import { assertSegmentCollection } from './segmentSchema';
import type { CyclingSegmentCollection } from '../types';

export async function loadSegments(path = '/data/osm-segments.geojson'): Promise<CyclingSegmentCollection> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Unable to load cycling segment data: ${response.status}`);
  }

  const payload: unknown = await response.json();
  assertSegmentCollection(payload);
  return payload;
}
