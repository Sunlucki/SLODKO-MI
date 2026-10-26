/**
 * SVG geometry of the reference design's signature shape: a rounded panel with rectangular
 * notches cut out of its corners (logo, buttons, mini card), joined by concave fillets.
 *
 * Two ways to use it:
 *  - fixed size (mini cards): notchedPath() → inline <svg><path d=…/></svg>
 *  - fluid size (hero frame): nineSlice() → CSS border-image whose corner slices hold all the
 *    curves and whose edges/middle only contain straight lines, so it stretches to any size
 *    without distorting a single radius — and works in the pre-rendered HTML without JS.
 */

export interface Notch {
  /** Width of the cut-out, measured from the panel edge */
  w: number
  /** Height of the cut-out, measured from the panel edge */
  h: number
}

export interface ShapeSpec {
  width: number
  height: number
  /** Convex corner radius */
  radius: number
  /** Concave fillet radius where a notch meets the panel */
  fillet: number
  topLeft?: Notch
  topRight?: Notch
  bottomRight?: Notch
}

const f = (n: number) => +n.toFixed(2)

/** Clockwise outline of the panel minus its corner notches. */
export function notchedPath({ width: W, height: H, radius: R, fillet: r, topLeft: tl, topRight: tr, bottomRight: br }: ShapeSpec): string {
  const d: string[] = []
  const line = (x: number, y: number) => d.push(`L${f(x)} ${f(y)}`)
  const convex = (x: number, y: number) => d.push(`A${R} ${R} 0 0 1 ${f(x)} ${f(y)}`)
  const concave = (x: number, y: number) => d.push(`A${r} ${r} 0 0 0 ${f(x)} ${f(y)}`)

  // Top-left: the panel top sits under the notch, then a tab rises to y=0
  const top0 = tl ? tl.h : 0
  d.push(`M0 ${f(top0 + R)}`)
  convex(R, top0)
  if (tl) {
    line(tl.w - r, tl.h)
    concave(tl.w, tl.h - r)
    line(tl.w, R)
    convex(tl.w + R, 0)
  }
  // Top-right
  if (tr) {
    line(W - tr.w - R, 0)
    convex(W - tr.w, R)
    line(W - tr.w, tr.h - r)
    concave(W - tr.w + r, tr.h)
    line(W - R, tr.h)
    convex(W, tr.h + R)
  } else {
    line(W - R, 0)
    convex(W, R)
  }
  // Bottom-right
  if (br) {
    line(W, H - br.h - R)
    convex(W - R, H - br.h)
    line(W - br.w + r, H - br.h)
    concave(W - br.w, H - br.h + r)
    line(W - br.w, H - R)
    convex(W - br.w - R, H)
  } else {
    line(W, H - R)
    convex(W - R, H)
  }
  // Bottom-left
  line(R, H)
  convex(0, H - R)
  d.push('Z')
  return d.join('')
}

/** Strip along the bottom edge of the panel (left of a bottom-right notch), e.g. the ticker band. */
export function bottomBandPath({ width: W, height: H, radius: R, bottomRight: br }: ShapeSpec, band: number): string {
  const right = br ? W - br.w : W
  return `M0 ${f(H - band)}L${f(right)} ${f(H - band)}L${f(right)} ${f(H - R)}A${R} ${R} 0 0 1 ${f(right - R)} ${H}L${R} ${H}A${R} ${R} 0 0 1 0 ${f(H - R)}Z`
}

export interface NineSliceSpec extends Omit<ShapeSpec, 'width' | 'height'> {
  fill: string
  /** Optional band along the bottom (height + colour) */
  band?: { height: number; fill: string }
}

/**
 * CSS for a fluid notched panel: `border-image` with an SVG whose corner slices contain every curve.
 * Apply to an element with `border-style: solid; border-width: 0` (the image paints over the padding box).
 */
export function nineSlice(spec: NineSliceSpec): { source: string; slice: string; width: string } {
  const { radius: R, fillet: r, topLeft: tl, topRight: tr, bottomRight: br, band } = spec
  const top = Math.max(tl?.h ?? 0, tr?.h ?? 0) + R + (tl || tr ? r : 0)
  const left = (tl ? tl.w : 0) + R + (tl ? r : 0)
  const right = Math.max(tr ? tr.w + R + r : R, br ? br.w + R + r : R)
  const bottom = Math.max(br ? br.h + R + r : R, band ? band.height : 0)
  const middle = 8
  const shape: ShapeSpec = { width: left + middle + right, height: top + middle + bottom, radius: R, fillet: r, topLeft: tl, topRight: tr, bottomRight: br }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${shape.width}" height="${shape.height}" viewBox="0 0 ${shape.width} ${shape.height}">` +
    `<path fill="${spec.fill}" d="${notchedPath(shape)}"/>` +
    (band ? `<path fill="${band.fill}" d="${bottomBandPath(shape, band.height)}"/>` : '') +
    `</svg>`
  return {
    source: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    slice: `${top} ${right} ${bottom} ${left} fill`,
    width: `${top}px ${right}px ${bottom}px ${left}px`,
  }
}
