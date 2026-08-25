import 'leaflet/dist/leaflet.css';
import '../styles.css';
import { classUrlValues, comfortClasses, defaultVisibleClasses } from './config';
import { loadSegments } from './data/loadSegments';
import { createCyclingMap } from './map/createMap';
import { bindControls, renderClassCounts } from './ui/controls';
import { setLoadingFailure } from './ui/detailPanel';
import { renderSourceRegistry } from './ui/sources';

const detailPanel = document.getElementById('detailPanel');
const visibleCount = document.getElementById('visibleCount');

if (!detailPanel || !visibleCount) {
  throw new Error('Required map UI elements are missing.');
}

const cyclingMap = createCyclingMap('map', detailPanel, visibleCount);
const searchParams = new URLSearchParams(window.location.search);
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
bindControls(cyclingMap);

const sourceList = document.getElementById('sourceList');
if (sourceList) {
  renderSourceRegistry(sourceList);
}

loadSegments()
  .then((segments) => {
    cyclingMap.rebuild(segments.features, initialVisibleClasses);
    renderClassCounts(segments.features);
  })
  .catch((error: unknown) => {
    console.error(error);
    setLoadingFailure(detailPanel);
  });
