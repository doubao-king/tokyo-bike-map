import type { BicyclePumpCollection, BicyclePumpCost } from '../types';

const costs = new Set<BicyclePumpCost>(['free', 'paid', 'unknown']);
const facilityTypes = new Set(['parking_facility', 'public_pump', 'bicycle_shop']);
const verificationValues = new Set(['official', 'osm', 'official+osm', 'official+community']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function assertPumpCollection(value: unknown): asserts value is BicyclePumpCollection {
  if (!isRecord(value) || value.type !== 'FeatureCollection' || !Array.isArray(value.features)) {
    throw new Error('Expected a GeoJSON FeatureCollection of bicycle pumps.');
  }
  if (
    !isRecord(value.metadata) ||
    !isRecord(value.metadata.counts) ||
    typeof value.metadata.generated_at !== 'string' ||
    typeof value.metadata.source_checked !== 'string'
  ) {
    throw new Error('Bicycle-pump metadata is missing source information.');
  }

  value.features.forEach((feature, index) => {
    if (!isRecord(feature) || feature.type !== 'Feature' || !isRecord(feature.properties)) {
      throw new Error(`Pump feature ${index} is invalid.`);
    }
    if (
      !isRecord(feature.geometry) ||
      feature.geometry.type !== 'Point' ||
      !Array.isArray(feature.geometry.coordinates) ||
      feature.geometry.coordinates.length < 2
    ) {
      throw new Error(`Pump feature ${index} must use Point geometry.`);
    }

    const [longitude, latitude] = feature.geometry.coordinates;
    if (
      typeof longitude !== 'number' ||
      typeof latitude !== 'number' ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < 138.8 ||
      longitude > 143 ||
      latitude < 26 ||
      latitude > 36
    ) {
      throw new Error(`Pump feature ${index} has invalid Tokyo coordinates.`);
    }

    for (const field of ['id', 'name', 'source_title', 'source_url', 'source_checked_at']) {
      if (typeof feature.properties[field] !== 'string' || feature.properties[field].trim() === '') {
        throw new Error(`Pump feature ${index} is missing ${field}.`);
      }
    }
    if (!costs.has(feature.properties.cost as BicyclePumpCost)) {
      throw new Error(`Pump feature ${index} has an invalid cost.`);
    }
    if (!facilityTypes.has(String(feature.properties.facility_type))) {
      throw new Error(`Pump feature ${index} has an invalid facility type.`);
    }
    if (!verificationValues.has(String(feature.properties.verification))) {
      throw new Error(`Pump feature ${index} has invalid verification.`);
    }
  });
}

export async function loadPumps(
  path = '/data/bicycle-pumps.geojson?v=2026-09-06-2'
): Promise<BicyclePumpCollection> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load bicycle-pump data: ${response.status}`);

  const payload: unknown = await response.json();
  assertPumpCollection(payload);
  return payload;
}
