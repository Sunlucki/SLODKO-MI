// Google Analytics 4 via gtag.js — basic consent mode: the script loads only after analytics consent.
import { gtag } from './dataLayer'
import { loadScript, whenIdle } from './loader'

const ID = import.meta.env.VITE_GA_ID

export const ga4Enabled = Boolean(ID)

let configured = false

/** Official GA opt-out flag: makes an already loaded gtag.js send nothing (incl. enhanced measurement). */
function setDisabled(disabled: boolean) {
  ;(window as unknown as Record<string, unknown>)[`ga-disable-${ID}`] = disabled
}

export function grantGa4(debug: boolean) {
  if (!ID) return
  setDisabled(false)
  if (configured) return
  configured = true
  gtag('js', new Date())
  // Page views are sent manually on every route change (SPA), see events.ts
  gtag('config', ID, { send_page_view: false, ...(debug && { debug_mode: true }) })
  whenIdle(() => loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID)}`))
}

export function revokeGa4() {
  if (ID) setDisabled(true)
}

export function ga4Event(name: string, params: Record<string, unknown>) {
  gtag('event', name, params)
}
