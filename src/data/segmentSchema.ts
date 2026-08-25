import { comfortClasses } from '../config';
import type {
  ComfortClass,
  ClassificationConfidence,
  ClassificationMethod,
  CyclingSegmentCollection,
  CyclingSegmentFeature,
  ParkingConflict,
  SegmentStatus,
  SegmentVerification,
  SeparationValue
} from '../types';

const statuses = new Set<SegmentStatus>(['built', 'planned', 'under_construction', 'unknown']);
const verificationValues = new Set<SegmentVerification>([
  'official',
  'osm',
  'community',
  'official+community',
  'unverified',
  'demo'
]);
const separationValues = new Set<SeparationValue>(['yes', 'no', 'partial', 'unknown']);
const parkingValues = new Set<ParkingConflict>(['low', 'medium', 'high', 'unknown']);
const classValues = new Set<ComfortClass>(comfortClasses);
const confidenceValues = new Set<ClassificationConfidence>(['high', 'medium', 'low']);
const methodValues = new Set<ClassificationMethod>([
  'official',
  'osm_tag_inference',
  'community',
  'demo'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Segment is missing required string property: ${field}`);
  }
  return value;
}

function requireEnum<T extends string>(value: unknown, field: string, values: Set<T>): T {
  if (typeof value !== 'string' || !values.has(value as T)) {
    throw new Error(`Segment has invalid ${field}: ${String(value)}`);
  }
  return value as T;
}

function requireHttpUrl(value: unknown, field: string): string {
  const raw = requireString(value, field);

  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('unsupported protocol');
    }
  } catch {
    throw new Error(`Segment has invalid ${field}: ${raw}`);
  }

  return raw;
}

function assertPosition(value: unknown, field: string): void {
  if (
    !Array.isArray(value) ||
    value.length < 2 ||
    typeof value[0] !== 'number' ||
    typeof value[1] !== 'number' ||
    !Number.isFinite(value[0]) ||
    !Number.isFinite(value[1]) ||
    value[0] < -180 ||
    value[0] > 180 ||
    value[1] < -90 ||
    value[1] > 90
  ) {
    throw new Error(`Segment has invalid coordinate at ${field}.`);
  }
}

function assertLine(value: unknown, field: string): void {
  if (!Array.isArray(value) || value.length < 2) {
    throw new Error(`Segment ${field} must contain at least two positions.`);
  }

  value.forEach((position, index) => assertPosition(position, `${field}[${index}]`));
}

export function assertSegmentCollection(value: unknown): asserts value is CyclingSegmentCollection {
  if (!isRecord(value) || value.type !== 'FeatureCollection' || !Array.isArray(value.features)) {
    throw new Error('Expected a GeoJSON FeatureCollection of cycling segments.');
  }

  value.features.forEach((feature, index) => {
    if (!isRecord(feature) || feature.type !== 'Feature' || !isRecord(feature.properties)) {
      throw new Error(`Feature ${index} is not a valid GeoJSON Feature.`);
    }

    const geometry = feature.geometry;
    if (!isRecord(geometry) || (geometry.type !== 'LineString' && geometry.type !== 'MultiLineString')) {
      throw new Error(`Feature ${index} must use LineString or MultiLineString geometry.`);
    }

    if (geometry.type === 'LineString') {
      assertLine(geometry.coordinates, `feature ${index} geometry`);
    } else {
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
        throw new Error(`Feature ${index} MultiLineString must contain at least one line.`);
      }
      geometry.coordinates.forEach((line, lineIndex) =>
        assertLine(line, `feature ${index} geometry[${lineIndex}]`)
      );
    }

    const properties = feature.properties;
    requireString(properties.id, 'id');
    requireString(properties.name, 'name');
    requireEnum(properties.comfort_class, 'comfort_class', classValues);
    requireString(properties.facility_type, 'facility_type');
    requireEnum(properties.car_separation, 'car_separation', separationValues);
    requireEnum(properties.pedestrian_shared, 'pedestrian_shared', separationValues);
    requireEnum(properties.parking_conflict, 'parking_conflict', parkingValues);
    requireEnum(properties.verification, 'verification', verificationValues);
    requireEnum(properties.status, 'status', statuses);

    if (properties.classification_confidence !== undefined) {
      requireEnum(
        properties.classification_confidence,
        'classification_confidence',
        confidenceValues
      );
    }

    if (properties.classification_method !== undefined) {
      requireEnum(properties.classification_method, 'classification_method', methodValues);
    }

    if (!isRecord(properties.source)) {
      throw new Error(`Feature ${index} is missing source provenance.`);
    }

    requireString(properties.source.name, 'source.name');
    if (properties.source.url !== undefined) {
      requireHttpUrl(properties.source.url, 'source.url');
    }
    if (
      properties.source.retrieved_at !== undefined &&
      (typeof properties.source.retrieved_at !== 'string' ||
        Number.isNaN(Date.parse(properties.source.retrieved_at)))
    ) {
      throw new Error(`Feature ${index} has an invalid source.retrieved_at timestamp.`);
    }
  });
}

export function countByClass(
  features: CyclingSegmentFeature[],
  activeClasses: Set<ComfortClass>
): number {
  return features.filter((feature) => activeClasses.has(feature.properties.comfort_class)).length;
}
