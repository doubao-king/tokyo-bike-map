import type { Language } from '../i18n';
import type { DestinationSuggestion, MapDestination } from '../types';

const geocodingBaseUrl =
  import.meta.env?.VITE_GEOCODING_BASE_URL?.trim() ||
  'https://api.stadiamaps.com/geocoding/v2';
const tokyoNamePattern = /東京|Tokyo|东京/iu;
const parkingNamePattern = /駐車場|駐輪|パーキング|\b(?:bike|bicycle|car)\s*parking\b|停车场|停車場/iu;
const languageTags: Record<Language, string> = { en: 'en', ja: 'ja', zh: 'zh-CN' };
const searchRegion: Record<Language, string> = { en: 'Tokyo', ja: '東京', zh: '东京' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function featuresFrom(value: unknown): unknown[] {
  if (!isRecord(value) || !Array.isArray(value.features)) return [];
  return value.features;
}

function stringProperty(value: unknown, property: string): string | undefined {
  return isRecord(value) && typeof value[property] === 'string'
    ? value[property]
    : undefined;
}

function tokyoContext(properties: Record<string, unknown>): string {
  const coarseLocation = stringProperty(properties, 'coarse_location') ?? '';
  const context = isRecord(properties.context) ? properties.context : undefined;
  const whosonfirst = context && isRecord(context.whosonfirst) ? context.whosonfirst : undefined;
  if (!whosonfirst) return coarseLocation;

  const contextNames = ['borough', 'locality', 'region', 'country']
    .map((level) => isRecord(whosonfirst[level])
      ? stringProperty(whosonfirst[level], 'name')
      : undefined)
    .filter((name): name is string => Boolean(name));
  return [...new Set(contextNames)].join(' · ') || coarseLocation;
}

export function parseDestinationSuggestions(value: unknown): DestinationSuggestion[] {
  const seen = new Set<string>();
  const suggestions: DestinationSuggestion[] = [];

  featuresFrom(value).forEach((feature) => {
    if (!isRecord(feature) || !isRecord(feature.properties)) return;
    const id = stringProperty(feature.properties, 'gid');
    const name = stringProperty(feature.properties, 'name');
    const context = tokyoContext(feature.properties);
    if (
      !id ||
      !name ||
      parkingNamePattern.test(name) ||
      !tokyoNamePattern.test(context) ||
      seen.has(id)
    ) return;

    seen.add(id);
    suggestions.push({ context, id, name });
  });

  return suggestions.slice(0, 5);
}

export function parseDestinationDetails(
  value: unknown,
  suggestion: DestinationSuggestion
): MapDestination | undefined {
  const feature = featuresFrom(value)[0];
  if (!isRecord(feature) || !isRecord(feature.geometry)) return undefined;
  if (feature.geometry.type !== 'Point' || !Array.isArray(feature.geometry.coordinates)) {
    return undefined;
  }

  const longitude = Number(feature.geometry.coordinates[0]);
  const latitude = Number(feature.geometry.coordinates[1]);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < 24 ||
    latitude > 36 ||
    longitude < 138.5 ||
    longitude > 143
  ) {
    return undefined;
  }

  const properties = isRecord(feature.properties) ? feature.properties : undefined;
  const context = properties ? tokyoContext(properties) : suggestion.context;
  if (!tokyoNamePattern.test(context || suggestion.context)) return undefined;

  return {
    ...suggestion,
    context: context || suggestion.context,
    latitude,
    longitude,
    name: (properties && stringProperty(properties, 'name')) || suggestion.name
  };
}

function endpoint(path: string): URL {
  return new URL(`${geocodingBaseUrl.replace(/\/$/, '')}/${path}`);
}

export async function searchDestinations(
  query: string,
  language: Language,
  signal: AbortSignal
): Promise<DestinationSuggestion[]> {
  const url = endpoint('autocomplete');
  url.searchParams.set('text', `${query.trim()} ${searchRegion[language]}`);
  url.searchParams.set('boundary.country', 'JPN');
  url.searchParams.set('boundary.rect.min_lon', '138.5');
  url.searchParams.set('boundary.rect.max_lon', '143');
  url.searchParams.set('boundary.rect.min_lat', '24');
  url.searchParams.set('boundary.rect.max_lat', '36');
  url.searchParams.set('focus.point.lat', '35.6812');
  url.searchParams.set('focus.point.lon', '139.7671');
  url.searchParams.set('lang', languageTags[language]);
  url.searchParams.set('size', '10');

  const response = await fetch(url, { credentials: 'omit', referrerPolicy: 'strict-origin-when-cross-origin', signal });
  if (!response.ok) throw new Error(`Destination search failed with ${response.status}`);
  return parseDestinationSuggestions(await response.json());
}

export async function loadDestination(
  suggestion: DestinationSuggestion,
  language: Language,
  signal: AbortSignal
): Promise<MapDestination> {
  const url = endpoint('place_details');
  url.searchParams.set('ids', suggestion.id);
  url.searchParams.set('lang', languageTags[language]);

  const response = await fetch(url, { credentials: 'omit', referrerPolicy: 'strict-origin-when-cross-origin', signal });
  if (!response.ok) throw new Error(`Destination lookup failed with ${response.status}`);
  const destination = parseDestinationDetails(await response.json(), suggestion);
  if (!destination) throw new Error('Destination lookup returned an invalid Tokyo location');
  return destination;
}
