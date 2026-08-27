import { classMeta } from '../config';
import { classText, messages, type Language } from '../i18n';
import type { CyclingSegmentFeature } from '../types';

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
  const element = document.createElement('span');
  element.textContent = value;
  return element.innerHTML;
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

  return `
    <h3 class="detail-title">${escapeHtml(properties.name)}</h3>
    <div class="badge" style="background:${meta.color}">${escapeHtml(classText[language][properties.comfort_class].label)}</div>
    ${properties.warning ? `<p class="warning">${escapeHtml(properties.warning)}</p>` : ''}
    <p class="segment-summary">${escapeHtml(summary)}</p>
    ${facts.length > 0 ? `<ul class="riding-facts">${facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('')}</ul>` : ''}
    <p class="segment-source"><span>${escapeHtml(copy.segmentSource)}: ${sourceLink}</span>${retrievedDate ? `<span>${escapeHtml(copy.sourceChecked)} ${escapeHtml(retrievedDate)}</span>` : ''}</p>
    <p class="data-caveat">${escapeHtml(copy.dataCaveat)}</p>
    <button class="data-report-button segment-report-button" type="button">${escapeHtml(copy.segmentReportAction)}</button>`;
}

export function setLoadingFailure(panel: HTMLElement, language: Language): void {
  const copy = messages[language];
  panel.innerHTML = `<h2>${escapeHtml(copy.detailHeading)}</h2><p>${escapeHtml(copy.loadingFailed)}</p>`;
}
