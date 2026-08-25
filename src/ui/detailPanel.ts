import { classMeta } from '../config';
import type { CyclingSegmentFeature } from '../types';

const facilityLabels: Record<string, string> = {
  cycleway: '独立した自転車道',
  shared_or_unspecified_cycleway: '歩行者共有または分離不明の自転車道',
  protected_cycle_track: '車道から分離された自転車通行空間',
  separate_cycleway_inferred: '別線の自転車道（位置は推定）',
  path_or_sidewalk_bicycle_space: '歩道側・園路の自転車通行空間',
  painted_bike_lane: '車道上の自転車専用通行帯',
  mixed_traffic_marking: '車道混在・ナビライン等',
  cycling_related_unclassified: '自転車関連・未分類'
};

const facilitySummaries: Record<string, string> = {
  cycleway: '車や歩行者と分けられた自転車通行空間として登録されています。',
  shared_or_unspecified_cycleway:
    '車道から分離された自転車道として登録されています。歩行者との分離は確認できません。',
  protected_cycle_track: '車道から物理的に分離された自転車通行空間として登録されています。',
  separate_cycleway_inferred:
    'この道路に並行する別線の自転車道が登録されています。表示位置は概略です。',
  path_or_sidewalk_bicycle_space:
    '歩道や園路側の自転車通行空間として登録されています。',
  painted_bike_lane: '車道上の自転車レーンです。自動車との物理的な分離はありません。',
  mixed_traffic_marking: '自動車と同じ車道を走る、自転車向け表示のある区間です。',
  cycling_related_unclassified:
    '自転車に関する登録がありますが、通行空間の種類は確認できません。'
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

function ridingFacts(feature: CyclingSegmentFeature): string[] {
  const properties = feature.properties;
  const facts: string[] = [];

  if (properties.car_separation === 'yes') {
    facts.push('車道と分離');
  } else if (properties.car_separation === 'no') {
    facts.push('自動車と車道を共有');
  }

  if (properties.pedestrian_shared === 'yes') {
    facts.push('歩行者と共有');
  } else if (properties.pedestrian_shared === 'no') {
    facts.push('歩行者と分離');
  }

  if (properties.direction === 'oneway') {
    facts.push('一方通行');
  }

  return facts;
}

export function renderSegmentDetail(feature: CyclingSegmentFeature): string {
  const properties = feature.properties;
  const meta = classMeta[properties.comfort_class];
  const sourceUrl = safeExternalUrl(properties.source.url);
  const sourceLink = sourceUrl
    ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">元データを見る</a>`
    : escapeHtml(properties.source.name);
  const facts = ridingFacts(feature);
  const retrievedDate = properties.source.retrieved_at?.slice(0, 10);
  const summary =
    facilitySummaries[properties.facility_type] ??
    `${facilityLabels[properties.facility_type] ?? properties.facility_type}として登録されています。`;

  return `
    <h3 class="detail-title">${escapeHtml(properties.name)}</h3>
    <div class="badge" style="background:${meta.color}">${meta.label}</div>
    ${properties.warning ? `<p class="warning">${escapeHtml(properties.warning)}</p>` : ''}
    <p class="segment-summary">${escapeHtml(summary)}</p>
    ${facts.length > 0 ? `<ul class="riding-facts">${facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('')}</ul>` : ''}
    <p class="segment-source"><span>出典: ${sourceLink}</span>${retrievedDate ? `<span>データ取得 ${escapeHtml(retrievedDate)}</span>` : ''}</p>
    <p class="data-caveat">OSMの登録内容から判定しています。現地の道路状況と異なる場合があります。</p>`;
}

export function setLoadingFailure(panel: HTMLElement): void {
  panel.innerHTML = '<h2>区間情報</h2><p>データの読み込みに失敗しました。</p>';
}
