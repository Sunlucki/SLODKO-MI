// Shared Google plumbing: window.dataLayer, gtag() and Consent Mode v2 (used by GA4 and GTM).
import type { Consent } from './consent'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function dataLayerPush(data: Record<string, unknown>) {
  ;(window.dataLayer ??= []).push(data)
}

/** The standard gtag() shim. gtag.js only understands the `arguments` object, not an array. */
export function gtag(..._args: unknown[]) {
  ;(window.dataLayer ??= []).push(arguments)
}

/** Consent Mode v2 defaults: must run before any Google tag loads. */
export function consentDefault() {
  window.gtag ??= gtag
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500,
  })
}

/** Consent Mode update + a dataLayer event GTM triggers can listen to. */
export function consentUpdate(c: Consent) {
  const analytics = c.analytics ? 'granted' : 'denied'
  const ads = c.marketing ? 'granted' : 'denied'
  gtag('consent', 'update', { analytics_storage: analytics, ad_storage: ads, ad_user_data: ads, ad_personalization: ads })
  dataLayerPush({ event: 'consent_update', consent_analytics: analytics, consent_marketing: ads })
}
