/**
 * Public tracking API used by components. One call fans out to every configured
 * destination (GA4, Meta Pixel, GTM dataLayer, TikTok Pixel), respecting consent.
 *
 * Components must only call the functions below — never gtag/fbq directly.
 * Implementation details live in src/lib/tracking/*; the event mapping is documented in docs/TRACKING.md.
 */
import { contentFor, defaultLocale, localeFromPath } from '@/content'
import type { ProductT } from '@/content/schema'
import { resolveHref } from './links'
import { dispatch, dispatchPageView } from './tracking/events'

declare global {
  interface Window {
    /** Clicks made before the bundle ran, queued by the inline loader (scripts/lib/defer-app-script.ts) */
    __early?: Element[]
  }
}

export { CONSENT_OPEN_EVENT, getConsent, openConsentSettings, type Consent } from './tracking/consent'
export { initTracking, trackingConfigured, updateConsent } from './tracking/events'

export type TrackAction =
  | { name: 'click_order'; provider: 'wolt' }
  | { name: 'click_phone' }
  | { name: 'click_directions' }
  | { name: 'click_social'; network: 'instagram' | 'facebook' }
  | { name: 'click_reviews'; kind: 'read' | 'write' }

/** Where on the page the interaction happened, e.g. "header", "hero", "footer", "product:oreo". */
export type TrackLocation = string

// Reports stay in the default language on purpose: product and category names must not split by the page language
const reportContent = contentFor(defaultLocale)
/** The product as in the default language (components pass the version of the page being viewed). */
const reported = (p: ProductT) => reportContent.getProduct(p.slug) ?? p

const categoryName = (p: ProductT) => reportContent.catalog.categories.find((c) => c.slug === p.category)?.name ?? p.category

/** Prices are shared only where the site publishes them (site.catalog.showPrices). */
const priceOf = (p: ProductT) => (reportContent.site.catalog.showPrices && p.price != null ? p.price : undefined)

const gaItem = (p: ProductT, index?: number) => ({
  item_id: p.slug,
  item_name: p.name,
  item_category: categoryName(p),
  ...(priceOf(p) != null && { price: priceOf(p) }),
  ...(index != null && { index }),
})

const tiktokContent = (p: ProductT) => ({
  content_id: p.slug,
  content_type: 'product',
  content_name: p.name,
  ...(priceOf(p) != null && { price: priceOf(p) }),
})

/** Meta/TikTok value fields: only when the product has a published price. */
const valueOf = (p?: ProductT) => (p && priceOf(p) != null ? { value: priceOf(p), currency: p.currency } : {})

export function trackAction(action: TrackAction, location: TrackLocation, product?: ProductT): void {
  product = product && reported(product)
  switch (action.name) {
    case 'click_order':
      return dispatch({
        name: 'click_order',
        params: { provider: action.provider, location, item_id: product?.slug },
        meta: {
          name: 'InitiateCheckout',
          params: product && { content_ids: [product.slug], content_name: product.name, content_type: 'product', ...valueOf(product) },
        },
        tiktok: { name: 'InitiateCheckout', params: product && { contents: [tiktokContent(product)], ...valueOf(product) } },
      })
    case 'click_phone':
      return dispatch({ name: 'click_phone', params: { location }, meta: { name: 'Contact' }, tiktok: { name: 'Contact' } })
    case 'click_directions':
      return dispatch({ name: 'click_directions', params: { location }, meta: { name: 'FindLocation' } })
    case 'click_social':
      return dispatch({
        name: 'click_social',
        params: { network: action.network, location },
        meta: { name: 'SocialClick', custom: true, params: { network: action.network, location } },
      })
    case 'click_reviews':
      return dispatch({
        name: 'click_reviews',
        params: { kind: action.kind, location },
        meta: { name: 'ReviewsClick', custom: true, params: { kind: action.kind, location } },
      })
  }
}

/** Route change (called by Layout). GA4 page_view (+ page_language, e.g. "en") + Meta PageView + TikTok page. */
export function trackPageView(path: string, title: string): void {
  dispatchPageView(path, title, localeFromPath(path))
}

/** Product page viewed (GA4 view_item, Meta ViewContent). */
export function trackViewItem(product: ProductT): void {
  product = reported(product)
  dispatch({
    name: 'view_item',
    params: { currency: product.currency, value: priceOf(product), items: [gaItem(product)] },
    meta: {
      name: 'ViewContent',
      params: {
        content_ids: [product.slug],
        content_name: product.name,
        content_type: 'product',
        content_category: categoryName(product),
        ...valueOf(product),
      },
    },
    tiktok: { name: 'ViewContent', params: { contents: [tiktokContent(product)], ...valueOf(product) } },
  })
}

/** Product list scrolled into view (GA4 view_item_list). */
export function trackViewItemList(products: ProductT[], listName: string): void {
  products = products.map(reported)
  dispatch({
    name: 'view_item_list',
    params: { item_list_name: listName, items: products.map((p, i) => gaItem(p, i)) },
    meta: { name: 'ViewItemList', custom: true, params: { content_ids: products.map((p) => p.slug), content_type: 'product', list_name: listName } },
  })
}

/** Product card clicked (GA4 select_item). */
export function trackSelectItem(product: ProductT, listName: string, index: number): void {
  product = reported(product)
  dispatch({
    name: 'select_item',
    params: { item_list_name: listName, items: [gaItem(product, index)] },
    meta: { name: 'SelectItem', custom: true, params: { content_ids: [product.slug], content_name: product.name, list_name: listName, index } },
  })
}

/** Map embed opened / FAQ item opened / review carousel used, etc. */
export function trackEngagement(name: 'open_map' | 'open_faq' | 'review_navigate' | 'open_menu' | 'spotlight_navigate', detail?: string): void {
  dispatch({ name, params: { detail } })
}

/**
 * Called once after hydration (CookieBanner). Tracked links clicked before the bundle ran are reported now
 * (the browser already opened them; consent rules apply as usual). The last button tapped is clicked again,
 * so JS-only controls (menu, carousels, map, cookie settings) still answer that first tap.
 */
export function replayEarlyClicks(): void {
  let button: HTMLButtonElement | undefined
  for (const el of window.__early?.splice(0) ?? []) {
    if (el instanceof HTMLButtonElement) button = el
    else if (el instanceof HTMLAnchorElement) {
      // data-track* attributes are rendered by SmartLink on every tracked link
      const { track = '', trackLocation = '', trackProduct } = el.dataset
      const action = resolveHref(track).action
      if (action) trackAction(action, trackLocation, trackProduct ? reportContent.getProduct(trackProduct) : undefined)
    }
  }
  const last = button
  // Next task: after every mount effect of the hydration commit (e.g. the menu's own "close on route change")
  if (last) setTimeout(() => last.isConnected && !last.disabled && last.click())
}
