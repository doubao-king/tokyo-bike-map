import L from 'leaflet';
import { classMeta, classUrlValues, comfortClasses, tokyoInitialView } from '../config';
import { countByClass } from '../data/segmentSchema';
import { localeByLanguage, messages, type Language } from '../i18n';
import { renderSegmentDetail } from '../ui/detailPanel';
import type {
  BicycleParkingFeature,
  ComfortClass,
  CyclingSegmentFeature,
  MapOverlay
} from '../types';
import { getTileConfig } from './tileConfig';

export interface CyclingMap {
  flyTo(center: [number, number], zoom: number): void;
  getShareUrl(): string;
  locateUser(): Promise<'denied' | 'failed' | 'success'>;
  rebuild(features: CyclingSegmentFeature[], activeClasses: Set<ComfortClass>): void;
  setOverlayVisibility(overlay: MapOverlay, visible: boolean): void;
  setParkingFeatures(features: BicycleParkingFeature[]): void;
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
  visibleCount: HTMLElement,
  language: Language,
  initialOverlays: Set<MapOverlay>
): CyclingMap {
  const copy = messages[language];
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
  const activeOverlays = new Set(initialOverlays);
  let features: CyclingSegmentFeature[] = [];
  let activeClasses = new Set<ComfortClass>();
  let parkingFeatures: BicycleParkingFeature[] = [];
  let parkingLayer = L.layerGroup();
  let locationAccuracyLayer: L.Circle | undefined;
  let locationMarker: L.CircleMarker | undefined;
  let selectedLayer: L.Path | undefined;
  let selectedFeature: CyclingSegmentFeature | undefined;
  let dataReady = false;

  map.createPane('comfortCasingPane');
  map.createPane('comfortLinePane');
  map.createPane('slopePane');
  map.createPane('parkingPane');
  map.createPane('locationPane');
  const comfortCasingPane = map.getPane('comfortCasingPane');
  const comfortLinePane = map.getPane('comfortLinePane');
  if (comfortCasingPane) {
    comfortCasingPane.style.zIndex = '405';
    comfortCasingPane.style.pointerEvents = 'none';
  }
  if (comfortLinePane) {
    comfortLinePane.style.zIndex = '410';
  }
  const slopePane = map.getPane('slopePane');
  const parkingPane = map.getPane('parkingPane');
  const locationPane = map.getPane('locationPane');
  if (slopePane) {
    slopePane.style.zIndex = '240';
    slopePane.style.mixBlendMode = 'multiply';
    slopePane.style.pointerEvents = 'none';
  }
  if (parkingPane) parkingPane.style.zIndex = '420';
  if (locationPane) locationPane.style.zIndex = '430';

  const tileConfig = getTileConfig();
  L.tileLayer(tileConfig.url, {
    maxZoom: tileConfig.maxZoom,
    attribution: tileConfig.attribution
  }).addTo(map);
  const slopeLayer = L.tileLayer(
    'https://cyberjapandata.gsi.go.jp/xyz/slopemap/{z}/{x}/{y}.png',
    {
      attribution:
        '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">GSI Maps</a>',
      maxNativeZoom: 15,
      maxZoom: tileConfig.maxZoom,
      minZoom: 3,
      opacity: 0.58,
      pane: 'slopePane'
    }
  );
  if (activeOverlays.has('slope')) slopeLayer.addTo(map);

  function escapeHtml(value: string): string {
    const element = document.createElement('span');
    element.textContent = value;
    return element.innerHTML;
  }

  function parkingPopup(feature: BicycleParkingFeature): string {
    const properties = feature.properties;
    const formatter = new Intl.NumberFormat(localeByLanguage[language]);
    return `
      <div class="parking-popup">
        <strong>${escapeHtml(properties.name)}</strong>
        <span>${escapeHtml(properties.municipality)}</span>
        ${properties.address ? `<span>${escapeHtml(copy.parkingAddress)}: ${escapeHtml(properties.address)}</span>` : ''}
        ${properties.capacity !== undefined ? `<span>${escapeHtml(copy.parkingCapacity)}: ${formatter.format(properties.capacity)} ${escapeHtml(copy.parkingSpaces)}</span>` : ''}
        <a href="${escapeHtml(properties.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(copy.parkingSource)}</a>
      </div>`;
  }

  function rebuildParkingLayer(): void {
    const wasVisible = map.hasLayer(parkingLayer);
    if (wasVisible) map.removeLayer(parkingLayer);

    parkingLayer = L.layerGroup(
      parkingFeatures.map((feature) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        return L.circleMarker([latitude, longitude], {
          pane: 'parkingPane',
          radius: 5,
          color: '#ffffff',
          weight: 1.8,
          fillColor: '#2367a7',
          fillOpacity: 0.94
        })
          .bindTooltip(feature.properties.name, { direction: 'top' })
          .bindPopup(parkingPopup(feature), {
            autoPanPaddingTopLeft: L.point(12, 96),
            autoPanPaddingBottomRight: L.point(12, 84),
            maxWidth: 280
          });
      })
    );

    if (activeOverlays.has('parking')) parkingLayer.addTo(map);
  }
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
    if (activeOverlays.size > 0) {
      params.set('layers', [...activeOverlays].sort().join(','));
    } else {
      params.delete('layers');
    }
    if (language === 'ja') {
      params.delete('lang');
    } else {
      params.set('lang', language);
    }
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
            detailPanel.innerHTML = `<h2>${escapeHtml(copy.detailHeading)}</h2>${renderSegmentDetail(segment, language)}`;

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

  function setOverlayVisibility(overlay: MapOverlay, visible: boolean): void {
    const layer = overlay === 'slope' ? slopeLayer : parkingLayer;
    if (visible) {
      activeOverlays.add(overlay);
      if (!map.hasLayer(layer)) layer.addTo(map);
    } else {
      activeOverlays.delete(overlay);
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
    syncUrl();
  }

  function locateUser(): Promise<'denied' | 'failed' | 'success'> {
    if (!navigator.geolocation) return Promise.resolve('failed');

    return new Promise((resolveLocation) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const center: L.LatLngExpression = [position.coords.latitude, position.coords.longitude];
          locationMarker?.removeFrom(map);
          locationAccuracyLayer?.removeFrom(map);
          locationAccuracyLayer = L.circle(center, {
            pane: 'locationPane',
            radius: position.coords.accuracy,
            color: '#2463a6',
            weight: 1,
            fillColor: '#5aa5e6',
            fillOpacity: 0.1,
            interactive: false
          }).addTo(map);
          locationMarker = L.circleMarker(center, {
            pane: 'locationPane',
            radius: 7,
            color: '#ffffff',
            weight: 3,
            fillColor: '#2463a6',
            fillOpacity: 1
          })
            .bindTooltip(copy.locate, { direction: 'top' })
            .addTo(map);
          map.flyTo(center, Math.max(map.getZoom(), 15), { duration: 0.7 });
          resolveLocation('success');
        },
        (error) => resolveLocation(error.code === 1 ? 'denied' : 'failed'),
        { enableHighAccuracy: true, maximumAge: 30_000, timeout: 12_000 }
      );
    });
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
    locateUser,
    rebuild,
    setOverlayVisibility,
    setParkingFeatures: (nextFeatures) => {
      parkingFeatures = nextFeatures;
      rebuildParkingLayer();
    },
    setClassVisibility,
    resetView: () => map.flyTo(tokyoInitialView.center, tokyoInitialView.zoom)
  };
}
