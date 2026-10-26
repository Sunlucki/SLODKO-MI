import type { Localized } from '@/content'
import type { SiteT } from '@/content/schema'

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

function timeFor(site: SiteT, day: Day): Time | undefined {
  const entry = site.hours.find((h) => h.days.includes(day))
  return entry && 'opens' in entry ? { opens: entry.opens, closes: entry.closes } : undefined
}

/** Opening hours as table rows, Monday first; consecutive days with identical hours share one row. */
export function hoursRows(site: SiteT): HoursRow[] {
  const { short, long } = site.ui.days
  const groups: { days: Day[]; time?: Time }[] = []
  for (const day of WEEK) {
    const time = timeFor(site, day)
    const last = groups.at(-1)
    if (last && last.time?.opens === time?.opens && last.time?.closes === time?.closes) last.days.push(day)
    else groups.push({ days: [day], time })
  }
  return groups.map(({ days, time }) => {
    const ends = days.length > 1 ? [days[0], days[days.length - 1]] : [days[0]]
    return {
      days,
      time,
      label: ends.map((d) => short[d]).join('–'),
      fullLabel: ends.map((d) => long[d]).join(' – '),
    }
  })
}

const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))
/** "00:00" as a closing time is midnight at the end of the day */
const closingMinutes = (hhmm: string) => (hhmm === '00:00' ? 24 * 60 : toMinutes(hhmm))

const UPCOMING_DAYS = 14
const DAY_OF_WEEK: Day[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] // Date#getUTCDay() order

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
export function warsawStatus(c: Localized, date = new Date()): WarsawStatus {
  // en-GB only to read the parts reliably ("Mon", 24-hour clock) — nothing here is displayed
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

  const special = c.site.specialHours.find((s) => s.date === today)
  const time = special ? ('opens' in special ? { opens: special.opens, closes: special.closes } : undefined) : timeFor(c.site, day)
  const open = Boolean(time && now >= toMinutes(time.opens) && now < closingMinutes(time.closes))

  return { day, open, special: Boolean(special), upcoming: specialDaysFrom(c, today) }
}

/** site.specialHours from `today` (YYYY-MM-DD) through the next 14 days, labelled in the page's language. */
export function specialDaysFrom({ site, lang }: Localized, today: string): SpecialDay[] {
  const end = new Date(Date.parse(`${today}T00:00:00Z`) + UPCOMING_DAYS * 86_400_000).toISOString().slice(0, 10)
  const dayMonth = new Intl.DateTimeFormat(lang, { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
  const longDate = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  return site.specialHours
    .filter((s) => s.date >= today && s.date < end)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => {
      const d = new Date(`${s.date}T00:00:00Z`)
      return {
        date: s.date,
        label: `${site.ui.days.short[DAY_OF_WEEK[d.getUTCDay()]]} ${dayMonth.format(d)}`,
        fullLabel: longDate.format(d),
        today: s.date === today,
        time: 'opens' in s ? { opens: s.opens, closes: s.closes } : undefined,
        note: s.note,
      }
    })
}
