import type { Feature, FeatureCollection, LineString, MultiLineString, Point } from 'geojson';

export type ComfortClass = 'A' | 'B' | 'C' | 'D';

export type MapOverlay = 'parking';

export type SegmentStatus = 'built' | 'planned' | 'under_construction' | 'unknown';

export type SegmentVerification =
  | 'official'
  | 'osm'
  | 'community'
  | 'official+community'
  | 'unverified'
  | 'demo';

export type ParkingConflict = 'low' | 'medium' | 'high' | 'unknown';

export type SeparationValue = 'yes' | 'no' | 'partial' | 'unknown';

export type ClassificationConfidence = 'high' | 'medium' | 'low';

export type ClassificationMethod = 'official' | 'osm_tag_inference' | 'community' | 'demo';

export interface SegmentSource {
  name: string;
  url?: string;
  source_date?: string;
  reference_date?: string;
  retrieved_at?: string;
  license?: string;
}

export interface CyclingSegmentProperties {
  id: string;
  name: string;
  comfort_class: ComfortClass;
  facility_type: string;
  legal_type?: string;
  car_separation: SeparationValue;
  pedestrian_shared: SeparationValue;
  parking_conflict: ParkingConflict;
  surface?: string;
  direction?: 'oneway' | 'both' | 'unknown';
  classification_confidence?: ClassificationConfidence;
  classification_method?: ClassificationMethod;
  verification: SegmentVerification;
  verified_at?: string;
  source: SegmentSource;
  status: SegmentStatus;
  warning?: string;
  notes?: string;
}

export type CyclingSegmentFeature = Feature<LineString | MultiLineString, CyclingSegmentProperties>;

export type CyclingSegmentCollection = FeatureCollection<
  LineString | MultiLineString,
  CyclingSegmentProperties
>;

export type OfficialReferenceType = 'recommended_route' | 'priority_section';

export interface OfficialReferenceProperties {
  id: string;
  name: string;
  reference_type: OfficialReferenceType;
  status: 'built' | 'planned';
  source: SegmentSource;
  notes: string;
  official_fields: Record<string, string>;
}

export type OfficialReferenceFeature = Feature<
  LineString | MultiLineString,
  OfficialReferenceProperties
>;

export type OfficialReferenceCollection = FeatureCollection<
  LineString | MultiLineString,
  OfficialReferenceProperties
>;

export interface BicycleParkingProperties {
  id: string;
  name: string;
  municipality: string;
  address?: string;
  capacity?: number;
  source_publisher?: string;
  source_title: string;
  source_url: string;
  source_updated_at?: string;
}

export type BicycleParkingFeature = Feature<Point, BicycleParkingProperties>;

export interface BicycleParkingMetadata {
  coverage: {
    cities: number;
    other_municipalities: number;
    wards: number;
  };
  generated_at: string;
  municipalities: string[];
  source: string;
  source_checked: string;
  source_updated_at: string;
}

export type BicycleParkingCollection = FeatureCollection<Point, BicycleParkingProperties> & {
  metadata: BicycleParkingMetadata;
};
