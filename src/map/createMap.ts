import L from 'leaflet';
import { classMeta, classUrlValues, comfortClasses, tokyoInitialView } from '../config';
import { countByClass } from '../data/segmentSchema';
import { renderSegmentDetail } from '../ui/detailPanel';
import type { ComfortClass, CyclingSegmentFeature } from '../types';
import { getTileConfig } from './tileConfig';

export interface CyclingMap {
  flyTo(center: [number, number], zoom: number): void;
  getShareUrl(): string;
  rebuild(features: CyclingSegmentFeature[], activeClasses: Set<ComfortClass>): void;
  setClassVisibility(cls: ComfortClass, visible: boolean): void;
  resetView(): void;
}

interface ComfortLayerSet {
  group: L.LayerGroup;
  casing: L.GeoJSON;
  color: L.GeoJSON;
}

export function createCyclingMap(
  mapElementId: string,
  detailPanel: HTMLElement,
  visibleCount: HTMLElement
): CyclingMap {
  const urlParams = new URLSearchParams(window.location.search);
  const requestedLatitude = Number(urlParams.get('lat'));
  const requestedLongitude = Number(urlParams.get('lng'));
  const requestedZoom = Number(urlParams.get('z'));
  const hasRequestedView =
    Number.isFinite(requestedLatitude) &&
    Number.isFinite(requestedLongitude) &&
    Number.isFinite(requestedZoom) &&
    requestedLatitude >= 24 &&
    requestedLatitude <= 36 &&
    requestedLongitude >= 138.5 &&
    requestedLongitude <= 143 &&
    requestedZoom >= 10 &&
    requestedZoom <= 19;
  const initialCenter = hasRequestedView
    ? ([requestedLatitude, requestedLongitude] as [number, number])
    : tokyoInitialView.center;
  const initialZoom = hasRequestedView ? requestedZoom : tokyoInitialView.zoom;
  const map = L.map(mapElementId, { zoomControl: true, preferCanvas: true }).setView(
    initialCenter,
    initialZoom
  );
  const layerByClass = new Map<ComfortClass, ComfortLayerSet>();
  let features: CyclingSegmentFeature[] = [];
  let activeClasses = new Set<ComfortClass>();
  let selectedLayer: L.Path | undefined;
  let selectedFeature: CyclingSegmentFeature | undefined;
  let dataReady = false;

  map.createPane('comfortCasingPane');
  map.createPane('comfortLinePane');
  const comfortCasingPane = map.getPane('comfortCasingPane');
  const comfortLinePane = map.getPane('comfortLinePane');
  if (comfortCasingPane) {
    comfortCasingPane.style.zIndex = '405';
    comfortCasingPane.style.pointerEvents = 'none';
  }
  if (comfortLinePane) {
    comfortLinePane.style.zIndex = '410';
  }
  const tileConfig = getTileConfig();
  L.tileLayer(tileConfig.url, {
    maxZoom: tileConfig.maxZoom,
    attribution: tileConfig.attribution
  }).addTo(map);
  function updateCount(): void {
    visibleCount.textContent = String(countByClass(features, activeClasses));
  }

  function styleFeature(feature?: CyclingSegmentFeature): L.PathOptions {
    const cls = feature?.properties.comfort_class ?? 'D';
    const confidence = feature?.properties.classification_confidence ?? 'medium';
    const zoom = map.getZoom();
    const zoomWeight = zoom >= 16 ? 6 : zoom >= 14 ? 5 : 4;
    const classWeight = cls === 'A' ? 1 : cls === 'B' ? 0.3 : 0;
    const confidenceOpacity = confidence === 'high' ? 0.94 : confidence === 'medium' ? 0.8 : 0.58;

    return {
      pane: 'comfortLinePane',
      color: classMeta[cls].color,
      weight: zoomWeight + classWeight + 0.8,
      opacity: confidenceOpacity,
      lineCap: 'round',
      lineJoin: 'round'
    };
  }

  function styleCasing(feature?: CyclingSegmentFeature): L.PathOptions {
    const colorStyle = styleFeature(feature);
    const confidence = feature?.properties.classification_confidence ?? 'medium';

    return {
      pane: 'comfortCasingPane',
      color: '#fffef9',
      weight: Number(colorStyle.weight ?? 5) + 3.4,
      opacity: confidence === 'low' ? 0.68 : 0.88,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false
    };
  }

  function applySelectedStyle(): void {
    if (!selectedLayer || !selectedFeature) {
      return;
    }

    const baseStyle = styleFeature(selectedFeature);
    selectedLayer.setStyle({
      ...baseStyle,
      weight: Number(baseStyle.weight ?? 5) + 3,
      opacity: 1
    });
    selectedLayer.bringToFront();
  }

  function selectSegment(layer: L.Path, segment: CyclingSegmentFeature): void {
    if (selectedLayer && selectedFeature) {
      selectedLayer.setStyle(styleFeature(selectedFeature));
    }

    selectedLayer = layer;
    selectedFeature = segment;
    applySelectedStyle();
  }

  function syncUrl(): void {
    if (!dataReady) {
      return;
    }

    const center = map.getCenter();
    const params = new URLSearchParams(window.location.search);
    params.set('lat', center.lat.toFixed(5));
    params.set('lng', center.lng.toFixed(5));
    params.set('z', String(map.getZoom()));
    params.delete('classes');
    params.set(
      'roads',
      comfortClasses.filter((cls) => activeClasses.has(cls)).map((cls) => classUrlValues[cls]).join(',')
    );
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }

  function rebuild(nextFeatures: CyclingSegmentFeature[], nextActiveClasses: Set<ComfortClass>): void {
    layerByClass.forEach(({ group }) => map.removeLayer(group));
    layerByClass.clear();
    selectedLayer = undefined;
    selectedFeature = undefined;
    features = nextFeatures;
    activeClasses = nextActiveClasses;

    comfortClasses.forEach((cls) => {
      const subset = features.filter((feature) => feature.properties.comfort_class === cls);
      const casing = L.geoJSON(subset, {
        interactive: false,
        style: (feature) => styleCasing(feature as CyclingSegmentFeature)
      });
      const color = L.geoJSON(subset, {
        style: (feature) => styleFeature(feature as CyclingSegmentFeature),
        onEachFeature: (feature, layer) => {
          const segment = feature as CyclingSegmentFeature;
          layer.on('click', () => {
            detailPanel.innerHTML = `<h2>区間情報</h2>${renderSegmentDetail(segment)}`;

            if (layer instanceof L.Path) {
              selectSegment(layer, segment);
            }
          });
          const tooltip = document.createElement('span');
          tooltip.textContent = segment.properties.name;
          layer.bindTooltip(tooltip, { sticky: true });
        }
      });

      const group = L.layerGroup([casing, color]);
      layerByClass.set(cls, { group, casing, color });

      if (activeClasses.has(cls)) {
        group.addTo(map);
      }
    });

    updateCount();
    dataReady = true;
    syncUrl();
  }

  function setClassVisibility(cls: ComfortClass, visible: boolean): void {
    const layerSet = layerByClass.get(cls);

    if (!layerSet) {
      return;
    }

    if (visible) {
      activeClasses.add(cls);
      layerSet.group.addTo(map);
    } else {
      activeClasses.delete(cls);
      map.removeLayer(layerSet.group);
    }

    updateCount();
    syncUrl();
  }

  map.on('zoomend', () => {
    layerByClass.forEach(({ casing, color }) => {
      casing.setStyle((feature) => styleCasing(feature as CyclingSegmentFeature));
      color.setStyle((feature) => styleFeature(feature as CyclingSegmentFeature));
    });
    applySelectedStyle();
  });
  map.on('moveend', syncUrl);

  return {
    flyTo: (center, zoom) => map.flyTo(center, zoom, { duration: 0.7 }),
    getShareUrl: () => {
      syncUrl();
      return window.location.href;
    },
    rebuild,
    setClassVisibility,
    resetView: () => map.flyTo(tokyoInitialView.center, tokyoInitialView.zoom)
  };
}
