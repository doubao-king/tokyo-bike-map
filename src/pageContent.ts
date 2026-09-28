import { areaLabels, type SiteLanguage } from './areaLabels';
import { destinationTargetFromPath } from './destinations';
import { seoContentData } from './generated/seoContent';
import { areaTargetFromPath } from './seo';

const localeByLanguage: Record<SiteLanguage, string> = {
  ja: 'ja-JP',
  en: 'en',
  zh: 'zh-CN'
};

const copy = {
  ja: {
    areaCaveat: '範囲は行政界ではなく、表示中心からの直線距離を目安に集計しています。工事、閉鎖、移転などが未反映の場合があります。',
    areaIntro: (radius: string) => `表示中心から約${radius}以内にある収録データを集計しています。`,
    areaTitle: (name: string) => `${name}周辺の収録状況`,
    capacity: (value: string) => `収容台数 ${value}台`,
    comfortable: '走りやすい道',
    dataDates: 'データ基準日',
    destinationCaveat: '距離は駅中心点からの直線距離です。営業時間、満空、閉鎖・移転は施設や自治体の最新情報も確認してください。',
    destinationIntro: (count: string) => `駅中心から2 km以内に、公式公開データの駐輪場を${count}件収録しています。`,
    destinationTitle: (name: string) => `${name}周辺の駐輪場データ`,
    lanes: '自転車レーン',
    methodology: 'データと集計方法',
    mixed: '車道混在',
    nearestParking: '中心点から近い駐輪場',
    noParking: '現在の公式公開データでは、集計範囲内の駐輪場を確認できませんでした。',
    parking: '駐輪場',
    pumps: '空気入れ',
    records: '区間',
    reports: '現地情報を報告',
    snapshotIntro: '東京都内の自転車通行環境、駐輪場、空気入れを、公開データと出典付きでひとつの静的地図に整理しています。',
    snapshotTitle: '東京の自転車データ',
    sourceDateText: (roads: string, parking: string, pumps: string) => `道路 ${roads}・駐輪場 ${parking}・空気入れ ${pumps}`,
    totalRoads: '収録区間',
    updates: '更新履歴'
  },
  en: {
    areaCaveat: 'This is a radius around the map centre, not an administrative boundary. Construction, closures and relocations may not yet be reflected.',
    areaIntro: (radius: string) => `A snapshot of mapped data within about ${radius} of the display centre.`,
    areaTitle: (name: string) => `Coverage around ${name}`,
    capacity: (value: string) => `${value} spaces`,
    comfortable: 'Comfortable roads',
    dataDates: 'Data reference dates',
    destinationCaveat: 'Distances are straight-line measurements from the station centre. Check current opening hours, availability, closures and relocations with the facility or municipality.',
    destinationIntro: (count: string) => `${count} bicycle-parking facilities from official public data are recorded within 2 km of the station centre.`,
    destinationTitle: (name: string) => `Bicycle parking around ${name}`,
    lanes: 'Bicycle lanes',
    methodology: 'Data and calculation method',
    mixed: 'Mixed traffic',
    nearestParking: 'Nearest recorded bicycle parking',
    noParking: 'No bicycle-parking facility was found in the current official dataset within this radius.',
    parking: 'Parking facilities',
    pumps: 'Bicycle pumps',
    records: 'segments',
    reports: 'Report local information',
    snapshotIntro: 'A single static map of Tokyo cycling conditions, bicycle parking and pumps, organized from published data with links to its sources.',
    snapshotTitle: 'Tokyo bicycle-data snapshot',
    sourceDateText: (roads: string, parking: string, pumps: string) => `Roads ${roads} · parking ${parking} · pumps ${pumps}`,
    totalRoads: 'Mapped segments',
    updates: 'Update history'
  },
  zh: {
    areaCaveat: '统计范围是以地图中心为圆心的直线距离，并非行政区边界。施工、关闭和迁移等变化可能尚未反映。',
    areaIntro: (radius: string) => `汇总显示中心约${radius}范围内的地图数据。`,
    areaTitle: (name: string) => `${name}周边收录情况`,
    capacity: (value: string) => `可停放 ${value} 辆`,
    comfortable: '舒适道路',
    dataDates: '数据基准日期',
    destinationCaveat: '距离为车站中心点的直线距离。开放时间、空位、关闭和迁移情况请同时确认设施或自治体的最新信息。',
    destinationIntro: (count: string) => `车站中心2公里内收录了${count}处官方公开数据中的自行车停车场。`,
    destinationTitle: (name: string) => `${name}周边自行车停车场数据`,
    lanes: '自行车专用车道',
    methodology: '数据与统计方法',
    mixed: '混合车流',
    nearestParking: '距中心点较近的停车场',
    noParking: '当前官方公开数据中未确认统计范围内的自行车停车场。',
    parking: '自行车停车场',
    pumps: '自行车打气设施',
    records: '路段',
    reports: '报告现场信息',
    snapshotIntro: '把东京都内的自行车通行环境、停车场和打气设施整理成一张附有来源链接的静态地图。',
    snapshotTitle: '东京自行车数据概览',
    sourceDateText: (roads: string, parking: string, pumps: string) => `道路 ${roads}・停车场 ${parking}・打气设施 ${pumps}`,
    totalRoads: '收录路段',
    updates: '更新记录'
  }
} as const;

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]!
  );
}

function formatNumber(value: number, language: SiteLanguage): string {
  return new Intl.NumberFormat(localeByLanguage[language]).format(value);
}

function formatDistance(value: number, language: SiteLanguage): string {
  if (value < 1_000) return `${Math.max(10, Math.round(value / 10) * 10)} m`;
  return `${new Intl.NumberFormat(localeByLanguage[language], { maximumFractionDigits: 1 }).format(value / 1_000)} km`;
}

function metric(label: string, value: string, detail?: string): string {
  return `<div class="context-metric"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</div>`;
}

function contextLinks(language: SiteLanguage): string {
  const text = copy[language];
  return `<nav class="context-links"><a href="/methodology/">${escapeHtml(text.methodology)}</a><a href="/updates/">${escapeHtml(text.updates)}</a><a href="/contact/">${escapeHtml(text.reports)}</a></nav>`;
}

function sourceDates(language: SiteLanguage): string {
  const text = copy[language];
  return `<p class="context-source-date"><strong>${escapeHtml(text.dataDates)}</strong><br>${escapeHtml(text.sourceDateText(seoContentData.sourceDates.roads, seoContentData.sourceDates.parking, seoContentData.sourceDates.pumps))}</p>`;
}

function renderParkingList(
  entries: readonly {
    capacity?: number;
    distanceMeters: number;
    municipality: string;
    name: string;
  }[],
  language: SiteLanguage
): string {
  const text = copy[language];
  if (entries.length === 0) return `<p class="context-empty">${escapeHtml(text.noParking)}</p>`;
  return `<ul class="context-nearby-list">${entries
    .map((entry) => {
      const capacity = entry.capacity
        ? `<small>${escapeHtml(text.capacity(formatNumber(entry.capacity, language)))}</small>`
        : '';
      return `<li><span><strong>${escapeHtml(entry.name)}</strong><small>${escapeHtml(entry.municipality)}</small>${capacity}</span><b>${escapeHtml(formatDistance(entry.distanceMeters, language))}</b></li>`;
    })
    .join('')}</ul>`;
}

function renderHome(language: SiteLanguage): string {
  const text = copy[language];
  const summary = seoContentData.summary;
  return `<h2>${escapeHtml(text.snapshotTitle)}</h2>
    <p>${escapeHtml(text.snapshotIntro)}</p>
    <dl class="context-metrics">
      ${metric(text.totalRoads, formatNumber(summary.segmentCount, language), `${formatNumber(summary.segmentCounts.A + summary.segmentCounts.B, language)} ${text.comfortable.toLowerCase()}`)}
      ${metric(text.parking, formatNumber(summary.parkingCount, language))}
      ${metric(text.pumps, formatNumber(summary.pumpCount, language))}
    </dl>
    <p class="context-breakdown">${escapeHtml(`${text.comfortable}: ${formatNumber(summary.segmentCounts.A + summary.segmentCounts.B, language)} ${text.records} · ${text.lanes}: ${formatNumber(summary.segmentCounts.C, language)} ${text.records} · ${text.mixed}: ${formatNumber(summary.segmentCounts.D, language)} ${text.records}`)}</p>
    ${sourceDates(language)}${contextLinks(language)}`;
}

function renderArea(pathname: string, language: SiteLanguage): string | undefined {
  const area = areaTargetFromPath(pathname);
  if (!area) return undefined;
  const stats = seoContentData.areas.find((entry) => entry.id === area.id);
  if (!stats) return undefined;
  const text = copy[language];
  const name = areaLabels[language][area.id] ?? area.label;
  const comfortableCount = stats.segmentCounts.A + stats.segmentCounts.B;
  return `<h2>${escapeHtml(text.areaTitle(name))}</h2>
    <p>${escapeHtml(text.areaIntro(formatDistance(stats.radiusMeters, language)))}</p>
    <dl class="context-metrics">
      ${metric(text.comfortable, formatNumber(comfortableCount, language), `${text.records} A+B`)}
      ${metric(text.lanes, formatNumber(stats.segmentCounts.C, language), text.records)}
      ${metric(text.parking, formatNumber(stats.parkingCount, language), stats.parkingCapacity ? text.capacity(formatNumber(stats.parkingCapacity, language)) : undefined)}
      ${metric(text.pumps, formatNumber(stats.pumpCount, language))}
    </dl>
    <h3>${escapeHtml(text.nearestParking)}</h3>
    ${renderParkingList(stats.nearestParking, language)}
    <p class="context-caveat">${escapeHtml(text.areaCaveat)}</p>
    ${sourceDates(language)}${contextLinks(language)}`;
}

function renderDestination(pathname: string, language: SiteLanguage): string | undefined {
  const destination = destinationTargetFromPath(pathname);
  if (!destination) return undefined;
  const stats = seoContentData.destinations.find((entry) => entry.id === destination.id);
  if (!stats) return undefined;
  const text = copy[language];
  const name = destination.name[language];
  return `<h2>${escapeHtml(text.destinationTitle(name))}</h2>
    <p>${escapeHtml(text.destinationIntro(formatNumber(stats.parkingCount, language)))}</p>
    <dl class="context-metrics">
      ${metric(text.parking, formatNumber(stats.parkingCount, language), stats.parkingCapacity ? text.capacity(formatNumber(stats.parkingCapacity, language)) : undefined)}
    </dl>
    <p class="context-caveat">${escapeHtml(text.destinationCaveat)}</p>
    ${sourceDates(language)}${contextLinks(language)}`;
}

export function renderPageContext(
  pathname: string,
  language: SiteLanguage = 'ja'
): string | undefined {
  const normalizedPath = pathname === '/index.html' ? '/' : pathname;
  if (normalizedPath === '/') return renderHome(language);
  return renderArea(normalizedPath, language) ?? renderDestination(normalizedPath, language);
}
