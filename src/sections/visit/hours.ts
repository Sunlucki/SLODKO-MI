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
/** "00:00" as a closing time is midnight at the end of the day */
const closingMinutes = (hhmm: string) => (hhmm === '00:00' ? 24 * 60 : toMinutes(hhmm))

const UPCOMING_DAYS = 14
const DAY_OF_WEEK: Day[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] // Date#getUTCDay() order
const longDate = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

export interface SpecialDay {
  date: string
  /** "sob 31.10" */
  label: string
  /** "sobota, 31 października" for screen readers */
  fullLabel: string
  today: boolean
  /** undefined = closed that day */
  time?: Time
  note?: string
}

export interface WarsawStatus {
  day: Day
  open: boolean
  /** Today follows site.specialHours instead of the regular hours */
  special: boolean
  /** site.specialHours from today through the next 14 days */
  upcoming: SpecialDay[]
}

/** Current day, open/closed state and upcoming special days in the shop's time zone. Client-only (depends on the clock). */
export function warsawStatus(date = new Date()): WarsawStatus {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  const day = get('weekday').slice(0, 2) as Day // "Mon" → "Mo"
  const today = `${get('year')}-${get('month')}-${get('day')}`
  const now = Number(get('hour')) * 60 + Number(get('minute'))

  const special = site.specialHours.find((s) => s.date === today)
  const time = special ? ('opens' in special ? { opens: special.opens, closes: special.closes } : undefined) : timeFor(day)
  const open = Boolean(time && now >= toMinutes(time.opens) && now < closingMinutes(time.closes))

  return { day, open, special: Boolean(special), upcoming: specialDaysFrom(today) }
}

/** site.specialHours from `today` (YYYY-MM-DD) through the next 14 days. */
export function specialDaysFrom(today: string): SpecialDay[] {
  const end = new Date(Date.parse(`${today}T00:00:00Z`) + UPCOMING_DAYS * 86_400_000).toISOString().slice(0, 10)
  return site.specialHours
    .filter((s) => s.date >= today && s.date < end)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => {
      const d = new Date(`${s.date}T00:00:00Z`)
      return {
        date: s.date,
        label: `${DAY_SHORT[DAY_OF_WEEK[d.getUTCDay()]]} ${s.date.slice(8)}.${s.date.slice(5, 7)}`,
        fullLabel: longDate.format(d),
        today: s.date === today,
        time: 'opens' in s ? { opens: s.opens, closes: s.closes } : undefined,
        note: s.note,
      }
    })
}
