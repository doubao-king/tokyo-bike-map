import type {
  ComfortClass,
  ClassificationConfidence,
  CyclingSegmentProperties,
  ParkingConflict,
  SegmentSource,
  SeparationValue
} from '../../src/types';

export interface OsmWayTags {
  [key: string]: string | undefined;
}

export interface NormalizedOsmSegment {
  comfortClass: ComfortClass;
  facilityType: string;
  carSeparation: SeparationValue;
  pedestrianShared: SeparationValue;
  parkingConflict: ParkingConflict;
  confidence: ClassificationConfidence;
  notes: string;
}

function tag(tags: OsmWayTags, key: string): string | undefined {
  return tags[key]?.toLowerCase();
}

export function isCyclewayCrossing(tags: OsmWayTags): boolean {
  return (
    tag(tags, 'cycleway') === 'crossing' ||
    (tag(tags, 'highway') === 'cycleway' && tag(tags, 'crossing') !== undefined)
  );
}

export function shouldIncludeOsmWay(tags: OsmWayTags): boolean {
  const bicycle = tag(tags, 'bicycle');
  return !isCyclewayCrossing(tags) && bicycle !== 'no' && bicycle !== 'private';
}

function inferParkingConflict(tags: OsmWayTags): ParkingConflict {
  const parkingTags = Object.entries(tags).filter(([key, value]) => key.startsWith('parking:') && value);

  if (parkingTags.some(([, value]) => value === 'lane' || value === 'street_side' || value === 'yes')) {
    return 'high';
  }

  if (parkingTags.length > 0) {
    return 'medium';
  }

  return 'unknown';
}

export function classifyOsmWay(tags: OsmWayTags): NormalizedOsmSegment {
  const highway = tag(tags, 'highway');
  const cycleway = tag(tags, 'cycleway');
  const cyclewayLeft = tag(tags, 'cycleway:left');
  const cyclewayRight = tag(tags, 'cycleway:right');
  const segregated = tag(tags, 'segregated');
  const sideSegregated = [tag(tags, 'cycleway:left:segregated'), tag(tags, 'cycleway:right:segregated')];
  const foot = tag(tags, 'foot');
  const bicycle = tag(tags, 'bicycle');
  const parkingConflict = inferParkingConflict(tags);
  const cyclewayValues = [cycleway, cyclewayLeft, cyclewayRight].filter(Boolean);

  if (highway === 'cycleway') {
    const pedestrianSeparated = segregated === 'yes' || sideSegregated.includes('yes');
    const pedestrianExcluded = foot === 'no';

    if (pedestrianSeparated || pedestrianExcluded) {
      return {
        comfortClass: 'A',
        facilityType: 'cycleway',
        carSeparation: 'yes',
        pedestrianShared: 'no',
        parkingConflict,
        confidence: pedestrianSeparated ? 'high' : 'medium',
        notes: 'Preliminary OSM classification for an independently mapped cycleway.'
      };
    }

    return {
      comfortClass: 'B',
      facilityType: 'shared_or_unspecified_cycleway',
      carSeparation: 'yes',
      pedestrianShared: segregated === 'no' ? 'yes' : 'partial',
      parkingConflict,
      confidence: 'medium',
      notes: 'Independently mapped OSM cycleway, but pedestrian separation is not explicit.'
    };
  }

  if (cyclewayValues.some((value) => value === 'track')) {
    return {
      comfortClass: 'A',
      facilityType: 'protected_cycle_track',
      carSeparation: 'yes',
      pedestrianShared: 'unknown',
      parkingConflict,
      confidence: 'medium',
      notes: 'OSM road tags identify an adjacent cycle track; exact bicycle geometry may be inferred.'
    };
  }

  if (cyclewayValues.some((value) => value === 'separate')) {
    return {
      comfortClass: 'A',
      facilityType: 'separate_cycleway_inferred',
      carSeparation: 'yes',
      pedestrianShared: 'unknown',
      parkingConflict,
      confidence: 'low',
      notes: 'OSM says to use a separately mapped cycleway; this road-centre geometry is approximate.'
    };
  }

  if (
    ((highway === 'path' || highway === 'pedestrian' || highway === 'footway') &&
      ['yes', 'designated', 'permissive'].includes(bicycle ?? '')) ||
    cyclewayValues.some((value) => value === 'sidewalk')
  ) {
    return {
      comfortClass: 'B',
      facilityType: 'path_or_sidewalk_bicycle_space',
      carSeparation: 'yes',
      pedestrianShared: segregated === 'yes' ? 'partial' : 'yes',
      parkingConflict,
      confidence:
        (highway === 'path' || highway === 'footway') && bicycle === 'designated'
          ? 'medium'
          : 'low',
      notes: 'Preliminary OSM classification for path/sidewalk-side bicycle space.'
    };
  }

  if (cyclewayValues.some((value) => value === 'lane' || value === 'opposite_lane')) {
    return {
      comfortClass: 'C',
      facilityType: 'painted_bike_lane',
      carSeparation: 'no',
      pedestrianShared: 'no',
      parkingConflict,
      confidence: 'medium',
      notes: 'Preliminary OSM classification. Painted lanes may be obstructed by parking.'
    };
  }

  if (
    cyclewayValues.some((value) => value === 'shared_lane' || value === 'share_busway') ||
    bicycle === 'designated' ||
    tag(tags, 'bicycle:lanes') !== undefined
  ) {
    return {
      comfortClass: 'D',
      facilityType: 'mixed_traffic_marking',
      carSeparation: 'no',
      pedestrianShared: 'no',
      parkingConflict,
      confidence: 'low',
      notes: 'Preliminary OSM classification for a bicycle-designated or mixed-traffic road.'
    };
  }

  return {
    comfortClass: 'D',
    facilityType: 'cycling_related_unclassified',
    carSeparation: 'unknown',
    pedestrianShared: 'unknown',
    parkingConflict,
    confidence: 'low',
    notes: 'Cycling-related OSM feature needs manual review.'
  };
}

export function buildOsmProperties(params: {
  id: string;
  tags: OsmWayTags;
  source: SegmentSource;
  retrievedAt: string;
}): CyclingSegmentProperties {
  const normalized = classifyOsmWay(params.tags);

  return {
    id: params.id,
    name: params.tags.name ?? params.tags['name:ja'] ?? '名称未登録の区間',
    comfort_class: normalized.comfortClass,
    facility_type: normalized.facilityType,
    legal_type: params.tags.cycleway ?? params.tags['cycleway:left'] ?? params.tags['cycleway:right'],
    car_separation: normalized.carSeparation,
    pedestrian_shared: normalized.pedestrianShared,
    parking_conflict: normalized.parkingConflict,
    surface: params.tags.surface ?? 'unknown',
    direction: params.tags.oneway === 'yes' ? 'oneway' : 'unknown',
    classification_confidence: normalized.confidence,
    classification_method: 'osm_tag_inference',
    verification: 'osm',
    source: params.source,
    status: 'unknown',
    notes: normalized.notes
  };
}
