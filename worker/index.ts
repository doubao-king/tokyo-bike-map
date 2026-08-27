/// <reference types="@cloudflare/workers-types" />

import { areaSeo, areaTargetFromPath, canonicalOrigin, homeSeo } from '../src/seo';
import {
  isFeedbackHoneypotFilled,
  validateFeedbackSubmission,
  type ValidatedFeedback
} from '../src/feedback';

interface Env {
  ASSETS: Fetcher;
  FEEDBACK_RATE_LIMITER: RateLimit;
  STATS_DB: D1Database;
}

interface ViewCountRow {
  view_count: number;
}

const counterKey = 'map';
const maximumFeedbackBodyBytes = 8_192;

function json(count: number, status = 200): Response {
  return Response.json(
    { count },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      }
    }
  );
}

function jsonResponse(body: object, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function isSameOriginPost(request: Request): boolean {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('Origin');
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  return origin === requestUrl.origin && (fetchSite === null || fetchSite === 'same-origin');
}

async function readViewCount(database: D1Database): Promise<number> {
  const row = await database
    .prepare('SELECT view_count FROM page_views WHERE counter_key = ?')
    .bind(counterKey)
    .first<ViewCountRow>();
  return row?.view_count ?? 0;
}

async function incrementViewCount(database: D1Database): Promise<number> {
  const row = await database
    .prepare(
      `INSERT INTO page_views (counter_key, view_count)
       VALUES (?, 1)
       ON CONFLICT(counter_key) DO UPDATE SET
         view_count = view_count + 1,
         updated_at = CURRENT_TIMESTAMP
       RETURNING view_count`
    )
    .bind(counterKey)
    .first<ViewCountRow>();

  if (!row) throw new Error('View counter update returned no result.');
  return row.view_count;
}

async function storeFeedback(database: D1Database, feedback: ValidatedFeedback): Promise<string> {
  const id = crypto.randomUUID();
  await database
    .prepare(
      `INSERT INTO feedback_reports (
        id, category, details, observed_on, map_url, latitude, longitude, zoom, language
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      feedback.category,
      feedback.details,
      feedback.observedOn,
      feedback.mapUrl,
      feedback.latitude,
      feedback.longitude,
      feedback.zoom,
      feedback.language
    )
    .run();
  return id;
}

async function handleFeedback(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST', 'Cache-Control': 'no-store' }
    });
  }
  if (!isSameOriginPost(request)) return jsonResponse({ error: 'forbidden' }, 403);
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    return jsonResponse({ error: 'invalid_content_type' }, 415);
  }

  const declaredLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declaredLength) && declaredLength > maximumFeedbackBodyBytes) {
    return jsonResponse({ error: 'body_too_large' }, 413);
  }

  const bodyText = await request.text();
  if (new TextEncoder().encode(bodyText).byteLength > maximumFeedbackBodyBytes) {
    return jsonResponse({ error: 'body_too_large' }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  const rateLimitKey = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const rateLimit = await env.FEEDBACK_RATE_LIMITER.limit({ key: rateLimitKey });
  if (!rateLimit.success) return jsonResponse({ error: 'rate_limited' }, 429);

  // Filled only by automated form scanners. Return an ordinary success without storing it.
  if (isFeedbackHoneypotFilled(body)) return jsonResponse({ ok: true });

  const requestOrigin = new URL(request.url).origin;
  const validation = validateFeedbackSubmission(body, requestOrigin);
  if (!validation.ok) {
    console.warn('Feedback validation rejected', validation.error);
    return jsonResponse({ error: 'invalid_feedback' }, 400);
  }

  const id = await storeFeedback(env.STATS_DB, validation.value);
  return jsonResponse({ id, ok: true }, 201);
}

function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes));
}

interface MapSeo {
  canonicalUrl: string;
  description: string;
  title: string;
}

function prepareMapHtml(response: Response, seo: MapSeo): Response {
  const nonce = createNonce();
  const headers = new Headers(response.headers);
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'none'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      `script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:`,
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https:",
      "font-src 'self' data: https:",
      'frame-src https:',
      "form-action 'self'",
      'upgrade-insecure-requests'
    ].join('; ')
  );

  const securedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });

  return new HTMLRewriter()
    .on('title', {
      element(element) {
        element.setInnerContent(seo.title);
      }
    })
    .on('meta[name="description"]', {
      element(element) {
        element.setAttribute('content', seo.description);
      }
    })
    .on('meta[property="og:title"]', {
      element(element) {
        element.setAttribute('content', seo.title);
      }
    })
    .on('meta[property="og:description"]', {
      element(element) {
        element.setAttribute('content', seo.description);
      }
    })
    .on('meta[property="og:url"]', {
      element(element) {
        element.setAttribute('content', seo.canonicalUrl);
      }
    })
    .on('link[rel="canonical"]', {
      element(element) {
        element.setAttribute('href', seo.canonicalUrl);
      }
    })
    .on('script', {
      element(element) {
        element.setAttribute('nonce', nonce);
      }
    })
    .transform(securedResponse);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.protocol === 'https:' && url.hostname === 'manymao.com') {
      const destination = new URL(`${url.pathname}${url.search}`, canonicalOrigin);
      return Response.redirect(destination.href, 301);
    }

    if (url.pathname === '/api/views') {
      try {
        if (request.method === 'GET') return json(await readViewCount(env.STATS_DB));
        if (request.method === 'POST') {
          if (!isSameOriginPost(request)) return json(await readViewCount(env.STATS_DB), 403);
          return json(await incrementViewCount(env.STATS_DB));
        }
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'GET, POST', 'Cache-Control': 'no-store' }
        });
      } catch (error) {
        console.error('View counter failed', error);
        return new Response(JSON.stringify({ error: 'counter_unavailable' }), {
          status: 503,
          headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    }

    if (url.pathname === '/api/feedback') {
      try {
        return await handleFeedback(request, env);
      } catch (error) {
        console.error('Feedback submission failed', error);
        return jsonResponse({ error: 'feedback_unavailable' }, 503);
      }
    }

    const area = areaTargetFromPath(url.pathname);
    const assetRequest = area
      ? new Request(new URL('/', request.url), request)
      : request;
    const assetResponse = await env.ASSETS.fetch(assetRequest);
    if (
      request.method === 'GET' &&
      (url.pathname === '/' || url.pathname === '/index.html' || area) &&
      assetResponse.headers.get('Content-Type')?.includes('text/html')
    ) {
      return prepareMapHtml(assetResponse, area ? areaSeo(area) : homeSeo);
    }
    return assetResponse;
  }
} satisfies ExportedHandler<Env>;
