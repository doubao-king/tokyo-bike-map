import 'leaflet/dist/leaflet.css';
import '../styles.css';
import { classUrlValues, comfortClasses, defaultVisibleClasses } from './config';
import { loadParking } from './data/loadParking';
import { loadSegments } from './data/loadSegments';
import {
  destinationFromUrl,
  destinationTargetFromPath,
  localizedDestination
} from './destinations';
import {
  applyStaticTranslations,
  areaText,
  getLanguage,
  localeByLanguage,
  messages,
  rememberLanguage
} from './i18n';
import { createCyclingMap } from './map/createMap';
import { areaTargetFromPath } from './seo';
import type { MapOverlay } from './types';
import { initializeAds } from './ui/ads';
import {
  bindControls,
  renderClassCounts,
  renderParkingCount,
  renderParkingCoverage
} from './ui/controls';
import { setLoadingFailure } from './ui/detailPanel';
import { initializeDestinationSearch } from './ui/destinationSearch';
import { initializeFeedbackDialog } from './ui/feedback';
import { renderSourceRegistry } from './ui/sources';
import { initializeViewCounter } from './ui/viewCounter';

const language = getLanguage();
rememberLanguage(language);
applyStaticTranslations(language);

const searchParams = new URLSearchParams(window.location.search);
const initialArea = areaTargetFromPath(window.location.pathname);
const initialDestinationTarget = destinationTargetFromPath(window.location.pathname);
const initialDestination = destinationFromUrl(window.location.pathname, searchParams, language);
if (initialDestinationTarget) {
  const copy = messages[language];
  const destination = localizedDestination(initialDestinationTarget, language);
  const replaceDestination = (template: string): string =>
    template.replace('{destination}', destination.name);
  const description = replaceDestination(copy.destinationMetaDescription);
  document.title = replaceDestination(copy.destinationDocumentTitle);
  document.querySelector<HTMLHeadingElement>('h1[data-i18n="title"]')!.textContent =
    replaceDestination(copy.destinationPageTitle);
  document.querySelector<HTMLElement>('[data-i18n="tagline"]')!.textContent =
    copy.destinationPageTagline;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
    'content',
    description
  );
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute(
    'content',
    document.title
  );
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute(
    'content',
    description
  );
} else if (initialArea) {
  const copy = messages[language];
  const areaLabel = areaText[language][initialArea.id] ?? initialArea.label;
  const replaceArea = (template: string): string => template.replace('{area}', areaLabel);
  const title = replaceArea(copy.areaPageTitle);
  const description = replaceArea(copy.areaMetaDescription);
  document.title = replaceArea(copy.areaDocumentTitle);
  document.querySelector<HTMLHeadingElement>('h1[data-i18n="title"]')!.textContent = title;
  document.querySelector<HTMLElement>('[data-i18n="tagline"]')!.textContent = copy.areaPageTagline;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
    'content',
    description
  );
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute(
    'content',
    document.title
  );
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute(
    'content',
    description
  );
}

const detailPanel = document.getElementById('detailPanel');
const visibleCount = document.getElementById('visibleCount');

if (!detailPanel || !visibleCount) {
  throw new Error('Required map UI elements are missing.');
}

const supportedOverlays: MapOverlay[] = ['parking'];
const initialOverlays = new Set(
  (searchParams.get('layers') ?? '')
    .split(',')
    .filter((value): value is MapOverlay => supportedOverlays.includes(value as MapOverlay))
);
if (initialDestination) initialOverlays.add('parking');
const cyclingMap = createCyclingMap(
  'map',
  detailPanel,
  visibleCount,
  language,
  initialOverlays
);
const roadParam = searchParams.get('roads');
const classParam = searchParams.get('classes');
const initialVisibleClasses =
  roadParam !== null
    ? new Set(
        roadParam
          .split(',')
          .map((value) => comfortClasses.find((cls) => classUrlValues[cls] === value))
          .filter((value): value is (typeof comfortClasses)[number] => Boolean(value))
      )
    : classParam === null
    ? new Set(defaultVisibleClasses)
    : new Set(
        classParam
          .split(',')
          .filter((value): value is (typeof comfortClasses)[number] =>
            comfortClasses.includes(value as (typeof comfortClasses)[number])
          )
      );

document.querySelectorAll<HTMLInputElement>('[data-class]').forEach((input) => {
  input.checked = initialVisibleClasses.has(input.dataset.class as (typeof comfortClasses)[number]);
});
document.querySelectorAll<HTMLInputElement>('[data-map-layer]').forEach((input) => {
  input.checked = initialOverlays.has(input.dataset.mapLayer as MapOverlay);
});
bindControls(cyclingMap, language);
initializeFeedbackDialog(cyclingMap, language);
initializeDestinationSearch(cyclingMap, language, initialDestination);
if (initialDestination) cyclingMap.setDestination(initialDestination);

const viewCounter = document.getElementById('viewCounter');
if (viewCounter) {
  void initializeViewCounter(viewCounter, localeByLanguage[language]);
}

const adPanel = document.getElementById('adPanel');
if (adPanel) {
  initializeAds(adPanel);
}

const sourceList = document.getElementById('sourceList');
if (sourceList) {
  renderSourceRegistry(sourceList, language);
}

void Promise.allSettled([
  loadSegments().then((segments) => {
    cyclingMap.rebuild(segments.features, initialVisibleClasses);
    renderClassCounts(segments.features, language);
  }),
  loadParking().then((parking) => {
    cyclingMap.setParkingFeatures(parking.features);
    renderParkingCount(parking.features.length, language);
    renderParkingCoverage(parking.metadata.municipalities.length, language);
    if (sourceList) renderSourceRegistry(sourceList, language, parking.features);
  })
]).then((results) => {
  const segmentResult = results[0];
  if (segmentResult.status === 'rejected') {
    console.error(segmentResult.reason);
    setLoadingFailure(detailPanel, language);
  }

  const parkingResult = results[1];
  if (parkingResult.status === 'rejected') {
    console.error(parkingResult.reason);
    renderParkingCount(0, language);
  }
});
