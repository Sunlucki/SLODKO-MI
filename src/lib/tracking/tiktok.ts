// TikTok Pixel (ttq) — loads only after marketing consent; revocation uses ttq.revokeConsent().
import { loadScript, whenIdle } from './loader'

type Queue = unknown[] & Record<string, unknown>
type Ttq = Queue & {
  methods: string[]
  setAndDefer: (target: Queue, method: string) => void
  instance: (id: string) => Queue
  load: (id: string) => void
  page: () => void
  track: (event: string, params?: Record<string, unknown>, options?: Record<string, unknown>) => void
  grantConsent: () => void
  revokeConsent: () => void
  _i: Record<string, Queue>
  _t: Record<string, number>
  _o: Record<string, Record<string, unknown>>
}

declare global {
  interface Window {
    ttq?: Ttq
    TiktokAnalyticsObject?: string
  }
}

const ID = import.meta.env.VITE_TIKTOK_PIXEL_ID
const SDK = 'https://analytics.tiktok.com/i18n/pixel/events.js'
const METHODS = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent']

export const tiktokEnabled = Boolean(ID)

let state: 'off' | 'granted' | 'revoked' = 'off'

/** The official base code as typed TS; `load` defers the script injection until the page is idle. */
function installStub(): Ttq {
  window.TiktokAnalyticsObject = 'ttq'
  const ttq = (window.ttq ??= [] as unknown as Ttq)
  ttq.methods = METHODS
  ttq.setAndDefer = (target, method) => {
    target[method] = (...args: unknown[]) => target.push([method, ...args])
  }
  METHODS.forEach((m) => ttq.setAndDefer(ttq, m))
  ttq.instance = (id) => {
    const inst = ttq._i[id] ?? ([] as unknown as Queue)
    METHODS.forEach((m) => ttq.setAndDefer(inst, m))
    return inst
  }
  ttq.load = (id) => {
    ttq._i ??= {}
    ttq._i[id] = [] as unknown as Queue
    ttq._i[id]._u = SDK
    ttq._t ??= {}
    ttq._t[id] = Date.now()
    ttq._o ??= {}
    ttq._o[id] = {}
    whenIdle(() => loadScript(`${SDK}?sdkid=${encodeURIComponent(id)}&lib=ttq`))
  }
  return ttq
}

export function grantTiktok() {
  if (!ID || state === 'granted') return
  if (state === 'off') {
    const ttq = installStub()
    ttq.load(ID)
  }
  window.ttq?.grantConsent()
  state = 'granted'
}

export function revokeTiktok() {
  if (state !== 'granted') return
  window.ttq?.revokeConsent()
  state = 'revoked'
}

/** `name === 'page'` sends ttq.page(); everything else is a standard event with a dedup event_id. */
export function tiktokEvent(name: string, params: Record<string, unknown>, eventId: string) {
  if (name === 'page') window.ttq?.page()
  else window.ttq?.track(name, params, { event_id: eventId })
}
