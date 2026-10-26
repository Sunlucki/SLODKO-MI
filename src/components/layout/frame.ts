/**
 * Geometry of the notched frames from the reference design (hero, menu overlay, mini cards).
 * Every frame is an SVG 9-slice border-image (src/lib/notched-shape.ts): exact radii at any
 * width, no JS. The same numbers are exposed as CSS variables (--nf-*) so the header items
 * sit exactly inside the hero's notches.
 */
import type { SiteT } from '@/content/schema'
import { nineSlice, type Notch } from '@/lib/notched-shape'

interface Breakpoint {
  /** min-width in px (0 = mobile first) */
  min: number
  /** Distance of the frame from the viewport edge */
  inset: number
  /** Convex radius / concave fillet */
  radius: number
  fillet: number
  /** Header item height (logo pill, round buttons) and the gap that separates it from the frame */
  item: number
  gap: number
  /** Top-right notch width (holds the round buttons + CTA pill) */
  right: number
  /** Logo notch width */
  left: number
  /** Bottom-right notch for the spotlight card (none on phones) */
  card?: Notch
  /** Ticker band height */
  band: number
}

export const FRAME: Breakpoint[] = [
  { min: 0, inset: 8, radius: 24, fillet: 16, item: 48, gap: 12, left: 168, right: 120, band: 52 },
  { min: 768, inset: 10, radius: 28, fillet: 20, item: 54, gap: 12, left: 196, right: 380, card: { w: 312, h: 184 }, band: 56 },
  { min: 1024, inset: 12, radius: 32, fillet: 24, item: 60, gap: 14, left: 214, right: 412, card: { w: 352, h: 206 }, band: 64 },
]

/** Mini card (spotlight): rounded panel with a top-right notch for its two arrow buttons. */
const CARD = { radius: 22, fillet: 14, arrows: 40, notch: { w: 100, h: 52 } }

const decl = (selector: string, rules: Record<string, string | number>) =>
  `${selector}{${Object.entries(rules)
    .map(([k, v]) => `${k}:${typeof v === 'number' ? `${v}px` : v}`)
    .join(';')}}`

// Painted by ::before with border widths equal to the slices (browsers skip border-image on 0-width borders)
const border = (s: ReturnType<typeof nineSlice>) => ({
  'border-width': s.width,
  'border-image-source': s.source,
  'border-image-slice': s.slice,
})

/** CSS for every notched frame, coloured with the site theme (injected once by Layout). */
export function frameCss(colors: SiteT['theme']['colors']): string {
  const css: string[] = []
  for (const bp of FRAME) {
    const notchH = bp.item + bp.gap
    const tl = { w: bp.left, h: notchH }
    const tr = { w: bp.right, h: notchH }
    const vars = decl(':root', {
      '--nf-inset': bp.inset,
      '--nf-r': bp.radius,
      '--nf-item': bp.item,
      '--nf-gap': bp.gap,
      '--nf-notch-h': notchH,
      '--nf-left': bp.left,
      '--nf-right': bp.right,
      '--nf-card-w': bp.card ? bp.card.w : 0,
      '--nf-card-h': bp.card ? bp.card.h : 0,
      '--nf-band': bp.band,
    })
    const hero = decl(
      '.nf-hero::before',
      border(
        nineSlice({
          radius: bp.radius,
          fillet: bp.fillet,
          topLeft: tl,
          topRight: tr,
          bottomRight: bp.card,
          fill: colors.brandDeep,
          band: { height: bp.band, fill: colors.caramel },
        }),
      ),
    )
    const menu = decl('.nf-menu::before', border(nineSlice({ radius: bp.radius, fillet: bp.fillet, topLeft: tl, topRight: tr, fill: colors.brandDeep })))
    const rules = vars + hero + menu
    css.push(bp.min ? `@media (min-width:${bp.min}px){${rules}}` : rules)
  }
  css.push(decl('.nf-card::before', border(nineSlice({ radius: CARD.radius, fillet: CARD.fillet, topRight: CARD.notch, fill: colors.brandDeep }))))
  css.push(
    decl('.nf-card', {
      '--nf-arrow': CARD.arrows,
      '--nf-card-notch-w': CARD.notch.w,
      '--nf-card-notch-h': CARD.notch.h,
    }),
  )
  // The content-box background sits under the solid middle slice (invisible); it lets contrast checkers (axe/Lighthouse),
  // which ignore border-image, see that the text is not on the cream page background
  css.push(
    '.nf-hero,.nf-menu,.nf-card{position:relative;isolation:isolate}' +
      ".nf-hero::before,.nf-menu::before,.nf-card::before{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;border-style:solid;background:content-box var(--c-brand-deep)}",
  )
  return css.join('')
}
