// Runtime access to validated content (see scripts/vite-plugin-content.ts).
import content from 'virtual:content'
import type { PageT, ProductT, SectionOf } from './schema'

export const { site, catalog, reviews, pages, images } = content
export const products = catalog.products

export function getProduct(slug: string): ProductT | undefined {
  return products.find((p) => p.slug === slug)
}

export function getPage(path: string): PageT | undefined {
  const norm = path.replace(/\/$/, '') || '/'
  return pages.find((p) => (p.path.replace(/\/$/, '') || '/') === norm)
}

export function productsFor(source: SectionOf<'productGrid'>['source'], limit?: number): ProductT[] {
  const list =
    source.mode === 'all'
      ? products
      : source.mode === 'featured'
        ? products.filter((p) => p.featured)
        : source.mode === 'category'
          ? products.filter((p) => p.category === source.category)
          : source.slugs.map((s) => getProduct(s)).filter((p): p is ProductT => Boolean(p))
  return limit ? list.slice(0, limit) : list
}

export function formatPrice(product: ProductT): string | null {
  if (!site.catalog.showPrices || product.price == null) return null
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: product.currency, minimumFractionDigits: 2 }).format(product.price)
}

export const DAY_NAMES: Record<string, string> = {
  Mo: 'Poniedziałek',
  Tu: 'Wtorek',
  We: 'Środa',
  Th: 'Czwartek',
  Fr: 'Piątek',
  Sa: 'Sobota',
  Su: 'Niedziela',
}
export const DAY_SHORT: Record<string, string> = { Mo: 'pon', Tu: 'wt', We: 'śr', Th: 'czw', Fr: 'pt', Sa: 'sob', Su: 'nd' }
