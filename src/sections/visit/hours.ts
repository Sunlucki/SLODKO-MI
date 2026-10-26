import { DAY_NAMES, DAY_SHORT, site } from '@/content'

const WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const
export type Day = (typeof WEEK)[number]

interface Time {
  opens: string
  closes: string
}

export interface HoursRow {
  days: Day[]
  /** "wt–nd" */
  label: string
  /** "Wtorek – Niedziela" for screen readers */
  fullLabel: string
  /** undefined = closed that day */
  time?: Time
}

function timeFor(day: Day): Time | undefined {
  const entry = site.hours.find((h) => h.days.includes(day))
  return entry && 'opens' in entry ? { opens: entry.opens, closes: entry.closes } : undefined
}

/** Opening hours as table rows, Monday first; consecutive days with identical hours share one row. */
export function hoursRows(): HoursRow[] {
  const groups: { days: Day[]; time?: Time }[] = []
  for (const day of WEEK) {
    const time = timeFor(day)
    const last = groups.at(-1)
    if (last && last.time?.opens === time?.opens && last.time?.closes === time?.closes) last.days.push(day)
    else groups.push({ days: [day], time })
  }
  return groups.map(({ days, time }) => {
    const ends = days.length > 1 ? [days[0], days[days.length - 1]] : [days[0]]
    return {
      days,
      time,
      label: ends.map((d) => DAY_SHORT[d]).join('–'),
      fullLabel: ends.map((d) => DAY_NAMES[d]).join(' – '),
    }
  })
}

const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))

/** Current weekday and open/closed state in the shop's time zone. Client-only (depends on the clock). */
export function warsawStatus(date = new Date()): { day: Day; open: boolean } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  const day = get('weekday').slice(0, 2) as Day // "Mon" → "Mo"
  const now = Number(get('hour')) * 60 + Number(get('minute'))
  const time = timeFor(day)
  return { day, open: Boolean(time && now >= toMinutes(time.opens) && now < toMinutes(time.closes)) }
}
