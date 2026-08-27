import assert from 'node:assert/strict';
import { areaTargets, comfortClasses } from '../src/config';
import { areaGroupText, areaText, classText, messages, type Language } from '../src/i18n';
import { createParkingMapLinks } from '../src/map/parkingLinks';
import type { BicycleParkingFeature } from '../src/types';

const languages: Language[] = ['ja', 'en', 'zh'];
const baselineMessageKeys = Object.keys(messages.ja).sort();

languages.forEach((language) => {
  assert.deepEqual(Object.keys(messages[language]).sort(), baselineMessageKeys);
  comfortClasses.forEach((comfortClass) => {
    assert.ok(classText[language][comfortClass].label);
    assert.ok(classText[language][comfortClass].description);
  });
  areaTargets.forEach((area) => {
    assert.ok(areaGroupText[language][area.group]);
    assert.ok(language === 'ja' ? area.label : areaText[language][area.id]);
  });
});

const parkingFeature: BicycleParkingFeature = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [139.7001, 35.6002] },
  properties: {
    id: 'test-parking',
    municipality: 'テスト市',
    name: 'テスト駐輪場',
    source_title: 'Test source',
    source_url: 'https://example.com'
  }
};
const parkingLinks = createParkingMapLinks(parkingFeature);
const googleMapsUrl = new URL(parkingLinks.google);
const appleMapsUrl = new URL(parkingLinks.apple);
assert.equal(googleMapsUrl.hostname, 'www.google.com');
assert.equal(googleMapsUrl.searchParams.get('query'), '35.6002,139.7001');
assert.equal(appleMapsUrl.hostname, 'maps.apple.com');
assert.equal(appleMapsUrl.searchParams.get('ll'), '35.6002,139.7001');
assert.equal(appleMapsUrl.searchParams.get('q'), 'テスト駐輪場');

console.log('Japanese, English and Chinese translation coverage passed.');
