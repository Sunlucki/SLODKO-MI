// JSON-LD builders (schema.org). Implemented in the SEO stage — signatures are the contract.
import type { ProductT } from '@/content/schema'

export interface Crumb {
  name: string
  /** Path without base, e.g. "/" or "/produkt/oreo" */
  path: string
}

export function bakeryJsonLd(): object {
  return {}
}

export function websiteJsonLd(): object {
  return {}
}

export function productJsonLd(_product: ProductT): object {
  return {}
}

export function faqJsonLd(_items: { question: string; answer: string }[]): object {
  return {}
}

export function breadcrumbJsonLd(_trail: Crumb[]): object {
  return {}
}
