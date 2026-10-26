// Runtime access to validated content (see scripts/vite-plugin-content.ts).
//
// Every language version is pre-built: content.locales[code] is the default content with the
// translation overlay of src/data/i18n/<code>/ applied. Components read the version of the page
// they render with useContent(); the language comes from the URL prefix ("/", "/en/", "/ru/"…).
import { createContext, createElement, useContext, type ReactNode } from 'react'
import content from 'virtual:content'
import type { PageT, ProductT, SectionOf, SiteT } from './schema'
import type { LocaleData } from './validate'

export const images = content.images
export const defaultLocale = content.defaultLocale
export const locales: SiteT['i18n']['locales'] = content.site.i18n.locales
const codes = locales.map((l) => l.code)

const norm = (path: string) => path.replace(/\/$/, '') || '/'

/** Language of a router pathname (without the deploy base): "/en/produkt/oreo/" → "en". */
export function localeFromPath(pathname: string): string {
  const first = pathname.split('/')[1]
  return first && first !== defaultLocale && codes.includes(first) ? first : defaultLocale
}

/** Pathname without its language prefix: "/en/produkt/oreo/" → "/produkt/oreo/". */
export function stripLocale(pathname: string): string {
  const locale = localeFromPath(pathname)
  return locale === defaultLocale ? pathname : pathname.slice(locale.length + 1) || '/'
}

/** Internal path in a language: localizePath("/produkt/oreo/", "en") → "/en/produkt/oreo/" (hash/query kept). */
export function localizePath(path: string, locale: string): string {
  if (locale === defaultLocale || !path.startsWith('/')) return path
  return `/${locale}${path === '/' ? '/' : path}`
}

/** Replaces {name} placeholders in UI texts, e.g. fmt(ui.common.call, { phone }) */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match))
}

export interface Localized extends LocaleData {
  locale: string
  /** BCP 47 tag for <html lang>, Intl formatting and hreflang */
  lang: string
  products: ProductT[]
  getProduct(slug: string): ProductT | undefined
  /** Page by its path in the default language ("/" or "/polityka-prywatnosci") */
  getPage(path: string): PageT | undefined
  productsFor(source: SectionOf<'productGrid'>['source'], limit?: number): ProductT[]
  /** Price with currency in this language, or null when prices are hidden / not set */
  formatPrice(product: ProductT): string | null
  /** Internal path in this language */
  localize(path: string): string
}

const cache = new Map<string, Localized>()

/** Content of one language version (falls back to the default language). */
export function contentFor(locale: string): Localized {
  const cached = cache.get(locale)
  if (cached) return cached
  const data = content.locales[locale] ?? content.locales[defaultLocale]
  const code = content.locales[locale] ? locale : defaultLocale
  const lang = locales.find((l) => l.code === code)?.htmlLang ?? code
  const products = data.catalog.products
  const getProduct = (slug: string) => products.find((p) => p.slug === slug)
  const priceFormat = new Intl.NumberFormat(lang, { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 })
  const localized: Localized = {
    ...data,
    locale: code,
    lang,
    products,
    getProduct,
    getPage: (path) => data.pages.find((p) => norm(p.path) === norm(path)),
    productsFor(source, limit) {
      const list =
        source.mode === 'all'
          ? products
          : source.mode === 'featured'
            ? products.filter((p) => p.featured)
            : source.mode === 'category'
              ? products.filter((p) => p.category === source.category)
              : source.slugs.map(getProduct).filter((p): p is ProductT => Boolean(p))
      return limit ? list.slice(0, limit) : list
    },
    formatPrice: (product) => (!data.site.catalog.showPrices || product.price == null ? null : priceFormat.format(product.price)),
    localize: (path) => localizePath(path, code),
  }
  cache.set(locale, localized)
  return localized
}

const ContentContext = createContext<Localized>(contentFor(defaultLocale))

/** Provides the language version of the current page (Layout wraps every route with it). */
export function ContentProvider({ locale, children }: { locale: string; children: ReactNode }) {
  return createElement(ContentContext.Provider, { value: contentFor(locale) }, children)
}

/** Content of the page being rendered, in its language. */
export function useContent(): Localized {
  return useContext(ContentContext)
}
