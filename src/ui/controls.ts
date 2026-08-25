import { areaTargets, comfortClasses } from '../config';
import type { ComfortClass, CyclingSegmentFeature } from '../types';
import type { CyclingMap } from '../map/createMap';

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

function populateAreaButtons(container: HTMLElement, cyclingMap: CyclingMap): void {
  let currentGroup = '';

  areaTargets.forEach((area) => {
    if (area.group !== currentGroup) {
      const heading = document.createElement('h3');
      heading.className = 'area-group-title';
      heading.textContent = area.group;
      container.append(heading);
      currentGroup = area.group;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.area = area.id;
    button.textContent = area.label;
    button.addEventListener('click', () => cyclingMap.flyTo(area.center, area.zoom));
    container.append(button);
  });
}

export function renderClassCounts(features: CyclingSegmentFeature[]): void {
  const formatter = new Intl.NumberFormat('ja-JP');

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

export function bindControls(cyclingMap: CyclingMap): void {
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
    populateAreaButtons(areaButtons, cyclingMap);
  }

  document.getElementById('resetBtn')?.addEventListener('click', () => {
    cyclingMap.resetView();
  });

  const shareButton = document.getElementById('shareBtn') as HTMLButtonElement | null;
  shareButton?.addEventListener('click', async () => {
    const originalLabel = shareButton.textContent ?? '共有';

    try {
      await navigator.clipboard.writeText(cyclingMap.getShareUrl());
      shareButton.textContent = 'コピー済み';
    } catch {
      shareButton.textContent = 'コピー失敗';
    }

    window.setTimeout(() => {
      shareButton.textContent = originalLabel;
    }, 1600);
  });

  syncComfortableGroup();
}
