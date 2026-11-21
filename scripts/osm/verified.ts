import type { CyclingSegmentCollection } from '../../src/types';

/** Reviewed records replace their OSM way by ID; missing ways are added once. */
export function applyVerifiedSegments(
  osm: CyclingSegmentCollection,
  verified: CyclingSegmentCollection
): CyclingSegmentCollection {
  const ids = new Set(verified.features.map((feature) => feature.properties.id));
  if (ids.size !== verified.features.length) {
    throw new Error('Duplicate reviewed segment ID');
  }
  return {
    ...osm,
    features: [
      ...osm.features.filter((feature) => !ids.has(feature.properties.id)),
      ...verified.features
    ]
  };
}
