/**
 * Public tracking API used by components. One call fans out to every configured
 * destination (GA4, Meta Pixel, GTM dataLayer, TikTok Pixel), respecting consent.
 *
 * Components must only call the functions below — never gtag/fbq directly.
 * Implementation details live in src/lib/tracking/*.
 */
import type { ProductT } from '@/content/schema'

export type TrackAction =
  | { name: 'click_order'; provider: 'wolt' }
  | { name: 'click_phone' }
  | { name: 'click_directions' }
  | { name: 'click_social'; network: 'instagram' | 'facebook' }
  | { name: 'click_reviews'; kind: 'read' | 'write' }

/** Where on the page the interaction happened, e.g. "header", "hero", "footer", "product:oreo". */
export type TrackLocation = string

export function trackAction(_action: TrackAction, _location: TrackLocation, _product?: ProductT): void {}

export function trackPageView(_path: string, _title: string): void {}

/** Product page viewed (GA4 view_item, Meta ViewContent). */
export function trackViewItem(_product: ProductT): void {}

/** Product list scrolled into view (GA4 view_item_list). */
export function trackViewItemList(_products: ProductT[], _listName: string): void {}

/** Product card clicked (GA4 select_item). */
export function trackSelectItem(_product: ProductT, _listName: string, _index: number): void {}

/** Map embed opened / FAQ item opened / review carousel used, etc. */
export function trackEngagement(_name: 'open_map' | 'open_faq' | 'review_navigate' | 'open_menu', _detail?: string): void {}
