import assert from 'node:assert/strict';
import { areaTargets, comfortClasses } from '../src/config';
import { areaGroupText, areaText, classText, messages, type Language } from '../src/i18n';
import { createReportIssueUrl } from '../src/ui/controls';

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

const reportUrl = new URL(
  createReportIssueUrl(
    'https://tokyo-bike-map.manymao.com/?lat=35.7&lng=139.7&z=15',
    'en'
  )
);
assert.equal(reportUrl.origin, 'https://github.com');
assert.equal(reportUrl.pathname, '/doubao-king/tokyo-bike-map/issues/new');
assert.match(reportUrl.searchParams.get('title') ?? '', /correction/i);
assert.match(reportUrl.searchParams.get('body') ?? '', /lat=35\.7&lng=139\.7&z=15/);

console.log('Japanese, English and Chinese translation coverage passed.');
