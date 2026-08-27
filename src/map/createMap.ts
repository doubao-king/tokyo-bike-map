import L from 'leaflet';
import { classMeta, classUrlValues, comfortClasses, tokyoInitialView } from '../config';
import { countByClass } from '../data/segmentSchema';
import { feedbackOpenEvent, type FeedbackOpenRequest } from '../feedback';
import { messages, type Language } from '../i18n';
import {
  renderDefaultDetail,
  renderParkingDetail,
  renderSegmentDetail
} from '../ui/detailPanel';
import type {
  BicycleParkingFeature,
  ComfortClass,
  CyclingSegmentFeature,
  MapOverlay
} from '../types';
import { getTileConfig } from './tileConfig';
import { areaTargetFromPath } from '../seo';

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

type MapSelection =
  | {
      feature: CyclingSegmentFeature;
      layer: L.Path;
      reportLocation: L.LatLng;
      type: 'segment';
    }
  | {
      feature: BicycleParkingFeature;
      marker: L.CircleMarker;
      reportLocation: L.LatLng;
      type: 'parking';
    };

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
  const requestedArea = areaTargetFromPath(window.location.pathname);
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
    : requestedArea
    ? requestedArea.center
    : tokyoInitialView.center;
  const initialZoom = hasRequestedView
    ? requestedZoom
    : requestedArea
    ? requestedArea.zoom
    : tokyoInitialView.zoom;
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
  let selection: MapSelection | undefined;
  let dataReady = false;

  map.createPane('comfortCasingPane');
  map.createPane('comfortLinePane');
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
  const parkingPane = map.getPane('parkingPane');
  const locationPane = map.getPane('locationPane');
  if (parkingPane) parkingPane.style.zIndex = '420';
  if (locationPane) locationPane.style.zIndex = '430';
  const parkingRenderer = L.svg({ pane: 'parkingPane' });
  const locationRenderer = L.svg({ pane: 'locationPane' });

  const tileConfig = getTileConfig();
  L.tileLayer(tileConfig.url, {
    maxZoom: tileConfig.maxZoom,
    attribution: tileConfig.attribution
  }).addTo(map);

  function requestFeedback(request: FeedbackOpenRequest): void {
    document.dispatchEvent(
      new CustomEvent<FeedbackOpenRequest>(feedbackOpenEvent, { detail: request })
    );
  }

  function shareUrlAt(latitude: number, longitude: number): string {
    syncUrl(true);
    const url = new URL(window.location.href);
    url.searchParams.set('lat', latitude.toFixed(5));
    url.searchParams.set('lng', longitude.toFixed(5));
    url.searchParams.set('z', String(map.getZoom()));
    url.searchParams.delete('feedback');
    return url.href;
  }

  function rebuildParkingLayer(): void {
    if (selection?.type === 'parking') clearSelection();
    const wasVisible = map.hasLayer(parkingLayer);
    if (wasVisible) map.removeLayer(parkingLayer);

    parkingLayer = L.layerGroup(
      parkingFeatures.map((feature) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        const marker = L.circleMarker([latitude, longitude], {
          bubblingMouseEvents: false,
          pane: 'parkingPane',
          renderer: parkingRenderer,
          radius: 5,
          color: '#ffffff',
          weight: 1.8,
          fillColor: '#2367a7',
          fillOpacity: 0.94
        }).bindTooltip(feature.properties.name, { direction: 'top' });

        marker.on('click', (event: L.LeafletMouseEvent) => {
          selectParking(marker, feature, event.latlng);
        });

        return marker;
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
      bubblingMouseEvents: false,
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
    if (selection?.type === 'segment') {
      const baseStyle = styleFeature(selection.feature);
      selection.layer.setStyle({
        ...baseStyle,
        weight: Number(baseStyle.weight ?? 5) + 3,
        opacity: 1
      });
      selection.layer.bringToFront();
    } else if (selection?.type === 'parking') {
      selection.marker.setRadius(8);
      selection.marker.setStyle({
        color: '#ffffff',
        fillColor: '#174f82',
        fillOpacity: 1,
        weight: 3
      });
      selection.marker.bringToFront();
    }
  }

  function resetSelectedStyle(): void {
    if (selection?.type === 'segment') {
      selection.layer.setStyle(styleFeature(selection.feature));
    } else if (selection?.type === 'parking') {
      selection.marker.setRadius(5);
      selection.marker.setStyle({
        color: '#ffffff',
        fillColor: '#2367a7',
        fillOpacity: 0.94,
        weight: 1.8
      });
    }
  }

  function clearSelection(focusMap = false): void {
    resetSelectedStyle();
    selection = undefined;
    detailPanel.innerHTML = renderDefaultDetail(language);
    if (focusMap) map.getContainer().focus({ preventScroll: true });
  }

  function showSelectedDetail(): void {
    detailPanel.innerHTML = selection?.type === 'segment'
      ? renderSegmentDetail(selection.feature, language)
      : selection?.type === 'parking'
      ? renderParkingDetail(selection.feature, language)
      : renderDefaultDetail(language);

    detailPanel.scrollIntoView({
      behavior: 'smooth',
      block: window.matchMedia('(max-width: 780px)').matches ? 'start' : 'nearest'
    });
  }

  function selectSegment(
    layer: L.Path,
    feature: CyclingSegmentFeature,
    reportLocation: L.LatLng
  ): void {
    resetSelectedStyle();
    selection = { feature, layer, reportLocation, type: 'segment' };
    applySelectedStyle();
    showSelectedDetail();
  }

  function selectParking(
    marker: L.CircleMarker,
    feature: BicycleParkingFeature,
    reportLocation: L.LatLng
  ): void {
    resetSelectedStyle();
    selection = { feature, marker, reportLocation, type: 'parking' };
    applySelectedStyle();
    showSelectedDetail();
  }

  function feedbackRequestForSelection(): FeedbackOpenRequest {
    if (selection?.type === 'segment') {
      return {
        mapUrl: shareUrlAt(selection.reportLocation.lat, selection.reportLocation.lng),
        subjectId: selection.feature.properties.id,
        subjectName: selection.feature.properties.name,
        subjectType: 'segment',
        suggestedCategory: 'road_change'
      };
    }
    if (selection?.type === 'parking') {
      return {
        mapUrl: shareUrlAt(selection.reportLocation.lat, selection.reportLocation.lng),
        subjectId: selection.feature.properties.id,
        subjectName: selection.feature.properties.name,
        subjectType: 'parking',
        suggestedCategory: 'parking_change'
      };
    }

    const center = map.getCenter();
    return {
      mapUrl: shareUrlAt(center.lat, center.lng),
      subjectType: 'map_location',
      suggestedCategory: 'missing_information'
    };
  }

  function syncUrl(force = false): void {
    if (!dataReady && !force) {
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
    clearSelection();
    layerByClass.forEach(({ group }) => map.removeLayer(group));
    layerByClass.clear();
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
          layer.on('click', (event: L.LeafletMouseEvent) => {
            if (layer instanceof L.Path) {
              selectSegment(layer, segment, event.latlng);
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
      if (
        selection?.type === 'segment' &&
        selection.feature.properties.comfort_class === cls
      ) {
        clearSelection();
      }
      activeClasses.delete(cls);
      map.removeLayer(layerSet.group);
    }

    updateCount();
    syncUrl();
  }

  function setOverlayVisibility(overlay: MapOverlay, visible: boolean): void {
    const layer = parkingLayer;
    if (visible) {
      activeOverlays.add(overlay);
      if (!map.hasLayer(layer)) layer.addTo(map);
    } else {
      if (selection?.type === 'parking') clearSelection();
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
          clearSelection();
          const center: L.LatLngExpression = [position.coords.latitude, position.coords.longitude];
          locationMarker?.removeFrom(map);
          locationAccuracyLayer?.removeFrom(map);
          locationAccuracyLayer = L.circle(center, {
            pane: 'locationPane',
            renderer: locationRenderer,
            radius: position.coords.accuracy,
            color: '#2463a6',
            weight: 1,
            fillColor: '#5aa5e6',
            fillOpacity: 0.1,
            interactive: false
          }).addTo(map);
          locationMarker = L.circleMarker(center, {
            pane: 'locationPane',
            renderer: locationRenderer,
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

  detailPanel.innerHTML = renderDefaultDetail(language);
  detailPanel.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const actionButton = target.closest<HTMLButtonElement>('[data-detail-action]');
    if (!actionButton) return;

    if (actionButton.dataset.detailAction === 'clear') {
      clearSelection(true);
    } else if (actionButton.dataset.detailAction === 'report') {
      requestFeedback(feedbackRequestForSelection());
    }
  });

  map.on('click', () => {
    if (selection) clearSelection();
  });
  map.getContainer().addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && selection) clearSelection(true);
  });

  map.on('zoomend', () => {
    layerByClass.forEach(({ casing, color }) => {
      casing.setStyle((feature) => styleCasing(feature as CyclingSegmentFeature));
      color.setStyle((feature) => styleFeature(feature as CyclingSegmentFeature));
    });
    applySelectedStyle();
  });
  map.on('moveend', () => syncUrl());

  return {
    flyTo: (center, zoom) => {
      clearSelection();
      map.flyTo(center, zoom, { duration: 0.7 });
    },
    getShareUrl: () => {
      syncUrl(true);
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
    resetView: () => {
      clearSelection();
      map.flyTo(tokyoInitialView.center, tokyoInitialView.zoom);
    }
  };
}
