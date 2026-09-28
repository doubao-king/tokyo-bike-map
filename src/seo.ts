import { areaTargets } from './config';
import { seoContentData } from './generated/seoContent';
import {
  destinationPath,
  destinationTargetFromPath,
  type DestinationTarget
} from './destinations';

export const canonicalOrigin = 'https://tokyo-bike-map.manymao.com';

export const homeSeo = {
  canonicalUrl: `${canonicalOrigin}/`,
  description:
    '東京都内の走りやすい道、自転車レーン、緑道、河川敷、駐輪場、無料の空気入れを地図で確認できる東京自転車マップです。',
  title: '東京の自転車マップ | 走りやすい道・駐輪場・空気入れ'
};

export type AreaTarget = (typeof areaTargets)[number];

export function areaPath(areaId: string): string {
  return `/area/${areaId}/`;
}

export function areaTargetFromPath(pathname: string): AreaTarget | undefined {
  const match = pathname.match(/^\/area\/([a-z0-9-]+)\/?$/);
  if (!match) return undefined;
  return areaTargets.find((area) => area.id === match[1]);
}

export function areaSeo(area: AreaTarget): {
  canonicalUrl: string;
  description: string;
  heading: string;
  tagline: string;
  title: string;
} {
  const stats = seoContentData.areas.find((entry) => entry.id === area.id);
  const comfortableCount = stats ? stats.segmentCounts.A + stats.segmentCounts.B : 0;
  const description = stats
    ? `${area.label}周辺で、走りやすい道${comfortableCount}区間、自転車レーン${stats.segmentCounts.C}区間、公式公開データの駐輪場${stats.parkingCount}件を収録した自転車マップです。`
    : `東京都の${area.label}周辺で、走りやすい道、自転車レーン、駐輪場を確認できる自転車マップです。`;
  return {
    canonicalUrl: `${canonicalOrigin}${areaPath(area.id)}`,
    description,
    heading: `${area.label}周辺の自転車マップ`,
    tagline: stats
      ? `走りやすい道${comfortableCount}区間と、公式公開データの駐輪場${stats.parkingCount}件を周辺地図で確認できます。`
      : '走りやすい道と駐輪場を周辺地図で確認できます。',
    title: `東京・${area.label}の自転車マップ | 走りやすい道・駐輪場`
  };
}

export { destinationPath, destinationTargetFromPath };

export function destinationSeo(destination: DestinationTarget): {
  canonicalUrl: string;
  description: string;
  heading: string;
  tagline: string;
  title: string;
} {
  const name = destination.name.ja;
  const stats = seoContentData.destinations.find((entry) => entry.id === destination.id);
  return {
    canonicalUrl: `${canonicalOrigin}${destinationPath(destination.id)}`,
    description: stats
      ? `${name}から2 km以内の駐輪場${stats.parkingCount}件を公式公開データから収録。近い順の所在地、駐輪台数、周辺の走りやすい道を地図で確認できます。`
      : `${name}周辺の駐輪場を近い順に確認。所在地、駐輪台数、公式データへのリンクと、周辺の走りやすい道を地図で見られます。`,
    heading: `${name}周辺の駐輪場`,
    tagline: stats
      ? `駅から2 km以内の駐輪場${stats.parkingCount}件と、周辺の自転車通行環境を確認できます。`
      : '駅から近い駐輪場と、周辺の自転車通行環境を確認できます。',
    title: `${name}周辺の駐輪場 | 東京じてんしゃマップ`
  };
}
