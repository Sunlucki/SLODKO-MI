// Consent state: what the visitor allowed in the cookie banner, persisted in localStorage.
// Necessary storage (this very record) needs no consent; analytics and marketing are opt-in.

export interface Consent {
  /** GA4 (Consent Mode: analytics_storage) */
  analytics: boolean
  /** Meta Pixel, TikTok Pixel (Consent Mode: ad_storage, ad_user_data, ad_personalization) */
  marketing: boolean
}

const KEY = 'slodkomi-consent'
/** Bump when the purposes or vendors change materially: everybody is asked again. */
const VERSION = 1
/** Re-ask after 12 months. */
const MAX_AGE = 365 * 24 * 60 * 60 * 1000

/** Window event that reopens the banner (dispatched by ConsentSettingsButton). */
export const CONSENT_OPEN_EVENT = 'slodkomi:consent-settings'

type Listener = (next: Consent, prev: Consent | null) => void

let current: Consent | null | undefined
const listeners = new Set<Listener>()

function read(): Consent | null {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? 'null')
    if (raw?.v !== VERSION || typeof raw.ts !== 'number' || Date.now() - raw.ts > MAX_AGE) return null
    return { analytics: raw.analytics === true, marketing: raw.marketing === true }
  } catch {
    // Storage blocked (private mode, disabled cookies) or corrupted value: ask again
    return null
  }
}

/** The visitor's decision, or null when they have not decided yet (or it expired). Browser only. */
export function getConsent(): Consent | null {
  if (current === undefined) current = read()
  return current
}

export function saveConsent(next: Consent) {
  const prev = getConsent()
  current = { analytics: next.analytics, marketing: next.marketing }
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ v: VERSION, ts: Date.now(), ...current }))
  } catch {
    // Not persisted: the choice still applies until the page is closed
  }
  listeners.forEach((fn) => fn(current!, prev))
}

export function onConsentChange(fn: Listener) {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

export function openConsentSettings() {
  window.dispatchEvent(new CustomEvent(CONSENT_OPEN_EVENT))
}
