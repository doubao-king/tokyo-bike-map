import { areaTargets, comfortClasses } from '../config';
import {
  areaGroupText,
  areaText,
  languageUrl,
  localeByLanguage,
  messages,
  rememberLanguage,
  type Language
} from '../i18n';
import type { ComfortClass, CyclingSegmentFeature, MapOverlay } from '../types';
import type { CyclingMap } from '../map/createMap';
import { areaPath } from '../seo';
import {
  destinationPath,
  destinationTargets,
  localizedDestination
} from '../destinations';

const comfortableClasses: ComfortClass[] = ['A', 'B'];

function syncComfortableGroup(): void {
  const group = document.getElementById('comfortableGroup') as HTMLInputElement | null;
  const children = comfortableClasses
    .map((cls) => document.querySelector<HTMLInputElement>(`[data-class="${cls}"]`))
    .filter((input): input is HTMLInputElement => Boolean(input));

  if (!group || children.length === 0) {
    return;
  }

  const checkedCount = children.filter((input) => input.checked).length;
  group.checked = checkedCount === children.length;
  group.indeterminate = checkedCount > 0 && checkedCount < children.length;
}

function populateAreaButtons(
  container: HTMLElement,
  cyclingMap: CyclingMap,
  language: Language
): void {
  let currentGroup = '';

  areaTargets.forEach((area) => {
    if (area.group !== currentGroup) {
      const heading = document.createElement('h3');
      heading.className = 'area-group-title';
      heading.textContent = areaGroupText[language][area.group] ?? area.group;
      container.append(heading);
      currentGroup = area.group;
    }

    const link = document.createElement('a');
    link.href = areaPath(area.id);
    link.dataset.area = area.id;
    link.textContent = areaText[language][area.id] ?? area.label;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      cyclingMap.flyTo(area.center, area.zoom);
    });
    container.append(link);
  });
}

function populateDestinationLinks(container: HTMLElement, language: Language): void {
  destinationTargets.forEach((target) => {
    const destination = localizedDestination(target, language);
    const link = document.createElement('a');
    const url = new URL(destinationPath(target.id), window.location.origin);
    if (language !== 'ja') url.searchParams.set('lang', language);
    link.href = `${url.pathname}${url.search}`;
    link.textContent = destination.name;
    container.append(link);
  });
}

export function renderClassCounts(
  features: CyclingSegmentFeature[],
  language: Language
): void {
  const formatter = new Intl.NumberFormat(localeByLanguage[language]);

  comfortClasses.forEach((cls) => {
    const count = features.filter((feature) => feature.properties.comfort_class === cls).length;
    const target = document.querySelector<HTMLElement>(`[data-count-class="${cls}"]`);

    if (target) {
      target.textContent = formatter.format(count);
    }
  });

  const comfortableCount = features.filter((feature) =>
    comfortableClasses.includes(feature.properties.comfort_class)
  ).length;
  const comfortableTarget = document.querySelector<HTMLElement>(
    '[data-count-group="comfortable"]'
  );

  if (comfortableTarget) {
    comfortableTarget.textContent = formatter.format(comfortableCount);
  }
}

export function renderParkingCount(count: number, language: Language): void {
  const target = document.getElementById('parkingCount');
  if (target) target.textContent = new Intl.NumberFormat(localeByLanguage[language]).format(count);
}

export function renderParkingCoverage(count: number, language: Language): void {
  const target = document.getElementById('parkingCoverage');
  if (!target) return;

  target.textContent = messages[language].parkingCoverage.replace(
    '{count}',
    new Intl.NumberFormat(localeByLanguage[language]).format(count)
  );
}

export function bindControls(cyclingMap: CyclingMap, language: Language): void {
  const copy = messages[language];
  document.querySelectorAll<HTMLInputElement>('[data-class]').forEach((input) => {
    input.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      cyclingMap.setClassVisibility(target.dataset.class as ComfortClass, target.checked);
      syncComfortableGroup();
    });
  });

  document.getElementById('comfortableGroup')?.addEventListener('change', (event) => {
    const checked = (event.target as HTMLInputElement).checked;

    comfortableClasses.forEach((cls) => {
      const input = document.querySelector<HTMLInputElement>(`[data-class="${cls}"]`);
      if (input) {
        input.checked = checked;
      }
      cyclingMap.setClassVisibility(cls, checked);
    });

    syncComfortableGroup();
  });

  const areaButtons = document.getElementById('areaButtons');
  if (areaButtons) {
    populateAreaButtons(areaButtons, cyclingMap, language);
  }

  const destinationLinks = document.getElementById('destinationLinks');
  if (destinationLinks) populateDestinationLinks(destinationLinks, language);

  document.querySelectorAll<HTMLInputElement>('[data-map-layer]').forEach((input) => {
    input.addEventListener('change', () => {
      cyclingMap.setOverlayVisibility(input.dataset.mapLayer as MapOverlay, input.checked);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-language]').forEach((button) => {
    const buttonLanguage = button.dataset.language as Language;
    button.setAttribute('aria-pressed', String(buttonLanguage === language));
    button.addEventListener('click', () => {
      const nextLanguage = button.dataset.language as Language;
      if (nextLanguage === language) return;
      rememberLanguage(nextLanguage);
      window.location.assign(languageUrl(nextLanguage));
    });
  });

  document.getElementById('resetBtn')?.addEventListener('click', () => {
    cyclingMap.resetView();
  });

  const locateButton = document.getElementById('locateBtn') as HTMLButtonElement | null;
  const mapNotice = document.getElementById('mapNotice');
  locateButton?.addEventListener('click', async () => {
    locateButton.disabled = true;
    locateButton.classList.add('is-busy');
    const result = await cyclingMap.locateUser();
    locateButton.disabled = false;
    locateButton.classList.remove('is-busy');

    if (result !== 'success' && mapNotice) {
      mapNotice.textContent = result === 'denied' ? copy.locateDenied : copy.locateFailed;
      mapNotice.hidden = false;
      window.setTimeout(() => {
        mapNotice.hidden = true;
      }, 3200);
    }
  });

  const shareButton = document.getElementById('shareBtn') as HTMLButtonElement | null;
  shareButton?.addEventListener('click', async () => {
    const originalLabel = copy.share;

    try {
      await navigator.clipboard.writeText(cyclingMap.getShareUrl());
      shareButton.textContent = copy.copied;
    } catch {
      shareButton.textContent = copy.copyFailed;
    }

    window.setTimeout(() => {
      shareButton.textContent = originalLabel;
    }, 1600);
  });

  syncComfortableGroup();
}
