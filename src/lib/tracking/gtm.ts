// Google Tag Manager — loads after any consent. Consent state reaches it through Consent Mode
// (gtag consent update) and the `consent_update` dataLayer event, so tags inside the container
// must use GTM's built-in consent checks.
import { dataLayerPush } from './dataLayer'
import { loadScript, whenIdle } from './loader'

const ID = import.meta.env.VITE_GTM_ID

export const gtmEnabled = Boolean(ID)

let loaded = false

export function loadGtm() {
  if (!ID || loaded) return
  loaded = true
  dataLayerPush({ 'gtm.start': Date.now(), event: 'gtm.js' })
  whenIdle(() => loadScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(ID)}`))
}
