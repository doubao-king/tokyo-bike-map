import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { areaTargets } from '../src/config';
import { destinationTargets } from '../src/destinations';
import {
  areaPath,
  areaSeo,
  areaTargetFromPath,
  canonicalOrigin,
  destinationPath,
  destinationSeo,
  destinationTargetFromPath,
  homeSeo
} from '../src/seo';

const [indexHtml, robots, sitemap, wrangler] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('public/robots.txt', 'utf8'),
  readFile('public/sitemap.xml', 'utf8'),
  readFile('wrangler.jsonc', 'utf8')
]);

assert.match(indexHtml, /rel="canonical" href="https:\/\/tokyo-bike-map\.manymao\.com\/"/);
assert.match(indexHtml, /application\/ld\+json/);
assert.match(
  indexHtml,
  /meta name="google-site-verification" content="agio_yKHyQuWKC9Gf_zywUfFjZN1jj_W1KO3dJDOk04"/
);
assert.match(indexHtml, /東京の自転車マップ/);
assert.match(robots, /Sitemap: https:\/\/tokyo-bike-map\.manymao\.com\/sitemap\.xml/);
assert.match(sitemap, new RegExp(`<loc>${homeSeo.canonicalUrl}</loc>`));
assert.match(wrangler, /"\/area\/\*"/);
assert.match(wrangler, /"\/parking\/\*"/);

['about', 'methodology', 'updates', 'contact', 'privacy', 'terms'].forEach((page) => {
  assert.match(sitemap, new RegExp(`<loc>${canonicalOrigin}/${page}/</loc>`));
});
assert.doesNotMatch(sitemap, /\/(?:about|methodology|updates|contact|privacy|terms)\/index\.html/);

areaTargets.forEach((area) => {
  const path = areaPath(area.id);
  assert.equal(areaTargetFromPath(path)?.id, area.id);
  assert.equal(areaTargetFromPath(path.slice(0, -1))?.id, area.id);
  assert.equal(areaSeo(area).canonicalUrl, `${canonicalOrigin}${path}`);
  assert.match(sitemap, new RegExp(`<loc>${canonicalOrigin}${path}</loc>`));
});

destinationTargets.forEach((destination) => {
  const path = destinationPath(destination.id);
  assert.equal(destinationTargetFromPath(path)?.id, destination.id);
  assert.equal(destinationTargetFromPath(path.slice(0, -1))?.id, destination.id);
  assert.equal(destinationSeo(destination).canonicalUrl, `${canonicalOrigin}${path}`);
  assert.match(destinationSeo(destination).title, /駐輪場/);
  assert.match(sitemap, new RegExp(`<loc>${canonicalOrigin}${path}</loc>`));
});

assert.equal(areaTargetFromPath('/area/not-a-real-area/'), undefined);
assert.equal(areaTargetFromPath('/other/bunkyo/'), undefined);
assert.equal(destinationTargetFromPath('/parking/not-a-real-station/'), undefined);
assert.equal(destinationTargetFromPath('/area/shinjuku-station/'), undefined);

console.log('SEO metadata, area routes, robots and sitemap checks passed.');
