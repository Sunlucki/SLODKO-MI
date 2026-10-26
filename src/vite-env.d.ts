/// <reference types="vite/client" />

// Build-time environment (see .env.example). Every pixel ID is optional: empty or unset = destination disabled.
interface ImportMetaEnv {
  /** Google Analytics 4 Measurement ID, e.g. "G-XXXXXXXXXX" */
  readonly VITE_GA_ID?: string
  /** Meta (Facebook/Instagram) Pixel ID, digits only */
  readonly VITE_META_PIXEL_ID?: string
  /** Google Tag Manager container ID, e.g. "GTM-XXXXXXX" */
  readonly VITE_GTM_ID?: string
  /** TikTok Pixel ID */
  readonly VITE_TIKTOK_PIXEL_ID?: string
  /** Canonical production URL, injected by vite.config.ts `define` ("" when unset) */
  readonly SITE_URL: string
}
