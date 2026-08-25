/// <reference types="@cloudflare/workers-types" />

interface Env {
  ASSETS: Fetcher;
  STATS_DB: D1Database;
}

interface ViewCountRow {
  view_count: number;
}

const counterKey = 'map';

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

function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes));
}

function prepareMapHtml(response: Response): Response {
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

    const assetResponse = await env.ASSETS.fetch(request);
    if (
      request.method === 'GET' &&
      (url.pathname === '/' || url.pathname === '/index.html') &&
      assetResponse.headers.get('Content-Type')?.includes('text/html')
    ) {
      return prepareMapHtml(assetResponse);
    }
    return assetResponse;
  }
} satisfies ExportedHandler<Env>;
