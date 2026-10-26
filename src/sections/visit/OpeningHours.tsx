import { useEffect, useState } from 'react'
import { site } from '@/content'
import { cn } from '@/lib/utils'
import { hoursRows, warsawStatus, type WarsawStatus } from './hours'

const rows = hoursRows()
const ui = site.ui.visit
const heading = 'text-[11px] font-extrabold tracking-[0.2em] text-brand-deep uppercase'

/** Today's row, the open/closed badge and upcoming special days depend on the clock, so they appear only after hydration (SSR HTML stays neutral). */
function useWarsawStatus() {
  const [status, setStatus] = useState<WarsawStatus | null>(null)
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
        <h3 className={heading}>{ui.hours}</h3>
        {status && (
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-extrabold tracking-[0.12em] uppercase',
              status.open ? 'bg-brand-deep text-cream' : 'bg-ink/10 text-ink',
            )}
          >
            <span aria-hidden className={cn('size-2 rounded-full', status.open ? 'animate-pulse bg-caramel' : 'bg-ink/50')} />
            {status.open ? ui.openNow : ui.closedNow}
          </span>
        )}
      </div>
      <dl className="mt-3 space-y-1 text-sm sm:text-base">
        {rows.map((row) => {
          // On a special day the regular row does not apply, the special one below is highlighted instead
          const today = status && !status.special ? row.days.includes(status.day) : false
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
                {row.time ? `${row.time.opens}–${row.time.closes}` : ui.closedDay}
              </dd>
            </div>
          )
        })}
      </dl>
      {status && status.upcoming.length > 0 && (
        <div className="mt-4">
          <h4 className={heading}>{ui.specialHours}</h4>
          <dl className="mt-2 space-y-1 text-sm sm:text-base">
            {status.upcoming.map((day) => (
              <div
                key={day.date}
                aria-current={day.today ? 'date' : undefined}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-x-4 rounded-2xl px-4 py-2 ring-1 ring-brand-deep/25 ring-inset',
                  day.today && 'bg-caramel ring-0',
                )}
              >
                <dt className="font-extrabold tracking-[0.08em] uppercase">
                  <span aria-hidden>{day.label}</span>
                  <span className="sr-only">{day.fullLabel}</span>
                  {day.today && <span className="sr-only"> (dziś)</span>}
                </dt>
                <dd className="font-bold tabular-nums">{day.time ? `${day.time.opens}–${day.time.closes}` : ui.closedDay}</dd>
                {day.note && <dd className="w-full text-xs font-semibold text-ink/70">{day.note}</dd>}
              </div>
            ))}
          </dl>
        </div>
      )}
      {site.hoursNote && <p className="mt-3 text-xs leading-relaxed text-ink/70">{site.hoursNote}</p>}
    </div>
  )
}
