import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { areaTargets } from '../src/config';
import { areaPath, areaSeo, areaTargetFromPath, canonicalOrigin, homeSeo } from '../src/seo';

const [indexHtml, robots, sitemap, wrangler] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('public/robots.txt', 'utf8'),
  readFile('public/sitemap.xml', 'utf8'),
  readFile('wrangler.jsonc', 'utf8')
]);

assert.match(indexHtml, /rel="canonical" href="https:\/\/tokyo-bike-map\.manymao\.com\/"/);
assert.match(indexHtml, /application\/ld\+json/);
assert.match(indexHtml, /東京の自転車マップ/);
assert.match(robots, /Sitemap: https:\/\/tokyo-bike-map\.manymao\.com\/sitemap\.xml/);
assert.match(sitemap, new RegExp(`<loc>${homeSeo.canonicalUrl}</loc>`));
assert.match(wrangler, /"\/area\/\*"/);

areaTargets.forEach((area) => {
  const path = areaPath(area.id);
  assert.equal(areaTargetFromPath(path)?.id, area.id);
  assert.equal(areaTargetFromPath(path.slice(0, -1))?.id, area.id);
  assert.equal(areaSeo(area).canonicalUrl, `${canonicalOrigin}${path}`);
  assert.match(sitemap, new RegExp(`<loc>${canonicalOrigin}${path}</loc>`));
});

assert.equal(areaTargetFromPath('/area/not-a-real-area/'), undefined);
assert.equal(areaTargetFromPath('/other/bunkyo/'), undefined);

console.log('SEO metadata, area routes, robots and sitemap checks passed.');
