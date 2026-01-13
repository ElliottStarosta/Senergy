/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_PLACES_API_KEY?: string
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly VITE_GOOGLE_PLACES_API_KEY?: string
  }
}

