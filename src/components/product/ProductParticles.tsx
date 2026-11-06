import { useEffect, useRef } from 'react'
import { images } from '@/content'
import { asset } from '@/lib/utils'

/**
 * Ingredient particles + steam behind a product's cut-out. Pictures come from the image pipeline as
 * `particles/<slug>-1` … `-10` (no particles for a slug → only the steam). Everything stays tucked behind
 * the bun until its host gets [data-burst] (useParticleBurst); then the pieces fly out, hover around the bun
 * and fly back when it is removed. Styles: .pp-* in globals.css.
 */

// Resting spots around the bun, in % of the image frame from its centre (x, y), plus a tilt.
// The top-right corner stays free for the round "+" button; the lower ones stay above the card's title.
// Each piece then gets its own distance (×1.05–1.4, so some fly past the card edge), size and tilt.
const SPOTS: [number, number, number][] = [
  [-41, -6, -18],
  [-33, -32, 24],
  [-9, -42, -10],
  [15, -40, 16],
  [42, -2, 30],
  [41, 17, -22],
  [26, 30, 12],
  [1, 32, -28],
  [-25, 30, 20],
  [-43, 15, -12],
]

// Deterministic per flavour (same on the server and in the browser): a small seeded generator
function random(seed: string) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

export function ProductParticles({ slug }: { slug: string }) {
  const rnd = random(slug)
  const pieces = SPOTS.map(([x, y, r], i) => {
    const spread = 1.05 + rnd() * 0.35
    return {
      key: `particles/${slug}-${i + 1}`,
      style: {
        '--x': (x * spread).toFixed(1),
        '--y': (y * spread).toFixed(1),
        '--r': `${Math.round(r + (rnd() - 0.5) * 30)}deg`,
        '--w': `${(14 + rnd() * 11).toFixed(1)}cqw`,
        '--i': i,
      } as React.CSSProperties,
    }
  }).filter((p) => images[p.key])
  return (
    <div aria-hidden className="pp-layer">
      <span className="pp-steam" />
      <span className="pp-steam" />
      <span className="pp-steam" />
      {pieces.map(({ key, style }) => {
        const meta = images[key]
        return (
          <span key={key} className="pp-piece" style={style}>
            <img src={asset(`images/${key}-${meta.widths[0]}.webp`)} width={meta.width} height={meta.height} alt="" loading="lazy" decoding="async" />
          </span>
        )
      })}
    </div>
  )
}

/**
 * Sets [data-burst] on `area` (the bun's frame, which holds <ProductParticles>) while a mouse is over the bun
 * itself — the middle of the frame, not its empty corners — or, on touch screens, while the frame is well
 * inside the viewport. Pointer position is tracked on the frame's parent, because a stretched card link
 * usually covers the image and would swallow :hover.
 */
/** `resetKey`: pass what re-creates the frame element (e.g. the slide's slug) so the listeners follow it. */
export function useParticleBurst<T extends HTMLElement>(resetKey?: unknown) {
  const area = useRef<T>(null)
  useEffect(() => {
    const el = area.current
    const host = el?.parentElement?.closest<HTMLElement>('article, .nf-card, section') ?? el?.parentElement
    if (!el || !host) return
    if (matchMedia('(hover: none)').matches) {
      const io = new IntersectionObserver(([e]) => el.toggleAttribute('data-burst', e.isIntersecting), { threshold: 0.6 })
      io.observe(el)
      return () => io.disconnect()
    }
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      el.toggleAttribute('data-burst', x > 0.18 && x < 0.82 && y > 0.18 && y < 0.82)
    }
    const onLeave = () => el.removeAttribute('data-burst')
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
    return () => {
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
    }
  }, [resetKey])
  return area
}
