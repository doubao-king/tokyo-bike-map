import type { BicycleParkingCollection } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function assertParkingCollection(value: unknown): asserts value is BicycleParkingCollection {
  if (!isRecord(value) || value.type !== 'FeatureCollection' || !Array.isArray(value.features)) {
    throw new Error('Expected a GeoJSON FeatureCollection of bicycle parking facilities.');
  }

  if (
    !isRecord(value.metadata) ||
    !Array.isArray(value.metadata.municipalities) ||
    value.metadata.municipalities.length === 0 ||
    !value.metadata.municipalities.every(
      (municipality) => typeof municipality === 'string' && municipality.trim() !== ''
    ) ||
    !isRecord(value.metadata.coverage)
  ) {
    throw new Error('Bicycle-parking metadata is missing coverage information.');
  }

  value.features.forEach((feature, index) => {
    if (!isRecord(feature) || feature.type !== 'Feature' || !isRecord(feature.properties)) {
      throw new Error(`Parking feature ${index} is invalid.`);
    }
    if (
      !isRecord(feature.geometry) ||
      feature.geometry.type !== 'Point' ||
      !Array.isArray(feature.geometry.coordinates) ||
      feature.geometry.coordinates.length < 2
    ) {
      throw new Error(`Parking feature ${index} must use Point geometry.`);
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
      throw new Error(`Parking feature ${index} has invalid Tokyo coordinates.`);
    }

    for (const field of ['id', 'name', 'municipality', 'source_title', 'source_url']) {
      if (typeof feature.properties[field] !== 'string' || feature.properties[field].trim() === '') {
        throw new Error(`Parking feature ${index} is missing ${field}.`);
      }
    }

    if (
      feature.properties.source_publisher !== undefined &&
      (typeof feature.properties.source_publisher !== 'string' ||
        feature.properties.source_publisher.trim() === '')
    ) {
      throw new Error(`Parking feature ${index} has an invalid source publisher.`);
    }

    if (
      feature.properties.capacity !== undefined &&
      (typeof feature.properties.capacity !== 'number' || feature.properties.capacity < 0)
    ) {
      throw new Error(`Parking feature ${index} has invalid capacity.`);
    }
  });
}

export async function loadParking(
  path = '/data/bicycle-parking.geojson?v=2026-08-27-2'
): Promise<BicycleParkingCollection> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load bicycle parking data: ${response.status}`);

  const payload: unknown = await response.json();
  assertParkingCollection(payload);
  return payload;
}
