export interface AdsenseConfig {
  client: string;
  slot: string;
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, never>>;
  }
}

export function parseAdsenseConfig(clientValue?: string, slotValue?: string): AdsenseConfig | null {
  const client = clientValue?.trim() ?? '';
  const slot = slotValue?.trim() ?? '';

  if (!/^ca-pub-\d{16}$/.test(client) || !/^\d+$/.test(slot)) return null;
  return { client, slot };
}

export function initializeAds(panel: HTMLElement): void {
  const config = parseAdsenseConfig(
    import.meta.env.VITE_ADSENSE_CLIENT,
    import.meta.env.VITE_ADSENSE_SLOT
  );
  if (!config) return;

  const slot = panel.querySelector<HTMLElement>('#adsenseSlot');
  if (!slot) return;

  slot.dataset.adClient = config.client;
  slot.dataset.adSlot = config.slot;

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.client)}`;

  const trustedScript = document.querySelector<HTMLScriptElement>('script[type="module"][nonce]');
  if (trustedScript?.nonce) script.nonce = trustedScript.nonce;

  script.addEventListener('load', () => {
    panel.hidden = false;
    window.adsbygoogle = window.adsbygoogle ?? [];
    window.adsbygoogle.push({});
  });
  document.head.append(script);
}
