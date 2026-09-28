import assert from 'node:assert/strict';
import { areaTargets } from '../src/config';
import { destinationTargets } from '../src/destinations';
import { seoContentData } from '../src/generated/seoContent';
import { renderPageContext } from '../src/pageContent';
import { areaPath, destinationPath } from '../src/seo';

assert.equal(seoContentData.areas.length, areaTargets.length);
assert.equal(seoContentData.destinations.length, destinationTargets.length);

for (const language of ['ja', 'en', 'zh'] as const) {
  const home = renderPageContext('/', language);
  assert.ok(home);
  assert.match(home, /context-metrics/);
  assert.match(home, /context-breakdown/);
  assert.match(home, /context-source-date/);
  assert.doesNotMatch(home, /undefined/);

  areaTargets.forEach((area) => {
    const html = renderPageContext(areaPath(area.id), language);
    assert.ok(html);
    assert.match(html, /context-metrics/);
    assert.match(html, /context-nearby-list|context-empty/);
    assert.doesNotMatch(html, /undefined/);
  });

  destinationTargets.forEach((destination) => {
    const html = renderPageContext(destinationPath(destination.id), language);
    assert.ok(html);
    assert.match(html, new RegExp(destination.name[language]));
    assert.match(html, /context-metrics/);
    assert.match(html, /context-source-date/);
    assert.doesNotMatch(html, /undefined/);
  });
}

assert.equal(renderPageContext('/not-a-map-page/', 'ja'), undefined);
console.log('Crawlable page-content summaries passed.');
