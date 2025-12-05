// Environment variables type definitions

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_RAWG_KEY: string;
  readonly VITE_BASENAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


