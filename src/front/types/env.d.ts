// Environment variables type definitions

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_RAWG_KEY: string;
  readonly VITE_BASENAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Image file type declarations
declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}
