import { areaTargets } from './config';
import {
  destinationPath,
  destinationTargetFromPath,
  type DestinationTarget
} from './destinations';

export const canonicalOrigin = 'https://tokyo-bike-map.manymao.com';

export const homeSeo = {
  canonicalUrl: `${canonicalOrigin}/`,
  description:
    '東京都内の走りやすい道、自転車レーン、緑道、河川敷、駐輪場を地図で確認。車との分離や通行環境を色分けした無料の東京自転車マップです。',
  title: '東京の自転車マップ | 走りやすい道・自転車レーン・駐輪場'
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
  title: string;
} {
  return {
    canonicalUrl: `${canonicalOrigin}${areaPath(area.id)}`,
    description: `東京都の${area.label}周辺で、車と分離された道、緑道・河川敷、自転車レーン、駐輪場を確認できる自転車マップです。`,
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
  return {
    canonicalUrl: `${canonicalOrigin}${destinationPath(destination.id)}`,
    description: `${name}周辺の駐輪場を近い順に確認。所在地、駐輪台数、公式データへのリンクと、周辺の走りやすい道・自転車レーンを地図で見られます。`,
    heading: `${name}周辺の駐輪場`,
    tagline: '駅から近い駐輪場と、周辺の自転車通行環境を確認できます。',
    title: `${name}周辺の駐輪場 | 東京じてんしゃマップ`
  };
}
