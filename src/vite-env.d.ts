/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_ADSENSE_SLOT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_TILE_ATTRIBUTION?: string;
  readonly VITE_TILE_MAX_ZOOM?: string;
  readonly VITE_TILE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
