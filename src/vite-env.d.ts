/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UTAH_DISCOVER_KEY?: string;
  readonly VITE_STADIA_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
