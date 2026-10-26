// Meta Pixel (fbq) — loads only after marketing consent; revocation uses fbq('consent', 'revoke').
import { loadScript, whenIdle } from './loader'

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  push: Fbq
  loaded: boolean
  version: string
  /** true = the pixel does not fire its own PageView on history changes (we send them per route) */
  disablePushState?: boolean
}

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

const ID = import.meta.env.VITE_META_PIXEL_ID

export const metaEnabled = Boolean(ID)

let state: 'off' | 'granted' | 'revoked' = 'off'

/** The official base-code queue, minus the immediate script injection (done lazily below). */
function installStub() {
  if (window.fbq) return
  const fbq = function () {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments as unknown as unknown[])
    else fbq.queue.push(arguments)
  } as Fbq
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  fbq.disablePushState = true
  window.fbq = fbq
  window._fbq ??= fbq
}

const fbq = (...args: unknown[]) => window.fbq?.(...args)

export function grantMeta() {
  if (!ID || state === 'granted') return
  if (state === 'off') {
    installStub()
    fbq('consent', 'grant')
    fbq('init', ID)
    whenIdle(() => loadScript('https://connect.facebook.net/en_US/fbevents.js'))
  } else fbq('consent', 'grant')
  state = 'granted'
}

export function revokeMeta() {
  if (state !== 'granted') return
  fbq('consent', 'revoke')
  state = 'revoked'
}

/** `eventID` lets a future Conversions API integration deduplicate browser + server events. */
export function metaEvent(name: string, params: Record<string, unknown>, custom: boolean, eventId: string) {
  fbq(custom ? 'trackCustom' : 'track', name, params, { eventID: eventId })
}
