import assert from 'node:assert/strict';
import { areaTargets, comfortClasses } from '../src/config';
import { areaGroupText, areaText, classText, messages, type Language } from '../src/i18n';

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

console.log('Japanese, English and Chinese translation coverage passed.');
