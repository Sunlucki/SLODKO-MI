import { cn } from '@/lib/utils'

/**
 * Caramel marquee strip. Pure CSS (animate-marquee moves the track by -50%), so each half
 * repeats the phrases until it is wider than a large screen. Only the first run is exposed
 * to assistive tech; it pauses on hover and stays still with prefers-reduced-motion.
 */
export function Ticker({ items, className }: { items: string[]; className?: string }) {
  const chars = items.join('').length
  const reps = Math.max(1, Math.ceil(200 / chars))
  const runs = Array.from({ length: reps * 2 }, (_, i) => i)
  return (
    <div className={cn('group overflow-hidden bg-caramel text-ink', className)}>
      <div
        className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ animationDuration: `${Math.round(chars * reps * 0.3)}s` }}
      >
        {runs.map((run) => (
          <ul key={run} aria-hidden={run > 0 || undefined} className="flex shrink-0 items-center">
            {items.map((item, i) => (
              <li key={i} className="flex items-center font-display text-xl leading-none whitespace-nowrap uppercase lg:text-2xl">
                {item}
                <Swirl />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

/** Small cinnamon-swirl separator. */
function Swirl() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden focusable={false} className="mx-5 shrink-0 text-brand-deep lg:mx-7" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round">
      <path d="M12 12.5a1.5 1.5 0 1 1 1.5-1.5c0 2-1.6 3.5-3.5 3.5S6.5 12.9 6.5 11 8.6 6.5 12 6.5s5.5 2.4 5.5 5.5-2.9 6.5-6 6.5" />
    </svg>
  )
}
