import type { MapDestination } from './types';

type DestinationLanguage = 'en' | 'ja' | 'zh';

interface LocalizedText {
  en: string;
  ja: string;
  zh: string;
}

export interface DestinationTarget {
  context: LocalizedText;
  id: string;
  latitude: number;
  longitude: number;
  name: LocalizedText;
}

export const destinationTargets: readonly DestinationTarget[] = [
  {
    id: 'tokyo-station',
    name: { ja: '東京駅', en: 'Tokyo Station', zh: '东京站' },
    context: { ja: '千代田区・丸の内', en: 'Marunouchi, Chiyoda', zh: '千代田区·丸之内' },
    latitude: 35.68124,
    longitude: 139.76712
  },
  {
    id: 'shinjuku-station',
    name: { ja: '新宿駅', en: 'Shinjuku Station', zh: '新宿站' },
    context: { ja: '新宿区・新宿', en: 'Shinjuku', zh: '新宿区·新宿' },
    latitude: 35.69092,
    longitude: 139.70026
  },
  {
    id: 'shibuya-station',
    name: { ja: '渋谷駅', en: 'Shibuya Station', zh: '涩谷站' },
    context: { ja: '渋谷区・道玄坂', en: 'Dogenzaka, Shibuya', zh: '涩谷区·道玄坂' },
    latitude: 35.65803,
    longitude: 139.70164
  },
  {
    id: 'ikebukuro-station',
    name: { ja: '池袋駅', en: 'Ikebukuro Station', zh: '池袋站' },
    context: { ja: '豊島区・池袋', en: 'Ikebukuro, Toshima', zh: '丰岛区·池袋' },
    latitude: 35.72893,
    longitude: 139.71038
  },
  {
    id: 'ueno-station',
    name: { ja: '上野駅', en: 'Ueno Station', zh: '上野站' },
    context: { ja: '台東区・上野', en: 'Ueno, Taito', zh: '台东区·上野' },
    latitude: 35.71377,
    longitude: 139.77725
  },
  {
    id: 'shinagawa-station',
    name: { ja: '品川駅', en: 'Shinagawa Station', zh: '品川站' },
    context: { ja: '港区・高輪', en: 'Takanawa, Minato', zh: '港区·高轮' },
    latitude: 35.62847,
    longitude: 139.73876
  },
  {
    id: 'akihabara-station',
    name: { ja: '秋葉原駅', en: 'Akihabara Station', zh: '秋叶原站' },
    context: { ja: '千代田区・外神田', en: 'Sotokanda, Chiyoda', zh: '千代田区·外神田' },
    latitude: 35.69868,
    longitude: 139.77422
  },
  {
    id: 'kitasenju-station',
    name: { ja: '北千住駅', en: 'Kita-senju Station', zh: '北千住站' },
    context: { ja: '足立区・千住', en: 'Senju, Adachi', zh: '足立区·千住' },
    latitude: 35.74941,
    longitude: 139.80511
  },
  {
    id: 'nakano-station',
    name: { ja: '中野駅', en: 'Nakano Station', zh: '中野站' },
    context: { ja: '中野区・中野', en: 'Nakano', zh: '中野区·中野' },
    latitude: 35.70577,
    longitude: 139.66584
  },
  {
    id: 'kichijoji-station',
    name: { ja: '吉祥寺駅', en: 'Kichijoji Station', zh: '吉祥寺站' },
    context: { ja: '武蔵野市・吉祥寺', en: 'Kichijoji, Musashino', zh: '武藏野市·吉祥寺' },
    latitude: 35.70308,
    longitude: 139.57973
  },
  {
    id: 'mitaka-station',
    name: { ja: '三鷹駅', en: 'Mitaka Station', zh: '三鹰站' },
    context: { ja: '三鷹市・下連雀', en: 'Shimorenjaku, Mitaka', zh: '三鹰市·下连雀' },
    latitude: 35.70271,
    longitude: 139.56083
  },
  {
    id: 'tachikawa-station',
    name: { ja: '立川駅', en: 'Tachikawa Station', zh: '立川站' },
    context: { ja: '立川市・曙町', en: 'Akebonocho, Tachikawa', zh: '立川市·曙町' },
    latitude: 35.69820,
    longitude: 139.41396
  },
  {
    id: 'machida-station',
    name: { ja: '町田駅', en: 'Machida Station', zh: '町田站' },
    context: { ja: '町田市・原町田', en: 'Haramachida, Machida', zh: '町田市·原町田' },
    latitude: 35.54188,
    longitude: 139.44557
  },
  {
    id: 'hachioji-station',
    name: { ja: '八王子駅', en: 'Hachioji Station', zh: '八王子站' },
    context: { ja: '八王子市・旭町', en: 'Asahicho, Hachioji', zh: '八王子市·旭町' },
    latitude: 35.65563,
    longitude: 139.33895
  }
];

const customDestinationKeys = ['destination', 'destinationContext', 'dlat', 'dlng'] as const;

export function destinationPath(destinationId: string): string {
  return `/parking/${destinationId}/`;
}

export function destinationTargetFromPath(pathname: string): DestinationTarget | undefined {
  const match = pathname.match(/^\/parking\/([a-z0-9-]+)\/?$/);
  if (!match) return undefined;
  return destinationTargets.find((destination) => destination.id === match[1]);
}

export function localizedDestination(
  destination: DestinationTarget,
  language: DestinationLanguage
): MapDestination {
  return {
    context: destination.context[language],
    id: `curated:${destination.id}`,
    latitude: destination.latitude,
    longitude: destination.longitude,
    name: destination.name[language]
  };
}

function validCoordinate(value: string | null, minimum: number, maximum: number): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) && coordinate >= minimum && coordinate <= maximum
    ? coordinate
    : undefined;
}

function cleanUrlText(value: string | null, maximumLength: number): string | undefined {
  const cleaned = value?.trim().replace(/\s+/g, ' ');
  return cleaned && cleaned.length <= maximumLength ? cleaned : undefined;
}

export function destinationFromUrl(
  pathname: string,
  searchParams: URLSearchParams,
  language: DestinationLanguage
): MapDestination | undefined {
  const target = destinationTargetFromPath(pathname);
  if (target) return localizedDestination(target, language);

  const name = cleanUrlText(searchParams.get('destination'), 120);
  const context = cleanUrlText(searchParams.get('destinationContext'), 180) ?? '';
  const latitude = validCoordinate(searchParams.get('dlat'), 24, 36);
  const longitude = validCoordinate(searchParams.get('dlng'), 138.5, 143);
  if (!name || latitude === undefined || longitude === undefined) return undefined;

  return {
    context,
    id: `shared:${latitude.toFixed(5)},${longitude.toFixed(5)}`,
    latitude,
    longitude,
    name
  };
}

export function writeDestinationToUrl(
  params: URLSearchParams,
  destination: MapDestination | undefined,
  pathname: string
): void {
  customDestinationKeys.forEach((key) => params.delete(key));
  if (!destination) return;

  const target = destinationTargetFromPath(pathname);
  if (
    target &&
    Math.abs(target.latitude - destination.latitude) < 0.00001 &&
    Math.abs(target.longitude - destination.longitude) < 0.00001
  ) {
    return;
  }

  params.set('destination', destination.name);
  if (destination.context) params.set('destinationContext', destination.context);
  params.set('dlat', destination.latitude.toFixed(5));
  params.set('dlng', destination.longitude.toFixed(5));
}
