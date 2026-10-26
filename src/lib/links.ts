import { contentFor, defaultLocale, type Localized } from '@/content'
import type { TrackAction } from './analytics'

export interface ResolvedLink {
  href: string
  /** Opens outside the SPA (new tab for http, native handler for tel:) */
  external: boolean
  newTab: boolean
  action?: TrackAction
}

/**
 * Resolves content hrefs, including @tokens from site.json, and attaches the tracking action.
 * Internal paths get the language prefix of `c` ("/produkt/oreo" → "/en/produkt/oreo/").
 */
export function resolveHref(href: string, c: Localized = contentFor(defaultLocale)): ResolvedLink {
  const { site } = c
  const ext = (url: string, action?: TrackAction): ResolvedLink => ({ href: url, external: true, newTab: url.startsWith('http'), action })
  switch (href) {
    case '@order':
      return ext(site.links.order, { name: 'click_order', provider: 'wolt' })
    case '@phone':
      return ext(`tel:${site.contact.phone}`, { name: 'click_phone' })
    case '@directions':
      return ext(site.links.directions, { name: 'click_directions' })
    case '@instagram':
      return ext(site.links.instagram, { name: 'click_social', network: 'instagram' })
    case '@facebook':
      return ext(site.links.facebook ?? site.links.instagram, { name: 'click_social', network: 'facebook' })
    case '@reviews':
      return ext(site.links.reviews, { name: 'click_reviews', kind: 'read' })
    case '@writeReview':
      return ext(site.links.writeReview ?? site.links.reviews, { name: 'click_reviews', kind: 'write' })
  }
  if (href.startsWith('tel:')) return ext(href, { name: 'click_phone' })
  if (/^(https?:|mailto:)/.test(href)) {
    if (href.includes('instagram.com')) return ext(href, { name: 'click_social', network: 'instagram' })
    if (href.includes('facebook.com')) return ext(href, { name: 'click_social', network: 'facebook' })
    if (href.includes('wolt.com')) return ext(href, { name: 'click_order', provider: 'wolt' })
    return ext(href)
  }
  // Pages are pre-rendered as <path>/index.html and the host redirects "/x" → "/x/", so link to the final URL
  const [rawPath, hash] = href.split('#')
  const path = rawPath ? c.localize(rawPath) : rawPath
  const slashed = path && path !== '/' && !path.endsWith('/') ? `${path}/` : path
  return { href: slashed + (hash === undefined ? '' : `#${hash}`), external: false, newTab: false }
}
