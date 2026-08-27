export const feedbackCategories = [
  'road_change',
  'parking_change',
  'missing_information',
  'difficult_location',
  'other'
] as const;

export type FeedbackCategory = (typeof feedbackCategories)[number];
export type FeedbackLanguage = 'ja' | 'en' | 'zh';
export type FeedbackSubjectType = 'map_location' | 'parking' | 'segment';

export const feedbackOpenEvent = 'tokyo-bike-map:open-feedback';

export interface FeedbackOpenRequest {
  mapUrl: string;
  subjectId?: string;
  subjectName?: string;
  subjectType: FeedbackSubjectType;
  suggestedCategory?: FeedbackCategory;
}

export interface FeedbackSubmission {
  category: FeedbackCategory;
  details: string;
  language: FeedbackLanguage;
  mapUrl: string;
  observedOn?: string;
  personalInfoConfirmed: boolean;
  subjectId?: string;
  subjectName?: string;
  subjectType: FeedbackSubjectType;
  website?: string;
}

export interface ValidatedFeedback {
  category: FeedbackCategory;
  details: string;
  language: FeedbackLanguage;
  latitude: number;
  longitude: number;
  mapUrl: string;
  observedOn: string | null;
  subjectId: string | null;
  subjectName: string | null;
  subjectType: FeedbackSubjectType;
  zoom: number;
}

export type FeedbackValidationResult =
  | { ok: true; value: ValidatedFeedback }
  | { error: string; ok: false };

const supportedLanguages = new Set<FeedbackLanguage>(['ja', 'en', 'zh']);
const supportedCategories = new Set<string>(feedbackCategories);
const supportedSubjectTypes = new Set<FeedbackSubjectType>([
  'map_location',
  'parking',
  'segment'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function tokyoDate(now: Date): string {
  const parts = new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Tokyo',
    year: 'numeric'
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((entry) => entry.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function isValidObservedDate(value: string, now: Date): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return isRealDate && value <= tokyoDate(now);
}

function parseMapUrl(value: string, requestOrigin: string): Omit<
  ValidatedFeedback,
  'category' | 'details' | 'language' | 'observedOn' | 'subjectId' | 'subjectName' | 'subjectType'
> | null {
  if (value.length > 2_048) return null;

  try {
    const mapUrl = new URL(value);
    const validPath =
      mapUrl.pathname === '/' ||
      mapUrl.pathname === '/index.html' ||
      /^\/area\/[a-z0-9-]+\/?$/.test(mapUrl.pathname);
    if (mapUrl.origin !== requestOrigin || !validPath || mapUrl.hash) return null;

    const latitude = Number(mapUrl.searchParams.get('lat'));
    const longitude = Number(mapUrl.searchParams.get('lng'));
    const zoom = Number(mapUrl.searchParams.get('z'));
    if (
      !Number.isFinite(latitude) ||
      latitude < 24 ||
      latitude > 36 ||
      !Number.isFinite(longitude) ||
      longitude < 138.5 ||
      longitude > 143 ||
      !Number.isInteger(zoom) ||
      zoom < 10 ||
      zoom > 19
    ) {
      return null;
    }

    return { latitude, longitude, mapUrl: mapUrl.href, zoom };
  } catch {
    return null;
  }
}

export function isFeedbackHoneypotFilled(value: unknown): boolean {
  return isRecord(value) && typeof value.website === 'string' && value.website.trim().length > 0;
}

export function validateFeedbackSubmission(
  input: unknown,
  requestOrigin: string,
  now = new Date()
): FeedbackValidationResult {
  if (!isRecord(input)) return { error: 'invalid_body', ok: false };

  const category = input.category;
  const details = typeof input.details === 'string' ? input.details.trim() : '';
  const language = input.language;
  const mapUrl = typeof input.mapUrl === 'string' ? input.mapUrl : '';
  const observedOn = input.observedOn;
  // Accept reports from the short-lived pre-targeting form as map-location reports.
  const subjectType = input.subjectType ?? 'map_location';

  if (typeof category !== 'string' || !supportedCategories.has(category)) {
    return { error: 'invalid_category', ok: false };
  }
  if (details.length < 10 || details.length > 1_500) {
    return { error: 'invalid_details', ok: false };
  }
  if (typeof language !== 'string' || !supportedLanguages.has(language as FeedbackLanguage)) {
    return { error: 'invalid_language', ok: false };
  }
  if (input.personalInfoConfirmed !== true) {
    return { error: 'confirmation_required', ok: false };
  }
  if (
    typeof subjectType !== 'string' ||
    !supportedSubjectTypes.has(subjectType as FeedbackSubjectType)
  ) {
    return { error: 'invalid_subject_type', ok: false };
  }

  const subjectId = typeof input.subjectId === 'string' ? input.subjectId.trim() : '';
  const subjectName = typeof input.subjectName === 'string' ? input.subjectName.trim() : '';
  if (subjectType === 'map_location') {
    if (subjectId || subjectName) return { error: 'invalid_location_subject', ok: false };
  } else if (
    !/^[A-Za-z0-9:_-]{1,256}$/.test(subjectId) ||
    subjectName.length < 1 ||
    subjectName.length > 300
  ) {
    return { error: 'invalid_data_subject', ok: false };
  }
  if (
    observedOn !== undefined &&
    observedOn !== '' &&
    (typeof observedOn !== 'string' || !isValidObservedDate(observedOn, now))
  ) {
    return { error: 'invalid_date', ok: false };
  }

  const location = parseMapUrl(mapUrl, requestOrigin);
  if (!location) return { error: 'invalid_map_url', ok: false };

  return {
    ok: true,
    value: {
      category: category as FeedbackCategory,
      details,
      language: language as FeedbackLanguage,
      observedOn: typeof observedOn === 'string' && observedOn ? observedOn : null,
      subjectId: subjectId || null,
      subjectName: subjectName || null,
      subjectType: subjectType as FeedbackSubjectType,
      ...location
    }
  };
}
