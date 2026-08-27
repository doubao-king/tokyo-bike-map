import assert from 'node:assert/strict';
import {
  renderDefaultDetail,
  renderParkingDetail,
  renderSegmentDetail
} from '../src/ui/detailPanel';
import type { BicycleParkingFeature, CyclingSegmentFeature } from '../src/types';

const segment: CyclingSegmentFeature = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [139.7, 35.6],
      [139.701, 35.601]
    ]
  },
  properties: {
    id: 'segment-test',
    name: 'Test <segment>',
    comfort_class: 'A',
    facility_type: 'protected_cycle_track',
    car_separation: 'yes',
    pedestrian_shared: 'no',
    parking_conflict: 'unknown',
    source: { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/way/1' },
    status: 'built',
    verification: 'osm'
  }
};

const parking: BicycleParkingFeature = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [139.7001, 35.6002] },
  properties: {
    address: '1-2-3 Test',
    capacity: 42,
    id: 'parking-test',
    municipality: 'Test City',
    name: 'Test Parking',
    source_title: 'Official source',
    source_url: 'https://example.com/parking'
  }
};

for (const language of ['ja', 'en', 'zh'] as const) {
  const defaultDetail = renderDefaultDetail(language);
  assert.equal((defaultDetail.match(/data-detail-action="report"/g) ?? []).length, 1);
  assert.doesNotMatch(defaultDetail, /data-detail-action="clear"/);

  const segmentDetail = renderSegmentDetail(segment, language);
  assert.equal((segmentDetail.match(/data-detail-action="report"/g) ?? []).length, 1);
  assert.equal((segmentDetail.match(/data-detail-action="clear"/g) ?? []).length, 1);
  assert.match(segmentDetail, /Test &lt;segment&gt;/);
  assert.doesNotMatch(segmentDetail, /segment-report-button/);

  const parkingDetail = renderParkingDetail(parking, language);
  assert.equal((parkingDetail.match(/data-detail-action="report"/g) ?? []).length, 1);
  assert.equal((parkingDetail.match(/data-detail-action="clear"/g) ?? []).length, 1);
  assert.match(parkingDetail, /Google Maps/);
  assert.match(parkingDetail, /Apple Maps/);
  assert.match(parkingDetail, /42/);
  assert.doesNotMatch(parkingDetail, /parking-report-button/);
}

console.log('Unified map selection details passed.');
