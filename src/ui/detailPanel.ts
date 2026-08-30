import { classMeta } from '../config';
import { classText, localeByLanguage, messages, type Language } from '../i18n';
import { createParkingMapLinks } from '../map/parkingLinks';
import type {
  BicycleParkingFeature,
  CyclingSegmentFeature,
  MapDestination,
  NearbyParking
} from '../types';

const facilitySummaries: Record<Language, Record<string, string>> = {
  ja: {
    cycleway: '車や歩行者と分けられた自転車通行空間として登録されています。',
    shared_or_unspecified_cycleway:
      '車道から分離された自転車道として登録されています。歩行者との分離は確認できません。',
    protected_cycle_track: '車道から物理的に分離された自転車通行空間として登録されています。',
    separate_cycleway_inferred:
      'この道路に並行する別線の自転車道が登録されています。表示位置は概略です。',
    path_or_sidewalk_bicycle_space: '歩道や園路側の自転車通行空間として登録されています。',
    painted_bike_lane: '車道上の自転車レーンです。自動車との物理的な分離はありません。',
    mixed_traffic_marking: '自動車と同じ車道を走る、自転車向け表示のある区間です。',
    cycling_related_unclassified:
      '自転車に関する登録がありますが、通行空間の種類は確認できません。'
  },
  en: {
    cycleway: 'Registered as a bicycle facility separated from cars and pedestrians.',
    shared_or_unspecified_cycleway:
      'Registered as separated from the roadway; separation from pedestrians is not confirmed.',
    protected_cycle_track: 'Registered as a bicycle facility physically separated from cars.',
    separate_cycleway_inferred:
      'A separate parallel cycleway is registered for this road. Its displayed position is approximate.',
    path_or_sidewalk_bicycle_space: 'Registered as bicycle space beside a sidewalk or within a park path.',
    painted_bike_lane: 'A bicycle lane on the roadway without physical separation from cars.',
    mixed_traffic_marking: 'A roadway shared with cars that has bicycle guide markings.',
    cycling_related_unclassified:
      'Cycling-related data is registered, but the facility type could not be confirmed.'
  },
  zh: {
    cycleway: '登记为与机动车和行人分隔的自行车通行空间。',
    shared_or_unspecified_cycleway: '登记为与机动车道分隔，但尚未确认是否与行人分隔。',
    protected_cycle_track: '登记为与机动车物理隔离的自行车通行空间。',
    separate_cycleway_inferred: '此道路登记有平行的独立自行车道，显示位置为大致位置。',
    path_or_sidewalk_bicycle_space: '登记为人行道旁或公园道路内的自行车通行空间。',
    painted_bike_lane: '机动车道上的自行车专用车道，没有与机动车物理隔离。',
    mixed_traffic_marking: '与机动车共用、设有自行车引导标记的道路。',
    cycling_related_unclassified: '登记有自行车相关信息，但尚未确认设施类型。'
  }
};

const factsByLanguage: Record<Language, Record<string, string>> = {
  ja: {
    carSeparated: '車道と分離',
    carShared: '自動車と車道を共有',
    pedestrianShared: '歩行者と共有',
    pedestrianSeparated: '歩行者と分離',
    oneWay: '一方通行'
  },
  en: {
    carSeparated: 'Separated from cars',
    carShared: 'Roadway shared with cars',
    pedestrianShared: 'Shared with pedestrians',
    pedestrianSeparated: 'Separated from pedestrians',
    oneWay: 'One way'
  },
  zh: {
    carSeparated: '与机动车道分隔',
    carShared: '与机动车共用车道',
    pedestrianShared: '与行人共用',
    pedestrianSeparated: '与行人分隔',
    oneWay: '单向通行'
  }
};

function escapeHtml(value: string): string {
  const replacements: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return value.replace(/[&<>"']/g, (character) => replacements[character]);
}

function safeExternalUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function ridingFacts(feature: CyclingSegmentFeature, language: Language): string[] {
  const properties = feature.properties;
  const facts: string[] = [];
  const copy = factsByLanguage[language];

  if (properties.car_separation === 'yes') {
    facts.push(copy.carSeparated);
  } else if (properties.car_separation === 'no') {
    facts.push(copy.carShared);
  }

  if (properties.pedestrian_shared === 'yes') {
    facts.push(copy.pedestrianShared);
  } else if (properties.pedestrian_shared === 'no') {
    facts.push(copy.pedestrianSeparated);
  }

  if (properties.direction === 'oneway') {
    facts.push(copy.oneWay);
  }

  return facts;
}

function renderHeading(
  language: Language,
  clearAction?: 'clear' | 'clear-destination'
): string {
  const copy = messages[language];
  const clearLabel = clearAction === 'clear-destination'
    ? copy.destinationClear
    : copy.clearSelection;
  return `<div class="detail-heading-row">
    <h2>${escapeHtml(copy.detailHeading)}</h2>
    ${
      clearAction
        ? `<button class="detail-clear-button" type="button" data-detail-action="${clearAction}" aria-label="${escapeHtml(clearLabel)}" title="${escapeHtml(clearLabel)}">&times;</button>`
        : ''
    }
  </div>`;
}

export function renderDefaultDetail(language: Language): string {
  const copy = messages[language];
  return `${renderHeading(language)}
    <p class="muted">${escapeHtml(copy.detailPrompt)}</p>
    <button class="report-button" type="button" data-detail-action="report">${escapeHtml(copy.reportAction)}</button>
    <small class="detail-report-note">${escapeHtml(copy.reportNote)}</small>`;
}

export function renderSegmentDetail(feature: CyclingSegmentFeature, language: Language): string {
  const properties = feature.properties;
  const meta = classMeta[properties.comfort_class];
  const copy = messages[language];
  const sourceUrl = safeExternalUrl(properties.source.url);
  const sourceLink = sourceUrl
    ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(copy.viewSourceData)}</a>`
    : escapeHtml(properties.source.name);
  const facts = ridingFacts(feature, language);
  const retrievedDate = properties.source.retrieved_at?.slice(0, 10);
  const summary =
    facilitySummaries[language][properties.facility_type] ?? properties.facility_type;

  return `${renderHeading(language, 'clear')}
    <h3 class="detail-title">${escapeHtml(properties.name)}</h3>
    <div class="badge" style="background:${meta.color}">${escapeHtml(classText[language][properties.comfort_class].label)}</div>
    ${properties.warning ? `<p class="warning">${escapeHtml(properties.warning)}</p>` : ''}
    <p class="segment-summary">${escapeHtml(summary)}</p>
    ${facts.length > 0 ? `<ul class="riding-facts">${facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('')}</ul>` : ''}
    <p class="segment-source"><span>${escapeHtml(copy.segmentSource)}: ${sourceLink}</span>${retrievedDate ? `<span>${escapeHtml(copy.sourceChecked)} ${escapeHtml(retrievedDate)}</span>` : ''}</p>
    <p class="data-caveat">${escapeHtml(copy.dataCaveat)}</p>
    <button class="report-button detail-selection-report" type="button" data-detail-action="report">${escapeHtml(copy.segmentReportAction)}</button>`;
}

export function renderParkingDetail(feature: BicycleParkingFeature, language: Language): string {
  const properties = feature.properties;
  const copy = messages[language];
  const formatter = new Intl.NumberFormat(localeByLanguage[language]);
  const mapLinks = createParkingMapLinks(feature);
  const sourceUrl = safeExternalUrl(properties.source_url);

  return `${renderHeading(language, 'clear')}
    <h3 class="detail-title">${escapeHtml(properties.name)}</h3>
    <div class="badge parking-detail-badge"><span aria-hidden="true">P</span>${escapeHtml(copy.parkingDetailLabel)}</div>
    <p class="parking-detail-municipality">${escapeHtml(properties.municipality)}</p>
    <div class="parking-detail-meta">
      ${properties.address ? `<p><span>${escapeHtml(copy.parkingAddress)}</span><strong>${escapeHtml(properties.address)}</strong></p>` : ''}
      ${properties.capacity !== undefined ? `<p><span>${escapeHtml(copy.parkingCapacity)}</span><strong>${formatter.format(properties.capacity)} ${escapeHtml(copy.parkingSpaces)}</strong></p>` : ''}
    </div>
    <p class="parking-detail-caveat">${escapeHtml(copy.parkingStatusCheck)}</p>
    <div class="parking-detail-actions" aria-label="${escapeHtml(copy.parkingOpenMaps)}">
      <a href="${escapeHtml(mapLinks.google)}" target="_blank" rel="noreferrer">Google Maps</a>
      <a href="${escapeHtml(mapLinks.apple)}" target="_blank" rel="noreferrer">Apple Maps</a>
    </div>
    ${sourceUrl ? `<a class="parking-detail-source" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(copy.parkingSource)}</a>` : ''}
    <button class="report-button detail-selection-report" type="button" data-detail-action="report">${escapeHtml(copy.parkingReportAction)}</button>`;
}

function formatDistance(distanceMeters: number, language: Language): string {
  if (distanceMeters < 1_000) {
    const roundedMeters = Math.max(10, Math.round(distanceMeters / 10) * 10);
    return `${new Intl.NumberFormat(localeByLanguage[language]).format(roundedMeters)} m`;
  }

  return `${new Intl.NumberFormat(localeByLanguage[language], {
    maximumFractionDigits: 1
  }).format(distanceMeters / 1_000)} km`;
}

export function renderDestinationDetail(
  destination: MapDestination,
  nearbyParking: NearbyParking[],
  language: Language
): string {
  const copy = messages[language];
  const parkingList = nearbyParking.length > 0
    ? `<div class="destination-parking-list">${nearbyParking
        .map(({ distanceMeters, feature }) => `<button class="destination-parking-result" type="button" data-detail-action="select-parking" data-parking-id="${escapeHtml(feature.properties.id)}">
          <span><strong>${escapeHtml(feature.properties.name)}</strong><small>${escapeHtml(feature.properties.municipality)}</small></span>
          <b>${escapeHtml(formatDistance(distanceMeters, language))}</b>
        </button>`)
        .join('')}</div>`
    : `<p class="destination-parking-empty">${escapeHtml(copy.destinationNearbyEmpty)}</p>`;

  return `${renderHeading(language, 'clear-destination')}
    <h3 class="detail-title">${escapeHtml(destination.name)}</h3>
    <div class="badge destination-detail-badge">${escapeHtml(copy.destinationType)}</div>
    ${destination.context ? `<p class="destination-context">${escapeHtml(destination.context)}</p>` : ''}
    <h4 class="destination-nearby-heading">${escapeHtml(copy.destinationNearbyHeading)}</h4>
    <p class="destination-nearby-help">${escapeHtml(copy.destinationNearbyHelp)}</p>
    ${parkingList}
    <button class="report-button destination-report-button" type="button" data-detail-action="report">${escapeHtml(copy.reportAction)}</button>
    <small class="detail-report-note">${escapeHtml(copy.reportNote)}</small>`;
}

export function setLoadingFailure(panel: HTMLElement, language: Language): void {
  const copy = messages[language];
  panel.innerHTML = `${renderHeading(language)}<p>${escapeHtml(copy.loadingFailed)}</p>`;
}
