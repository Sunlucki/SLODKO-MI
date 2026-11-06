import { images } from '@/content'
import { asset } from '@/lib/utils'

/**
 * Ingredient particles + steam behind a product's cut-out. Pictures come from the image pipeline as
 * `particles/<slug>-1` … `-10` (no particles for a slug → only the steam). Everything stays tucked behind
 * the bun until the card is hovered (or, on touch screens, scrolled into view: ProductCard sets data-burst);
 * then the pieces fly out, hover around it and fly back when the pointer leaves. Styles: .pp-* in globals.css.
 */

// Resting spots around the bun, in % of the image frame from its centre (x, y), plus a tilt.
// The top-right corner stays free for the round "+" button.
const SPOTS: [number, number, number][] = [
  [-41, -6, -18],
  [-33, -32, 24],
  [-9, -42, -10],
  [15, -40, 16],
  [42, -2, 30],
  [39, 22, -22],
  [26, 40, 12],
  [0, 44, -28],
  [-25, 39, 20],
  [-42, 19, -12],
]

export function ProductParticles({ slug }: { slug: string }) {
  const pieces = SPOTS.map((spot, i) => ({ spot, key: `particles/${slug}-${i + 1}` })).filter((p) => images[p.key])
  return (
    <div aria-hidden className="pp-layer">
      <span className="pp-steam" />
      <span className="pp-steam" />
      <span className="pp-steam" />
      {pieces.map(({ spot: [x, y, r], key }, i) => {
        const meta = images[key]
        return (
          <span key={key} className="pp-piece" style={{ '--x': x, '--y': y, '--r': `${r}deg`, '--i': i } as React.CSSProperties}>
            <img src={asset(`images/${key}-${meta.widths[0]}.webp`)} width={meta.width} height={meta.height} alt="" loading="lazy" decoding="async" />
          </span>
        )
      })}
    </div>
  )
}
