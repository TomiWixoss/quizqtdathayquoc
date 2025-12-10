/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MONGODB_DATA_API_URL: string;
  readonly VITE_MONGODB_API_KEY: string;
  readonly VITE_MONGODB_DATA_SOURCE: string;
  readonly VITE_MONGODB_DATABASE: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
