import { useEffect, useState } from 'react'
import { site } from '@/content'
import { cn } from '@/lib/utils'
import { hoursRows, warsawStatus, type Day } from './hours'

const rows = hoursRows()

/** Today's row + open/closed badge depend on the clock, so they appear only after hydration (SSR HTML stays neutral). */
function useWarsawStatus() {
  const [status, setStatus] = useState<{ day: Day; open: boolean } | null>(null)
  useEffect(() => {
    const tick = () => setStatus(warsawStatus())
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])
  return status
}

export function OpeningHours() {
  const status = useWarsawStatus()
  return (
    <div>
      {/* Fixed height: the badge appears after hydration without shifting the layout */}
      <div className="flex h-8 items-center justify-between gap-3">
        <h3 className="text-[11px] font-extrabold tracking-[0.2em] text-brand-deep uppercase">
          Godziny otwarcia
        </h3>
        {status && (
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-extrabold tracking-[0.12em] uppercase',
              status.open ? 'bg-brand-deep text-cream' : 'bg-ink/10 text-ink',
            )}
          >
            <span aria-hidden className={cn('size-2 rounded-full', status.open ? 'animate-pulse bg-caramel' : 'bg-ink/50')} />
            {status.open ? 'Otwarte teraz' : 'Zamknięte'}
          </span>
        )}
      </div>
      <dl className="mt-3 space-y-1 text-sm sm:text-base">
        {rows.map((row) => {
          const today = status ? row.days.includes(status.day) : false
          return (
            <div
              key={row.label}
              aria-current={today ? 'date' : undefined}
              className={cn('flex items-center justify-between gap-4 rounded-full px-4 py-2 transition-colors', today && 'bg-caramel')}
            >
              <dt className="font-extrabold tracking-[0.08em] uppercase">
                <span aria-hidden>{row.label}</span>
                <span className="sr-only">{row.fullLabel}</span>
                {today && <span className="sr-only"> (dziś)</span>}
              </dt>
              <dd className={cn('font-bold tabular-nums', !row.time && 'text-ink/70')}>
                {row.time ? `${row.time.opens}–${row.time.closes}` : 'nieczynne'}
              </dd>
            </div>
          )
        })}
      </dl>
      {site.hoursNote && <p className="mt-3 text-xs leading-relaxed text-ink/70">{site.hoursNote}</p>}
    </div>
  )
}
