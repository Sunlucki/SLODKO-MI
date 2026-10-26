/**
 * Translations are overlays: src/data/i18n/<locale>/ mirrors src/data (site.json, products.json,
 * pages/<name>.json) but holds ONLY texts. Structure, links, images, prices and colours always come
 * from the default-language files, so an editor changes the page structure in one place.
 *
 * Matching rules when an overlay is applied to the (validated) default content:
 *  - objects: every overlay key must exist in the base
 *  - arrays of objects with "id" (sections) or "slug" (products, categories): matched by that key
 *  - other arrays (headline lines, paragraphs, FAQ items, nav links…): matched by position
 *  - strings: replaced, except technical keys (NOT_TRANSLATABLE) that must stay as in the base
 */

/** Keys whose string values are identifiers, URLs, dates or settings — never translated. */
export const NOT_TRANSLATABLE = new Set([
  '$schema',
  'id',
  'slug',
  'type',
  'kind',
  'mode',
  'href',
  'src',
  'path',
  'url',
  'category',
  'slugs',
  'productSlugs',
  'variant',
  'tone',
  'date',
  'opens',
  'closes',
  'days',
  'phone',
  'email',
  'postalCode',
  'country',
  'currency',
  'unit',
  'ogImage',
  'publishTime',
  'fetchedAt',
  'code',
  'htmlLang',
  'ogLocale',
  'defaultLocale',
  'fallbackLocale',
  'policyHref',
  'legalName',
  'wordmark',
])

/** Whole subtrees that are settings, not text. */
const NOT_TRANSLATABLE_TREES = new Set(['links', 'theme', 'i18n', 'geo', 'hours', 'contact', 'allergens', 'source'])

type Json = string | number | boolean | null | Json[] | { [k: string]: Json }

const isObj = (v: unknown): v is Record<string, Json> => typeof v === 'object' && v !== null && !Array.isArray(v)
const keyOf = (item: Json): string | null => (isObj(item) ? (typeof item.id === 'string' ? item.id : typeof item.slug === 'string' ? item.slug : null) : null)

/**
 * Applies a translation overlay to base content. Returns the merged copy; problems are pushed to
 * `errors` as "<path>: message" so the caller can prefix the file name.
 */
export function applyOverlay(base: Json, overlay: Json, errors: string[], path: string[] = []): Json {
  const where = path.join('.') || '(root)'
  const key = path.at(-1) ?? ''
  if (overlay === null || overlay === undefined) return base

  if (Array.isArray(base)) {
    if (!Array.isArray(overlay)) {
      errors.push(`${where}: expected an array (as in the default language)`)
      return base
    }
    const keyed = base.length > 0 && base.every((item) => keyOf(item) !== null)
    if (keyed) {
      const result = [...base]
      for (const item of overlay) {
        const k = keyOf(item)
        const index = k === null ? -1 : base.findIndex((b) => keyOf(b) === k)
        if (index < 0) {
          errors.push(`${where}: item ${k === null ? 'without "id"/"slug"' : `"${k}"`} does not exist in the default language`)
          continue
        }
        result[index] = applyOverlay(base[index], item, errors, [...path, String(k)])
      }
      return result
    }
    if (overlay.length > base.length) errors.push(`${where}: has ${overlay.length} items, the default language has ${base.length}`)
    return base.map((item, i) => (i < overlay.length ? applyOverlay(item, overlay[i], errors, [...path, String(i)]) : item))
  }

  if (isObj(base)) {
    if (!isObj(overlay)) {
      errors.push(`${where}: expected an object (as in the default language)`)
      return base
    }
    if (NOT_TRANSLATABLE_TREES.has(key)) {
      errors.push(`${where}: settings are not translated — remove this key from the translation file`)
      return base
    }
    const result: Record<string, Json> = { ...base }
    for (const [k, v] of Object.entries(overlay)) {
      if (k === '$schema') continue
      if (!(k in base)) {
        errors.push(`${[...path, k].join('.')}: unknown key — translations may only contain keys that exist in the default language`)
        continue
      }
      // Matching keys inside keyed arrays must stay equal (they identify the item)
      if ((k === 'id' || k === 'slug') && v === base[k]) continue
      result[k] = applyOverlay(base[k], v, errors, [...path, k])
    }
    return result
  }

  if (typeof base === 'string') {
    if (typeof overlay !== 'string') {
      errors.push(`${where}: expected text`)
      return base
    }
    if (NOT_TRANSLATABLE.has(key) || path.some((p) => NOT_TRANSLATABLE_TREES.has(p))) {
      if (overlay !== base) errors.push(`${where}: "${key}" is not translatable — remove it from the translation file`)
      return base
    }
    return overlay
  }

  if (overlay !== base) errors.push(`${where}: numbers and true/false are settings — remove them from the translation file`)
  return base
}

export interface MissingText {
  /** Dot path inside the file, e.g. "sections.start.headline.0.text" */
  path: string
  /** Text in the default language */
  source: string
}

/** Lists translatable texts of `base` that the overlay does not provide (shown in the default language). */
export function missingTranslations(base: Json, overlay: Json | undefined, path: string[] = []): MissingText[] {
  const key = path.at(-1) ?? ''
  if (NOT_TRANSLATABLE_TREES.has(key)) return []
  if (Array.isArray(base)) {
    const items = Array.isArray(overlay) ? overlay : []
    const keyed = base.length > 0 && base.every((item) => keyOf(item) !== null)
    return base.flatMap((item, i) => {
      const k = keyed ? keyOf(item)! : String(i)
      const match = keyed ? items.find((o) => keyOf(o) === k) : items[i]
      return missingTranslations(item, match, [...path, k])
    })
  }
  if (isObj(base)) {
    const o = isObj(overlay) ? overlay : undefined
    return Object.entries(base).flatMap(([k, v]) => missingTranslations(v, o?.[k], [...path, k]))
  }
  if (typeof base === 'string' && !NOT_TRANSLATABLE.has(key) && base.trim() && !/^(https?:|mailto:|tel:|@|\/|#)/.test(base)) {
    return typeof overlay === 'string' && overlay.trim() ? [] : [{ path: path.join('.'), source: base }]
  }
  return []
}
