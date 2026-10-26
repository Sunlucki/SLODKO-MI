// Event dispatcher: one TrackEvent fans out to the dataLayer, GA4, Meta Pixel and TikTok Pixel,
// each only when the matching consent is granted. Events without consent are dropped, never queued.
import { getConsent, onConsentChange, saveConsent, type Consent } from './consent'
import { consentDefault, consentUpdate, dataLayerPush } from './dataLayer'
import { ga4Enabled, ga4Event, grantGa4, revokeGa4 } from './ga4'
import { gtmEnabled, loadGtm } from './gtm'
import { grantMeta, metaEnabled, metaEvent, revokeMeta } from './metaPixel'
import { grantTiktok, revokeTiktok, tiktokEnabled, tiktokEvent } from './tiktok'

export type Params = Record<string, unknown>

export interface TrackEvent {
  /** GA4 + dataLayer event name */
  name: string
  params?: Params
  /** Meta Pixel: standard event (fbq track) or custom (fbq trackCustom) */
  meta?: { name: string; custom?: boolean; params?: Params }
  /** TikTok Pixel: standard event, or "page" for ttq.page() */
  tiktok?: { name: string; params?: Params }
}

interface Targets {
  dataLayer: boolean
  analytics: boolean
  marketing: boolean
}

/** At least one destination has an ID: only then is the banner shown unprompted. */
export const trackingConfigured = ga4Enabled || metaEnabled || tiktokEnabled || gtmEnabled

let started = false
let debug = false
let lastPage: { path: string; title: string } | null = null

function log(...args: unknown[]) {
  if (debug) console.info('[analytics]', ...args)
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // Non-secure contexts (plain http) have no randomUUID
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

/** Vendors reject or stringify `undefined`; optional params are simply left out. */
function clean(params: Params = {}): Params {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))
}

function apply(next: Consent, prev: Consent | null, fromUser: boolean) {
  log('consent', next)
  consentUpdate(next)
  if (next.analytics) grantGa4(debug)
  else revokeGa4()
  if (next.marketing) {
    grantMeta()
    grantTiktok()
  } else {
    revokeMeta()
    revokeTiktok()
  }
  if (next.analytics || next.marketing) loadGtm()
  if (!fromUser) return
  // The page_view of the current page was dropped while consent was missing: send it now,
  // but only to destinations that just got enabled (no double counting).
  const was = prev ?? { analytics: false, marketing: false }
  const gained: Targets = {
    dataLayer: (next.analytics || next.marketing) && !(was.analytics || was.marketing),
    analytics: next.analytics && !was.analytics,
    marketing: next.marketing && !was.marketing,
  }
  if (gained.analytics || gained.marketing) send(pageViewEvent(lastPage ?? { path: location.pathname, title: document.title }), gained)
}

/** Idempotent browser-only setup: Consent Mode defaults first, then the stored decision (if any). */
export function initTracking() {
  if (started || typeof window === 'undefined') return
  started = true
  try {
    debug = import.meta.env.DEV || new URLSearchParams(location.search).get('debug_analytics') === '1'
  } catch {
    debug = import.meta.env.DEV
  }
  consentDefault()
  const stored = getConsent()
  if (stored) apply(stored, null, false)
  onConsentChange((next, prev) => apply(next, prev, true))
}

/** Called by the cookie banner. */
export function updateConsent(next: Consent) {
  initTracking()
  saveConsent(next)
}

function send(ev: TrackEvent, targets?: Targets) {
  const c = getConsent()
  const t = targets ?? { dataLayer: Boolean(c?.analytics || c?.marketing), analytics: Boolean(c?.analytics), marketing: Boolean(c?.marketing) }
  if (!t.dataLayer && !t.analytics && !t.marketing) return log(`${ev.name} dropped (no consent)`, ev.params ?? {})

  const eventId = uuid()
  const params = clean(ev.params)
  const sent: string[] = []
  if (t.dataLayer) {
    // Raw params (undefined included) reset stale keys in GTM's data model
    dataLayerPush({ event: ev.name, ...ev.params, event_id: eventId })
    sent.push('dataLayer')
  }
  if (t.analytics && ga4Enabled) {
    ga4Event(ev.name, params)
    sent.push('ga4')
  }
  if (t.marketing && ev.meta && metaEnabled) {
    metaEvent(ev.meta.name, clean(ev.meta.params), Boolean(ev.meta.custom), eventId)
    sent.push(`meta:${ev.meta.name}`)
  }
  if (t.marketing && ev.tiktok && tiktokEnabled) {
    tiktokEvent(ev.tiktok.name, clean(ev.tiktok.params), eventId)
    sent.push(`tiktok:${ev.tiktok.name}`)
  }
  log(ev.name, params, { event_id: eventId, sent })
}

/** Public entry point for every tracked event (browser only, no-op during SSR). */
export function dispatch(ev: TrackEvent) {
  if (typeof window === 'undefined') return
  initTracking()
  send(ev)
}

function pageViewEvent({ path, title }: { path: string; title: string }): TrackEvent {
  return {
    name: 'page_view',
    params: { page_location: location.href, page_path: path, page_title: title },
    meta: { name: 'PageView' },
    tiktok: { name: 'page' },
  }
}

export function dispatchPageView(path: string, title: string) {
  if (typeof window === 'undefined') return
  lastPage = { path, title }
  dispatch(pageViewEvent(lastPage))
}
