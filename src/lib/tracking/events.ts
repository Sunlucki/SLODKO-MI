// Event dispatcher: one TrackEvent fans out to the dataLayer, GA4, Meta Pixel and TikTok Pixel,
// each only when the matching consent is granted. Events without consent are dropped, never queued;
// only the current page's page_view and item views are re-sent once the visitor consents on that page.
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
let lastPage: { path: string; title: string; language?: string } | null = null
/** Item views of the current page, re-sent with its page_view to destinations that gain consent on it. */
const PAGE_SCOPED = ['view_item', 'view_item_list']
let pageEvents: { path: string; ev: TrackEvent }[] = []
/**
 * Landing URL campaign parameters, in memory only (no storage before consent). The page_view re-sent after
 * consent carries them, so GA4 keeps the campaign/gclid when the visitor browsed on before deciding.
 */
let campaign: [string, string][] = []

const currentPageEvents = () => pageEvents.filter((e) => e.path === location.pathname)

function withCampaign(href: string): string {
  const url = new URL(href)
  for (const [key, value] of campaign) if (!url.searchParams.has(key)) url.searchParams.set(key, value)
  return url.href
}

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
    grantMeta(campaign.find(([key]) => key === 'fbclid')?.[1])
    grantTiktok()
  } else {
    revokeMeta()
    revokeTiktok()
  }
  if (next.analytics || next.marketing) loadGtm()
  if (!fromUser) return
  // The page_view and item views of the current page were dropped while consent was missing: send them now,
  // but only to destinations that just got enabled (no double counting).
  const was = prev ?? { analytics: false, marketing: false }
  const gained: Targets = {
    dataLayer: (next.analytics || next.marketing) && !(was.analytics || was.marketing),
    analytics: next.analytics && !was.analytics,
    marketing: next.marketing && !was.marketing,
  }
  if (!gained.analytics && !gained.marketing) return
  send(pageViewEvent(lastPage ?? { path: location.pathname, title: document.title }, withCampaign(location.href)), gained)
  currentPageEvents().forEach(({ ev }) => send(ev, gained))
}

/** Idempotent browser-only setup: Consent Mode defaults first, then the stored decision (if any). */
export function initTracking() {
  if (started || typeof window === 'undefined') return
  started = true
  try {
    const query = new URLSearchParams(location.search)
    debug = import.meta.env.DEV || query.get('debug_analytics') === '1'
    campaign = [...query].filter(([key]) => /^(utm_\w+|gclid|fbclid|ttclid)$/.test(key))
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
    const { currency, value, item_list_name, items, ...rest } = ev.params ?? {}
    if (items) {
      // GA4 ecommerce in GTM: items nested under `ecommerce`, cleared first (GTM merges every push into one model)
      dataLayerPush({ ecommerce: null })
      dataLayerPush({ event: ev.name, ...rest, ecommerce: clean({ currency, value, item_list_name, items }), event_id: eventId })
    } else {
      // Raw params (undefined included) reset stale keys in GTM's data model
      dataLayerPush({ event: ev.name, ...ev.params, event_id: eventId })
    }
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
  if (PAGE_SCOPED.includes(ev.name)) pageEvents.push({ path: location.pathname, ev })
  send(ev)
}

// page_language, not "language": gtag treats an event's `language` as the browser-language field (ul) and would overwrite it
function pageViewEvent({ path, title, language }: { path: string; title: string; language?: string }, href = location.href): TrackEvent {
  return {
    name: 'page_view',
    params: { page_location: href, page_path: path, page_title: title, page_language: language },
    meta: { name: 'PageView' },
    tiktok: { name: 'page' },
  }
}

export function dispatchPageView(path: string, title: string, language: string) {
  if (typeof window === 'undefined') return
  lastPage = { path, title, language }
  pageEvents = currentPageEvents()
  dispatch(pageViewEvent(lastPage))
}
