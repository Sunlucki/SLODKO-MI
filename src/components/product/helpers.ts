import { images, pages, site } from '@/content'
import type { ImageT } from '@/content/schema'

/** True for transparent cut-outs (alpha channel in the manifest), false for full photos. */
export function isCutout(image: ImageT): boolean {
  return images[image.src]?.alpha ?? false
}

/** Link + label of the catalog: the first product grid on the home page (e.g. "/#smaki"). */
export function catalogLink(): { href: string; label: string } {
  const grid = pages.find((p) => p.path === '/')?.sections.find((s) => s.enabled && s.type === 'productGrid')
  const href = grid ? `/#${grid.id}` : '/'
  return { href, label: site.nav.find((l) => l.href === href)?.label ?? 'Smaki' }
}
