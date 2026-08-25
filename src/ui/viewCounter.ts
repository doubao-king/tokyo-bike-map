const sessionKey = 'tokyo-bike-map-view-counted';

interface ViewCountResponse {
  count?: unknown;
}

export function formatViewCount(count: number): string {
  return new Intl.NumberFormat('ja-JP').format(count);
}

export function parseViewCount(payload: ViewCountResponse): number | null {
  return typeof payload.count === 'number' && Number.isSafeInteger(payload.count) && payload.count >= 0
    ? payload.count
    : null;
}

function wasCountedInThisTab(): boolean {
  try {
    return window.sessionStorage.getItem(sessionKey) === '1';
  } catch {
    return false;
  }
}

function rememberThisTab(): void {
  try {
    window.sessionStorage.setItem(sessionKey, '1');
  } catch {
    // The aggregate counter still works when session storage is unavailable.
  }
}

export async function initializeViewCounter(element: HTMLElement): Promise<void> {
  const alreadyCounted = wasCountedInThisTab();

  try {
    const response = await fetch('/api/views', {
      method: alreadyCounted ? 'GET' : 'POST',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin'
    });

    if (!response.ok) return;

    const count = parseViewCount((await response.json()) as ViewCountResponse);
    if (count === null) return;

    const output = element.querySelector<HTMLElement>('#viewCount');
    if (!output) return;

    output.textContent = formatViewCount(count);
    element.hidden = false;
    if (!alreadyCounted) rememberThisTab();
  } catch {
    // The map remains fully usable if the optional counter is unavailable.
  }
}
