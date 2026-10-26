import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react'
import { CtaButton } from '@/components/ui/Button'
import { ChevronDown, ChevronLeft, ChevronRight, GoogleG, Star } from '@/components/ui/icons'
import { Picture } from '@/components/ui/Picture'
import { Reveal } from '@/components/ui/Reveal'
import { Container, headingToneClass, Section, SectionHeading } from '@/components/ui/Section'
import { SmartLink } from '@/components/ui/SmartLink'
import { fmt, useContent } from '@/content'
import type { ReviewsT } from '@/content/schema'
import { trackEngagement } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import type { SectionProps } from './types'

type Review = ReviewsT['items'][number]

const LOCATION = 'reviews'
const label = 'text-[11px] font-extrabold tracking-[0.14em] uppercase'

/**
 * Review count noun in the page's language: Intl plural categories map onto countForms [one, few, many]
 * ("other" and the rest → many). Polish: 1 opinia, 2–4 opinie (but 12–14 opinii), otherwise opinii.
 */
function countNoun(n: number, [one, few, many]: readonly [string, string, string], lang: string) {
  const category = new Intl.PluralRules(lang).select(n)
  return category === 'one' ? one : category === 'few' ? few : many
}

/** "październik 2026" from publishTime ("YYYY-MM" or ISO) — stays true, unlike Google's frozen "tydzień temu". */
function reviewDate(review: Review, monthYear: Intl.DateTimeFormat): { text: string; dateTime?: string } | undefined {
  const time = review.publishTime
  if (time) {
    const date = new Date(time.length === 7 ? `${time}-15T12:00:00Z` : time)
    if (!Number.isNaN(date.getTime())) return { text: monthYear.format(date), dateTime: time.slice(0, 7) }
  }
  return review.relativeTime ? { text: review.relativeTime } : undefined
}

/** Five stars; with `label` it is announced as one image ("Ocena 5 na 5"), otherwise hidden from AT. */
function Stars({ value, label, className }: { value: number; label?: string; className?: string }) {
  const full = Math.round(value)
  return (
    <span {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })} className={cn('inline-flex gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} filled={i <= full} width={18} height={18} />
      ))}
    </span>
  )
}

function NavButton({ dir, label, controls, onClick, className }: { dir: -1 | 1; label: string; controls: string; onClick: () => void; className?: string }) {
  const Icon = dir < 0 ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-controls={controls}
      aria-label={label}
      className={cn(
        'z-10 grid size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-caramel text-ink shadow-[0_10px_24px_-10px_rgb(0_0_0/0.6)] transition-transform duration-200 hover:scale-105 focus-visible:outline-cream active:scale-95 sm:size-14',
        className,
      )}
    >
      <Icon width={24} height={24} />
    </button>
  )
}

/**
 * One review visible at a time, all of them in the pre-rendered HTML: slides share one grid cell
 * (card height = tallest slide, so navigating never shifts the layout) and inactive ones are invisible + inert.
 * No autoplay; buttons, arrow keys and swipe navigate.
 */
function ReviewCarousel({ id, items }: { id: string; items: Review[] }) {
  const { site, lang } = useContent()
  const ui = site.ui.reviews
  const monthYear = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' })
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  // Which texts are cut by line-clamp — measured after mount; buttons keep their space while invisible (no CLS).
  const [clamped, setClamped] = useState<boolean[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const refocus = useRef(false)
  const listId = `${id}-list`
  const multi = items.length > 1

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () =>
      setClamped(Array.from(list.querySelectorAll<HTMLElement>('[data-review-text]'), (el) => el.scrollHeight > el.clientHeight + 1))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [])

  // Focus was inside the slide that just became inert — move it to the new slide instead of losing it.
  useEffect(() => {
    if (!refocus.current) return
    refocus.current = false
    ;(listRef.current?.children[index] as HTMLElement | undefined)?.focus()
  }, [index])

  const go = (dir: -1 | 1) => {
    refocus.current = Boolean(listRef.current?.contains(document.activeElement))
    setIndex((i) => (i + dir + items.length) % items.length)
    setExpanded(false)
    trackEngagement('review_navigate', dir < 0 ? 'prev' : 'next')
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!multi || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
    e.preventDefault()
    go(e.key === 'ArrowLeft' ? -1 : 1)
  }
  const onTouchStart = (e: TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e: TouchEvent) => {
    const start = touch.current
    touch.current = null
    if (!start || !multi) return
    const dx = e.changedTouches[0].clientX - start.x
    const dy = e.changedTouches[0].clientY - start.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
  }

  return (
    <div
      role="region"
      aria-roledescription={ui.carouselRole}
      aria-label={ui.carouselLabel}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative flex flex-col items-center px-4 py-14 sm:px-16 md:py-24"
    >
      {/* Arrows sit on the card's left and right edges (as in the reference); on phones they go under it */}
      <div className="relative w-full max-w-xl">
        <div className="rounded-2xl bg-cream p-6 text-center text-ink shadow-[0_28px_60px_-24px_rgb(0_0_0/0.6)] sm:p-9">
          <div className={cn('flex items-center justify-between gap-4', label)}>
            <span className="inline-flex items-center gap-2">
              <GoogleG width={18} height={18} />
              {/* "Google" stays fixed: attribution required for Google reviews */}
              {`${ui.sourcePrefix} Google`}
            </span>
            {multi && (
              <span aria-hidden className="text-ink/70 tabular-nums">
                {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
              </span>
            )}
          </div>

          <div ref={listRef} id={listId} aria-live="polite" className="mt-5 grid">
            {items.map((review, i) => {
              const active = i === index
              const open = active && expanded
              const textId = `${id}-text-${i}`
              const date = reviewDate(review, monthYear)
              return (
                <div
                  key={i}
                  role="group"
                  aria-roledescription={ui.slideRole}
                  aria-label={fmt(ui.slideLabel, { n: i + 1, total: items.length })}
                  inert={!active}
                  tabIndex={-1}
                  className={cn(
                    'col-start-1 row-start-1 flex flex-col duration-500',
                    // Incoming slide is visible (and focusable) at once; the outgoing one hides after its fade-out
                    active ? 'visible opacity-100 transition-opacity' : 'invisible opacity-0 transition-[opacity,visibility]',
                  )}
                >
                  <Stars value={review.rating} label={fmt(ui.ratingLabel, { rating: review.rating })} className="mx-auto text-brand" />
                  <blockquote className="mt-4">
                    <p id={textId} data-review-text className={cn('text-[15px] leading-relaxed font-medium sm:text-lg', !open && 'line-clamp-6')}>
                      {review.text}
                    </p>
                  </blockquote>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={textId}
                    onClick={() => setExpanded(!open)}
                    className={cn(
                      'inline-flex min-h-11 cursor-pointer items-center gap-1 self-center text-brand-deep underline-offset-4 hover:underline',
                      label,
                      !(clamped[i] || open) && 'invisible',
                    )}
                  >
                    {open ? ui.readLess : ui.readMore}
                    <ChevronDown width={14} height={14} className={cn('transition-transform', open && 'rotate-180')} />
                  </button>
                  <div className="mt-auto flex items-center justify-center gap-3 border-t border-ink/10 pt-4 text-left">
                    <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-deep font-display text-lg text-cream">
                      {review.author.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-xl leading-tight tracking-wide text-brand-deep uppercase">
                        {review.authorUrl ? (
                          <SmartLink href={review.authorUrl} location={LOCATION} className="underline-offset-4 hover:underline">
                            {review.author}
                          </SmartLink>
                        ) : (
                          review.author
                        )}
                      </span>
                      {date &&
                        (date.dateTime ? (
                          <time dateTime={date.dateTime} className={cn('mt-0.5 block text-ink/70', label)}>
                            {date.text}
                          </time>
                        ) : (
                          <span className={cn('mt-0.5 block text-ink/70', label)}>{date.text}</span>
                        ))}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {multi && (
          <div className="mt-6 flex justify-center gap-3 sm:contents">
            <NavButton dir={-1} label={ui.previous} controls={listId} onClick={() => go(-1)} className="sm:absolute sm:top-1/2 sm:left-0 sm:-translate-x-1/2 sm:-translate-y-1/2" />
            <NavButton dir={1} label={ui.next} controls={listId} onClick={() => go(1)} className="sm:absolute sm:top-1/2 sm:right-0 sm:translate-x-1/2 sm:-translate-y-1/2" />
          </div>
        )}
      </div>
    </div>
  )
}

/** Hand-drawn brand strokes over the photo (sparkle lines + crown), as in the reference. */
function Doodles() {
  return (
    <svg aria-hidden focusable={false} viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 hidden size-full text-brand-deep sm:block">
      <g fill="none" stroke="currentColor" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round">
        <path d="M245 108l38 52M188 150l58 22M300 64l2 58" />
        <path d="M800 240l28-58 40 50 44-62 30 68 24-42-6 104H806z" />
      </g>
    </svg>
  )
}

export default function Reviews({ section }: SectionProps<'reviews'>) {
  const { site, reviews, lang } = useContent()
  const ui = site.ui.reviews
  const headingId = `${section.id}-title`
  const items = reviews.items.filter((r) => r.rating >= section.minRating).slice(0, section.maxItems)
  const dark = section.tone === 'brand' || section.tone === 'ink'
  const rating = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(reviews.rating)
  // Screen readers hear the whole averageLabel; only the number is visible
  const [beforeRating, afterRating] = ui.averageLabel.split('{rating}')
  return (
    <Section id={section.id} tone={section.tone} labelledBy={headingId}>
      <Container>
        <SectionHeading id={headingId} tone={section.tone} sticker={section.sticker}>
          {section.heading}
        </SectionHeading>

        {items.length > 0 && (
          <Reveal className="mt-12 md:mt-16">
            <div className="relative overflow-hidden rounded-frame bg-ink">
              <Picture
                image={section.backgroundImage}
                sizes="(min-width: 72rem) 1088px, calc(100vw - 2rem)"
                className="absolute inset-0 size-full object-cover object-[50%_40%]"
              />
              <div aria-hidden className="absolute inset-0 bg-ink/15" />
              <Doodles />
              <ReviewCarousel id={section.id} items={items} />
            </div>
            <p className="mx-auto mt-4 max-w-3xl text-center text-xs leading-relaxed">{section.notice}</p>
          </Reveal>
        )}

        <div className="mt-8 flex flex-col items-center gap-6 md:mt-10 md:flex-row md:justify-between">
          <div className="flex items-center gap-4">
            <GoogleG width={36} height={36} className="shrink-0" />
            <p className={cn('font-display text-5xl leading-none sm:text-6xl', headingToneClass[section.tone])}>
              {beforeRating && <span className="sr-only">{beforeRating}</span>}
              {rating}
              {afterRating && <span className="sr-only">{afterRating}</span>}
            </p>
            <div>
              <Stars value={reviews.rating} className={headingToneClass[section.tone]} />
              <p className={cn('mt-1', label)}>{`${reviews.count.toLocaleString(lang)} ${countNoun(reviews.count, ui.countForms, lang)} ${site.ui.sections.reviewCountSource} Google`}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <CtaButton cta={{ label: section.readAllLabel, href: '@reviews', variant: dark ? 'light' : 'primary' }} location={LOCATION} />
            {site.links.writeReview && (
              <CtaButton cta={{ label: section.writeLabel, href: '@writeReview', variant: 'secondary' }} location={LOCATION} withCircle={false} />
            )}
          </div>
        </div>
      </Container>
    </Section>
  )
}
