import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown } from '@/components/ui/icons'
import { SmartLink } from '@/components/ui/SmartLink'
import { useContent } from '@/content'
import { CONSENT_OPEN_EVENT, getConsent, initTracking, replayEarlyClicks, trackingConfigured, updateConsent, type Consent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

const NONE: Consent = { analytics: false, marketing: false }
const ALL: Consent = { analytics: true, marketing: true }

// Accept and reject share one style on purpose: GDPR requires equal prominence.
const choiceButton =
  'inline-flex min-h-11 items-center justify-center rounded-full bg-brand-deep px-3 py-2 text-center text-xs leading-tight font-extrabold tracking-[0.08em] text-cream uppercase transition-colors hover:bg-ink focus-visible:outline-ink'

/**
 * Consent banner (Consent Mode v2 + Meta/TikTok consent). Rendered only after mount, so the
 * pre-rendered HTML never contains it (no hydration mismatch); fixed position, so no layout shift.
 * Shown unprompted only when a pixel ID is configured; reopened by ConsentSettingsButton through a window event.
 * Works at any place in the DOM; early in the document puts it first in the keyboard and screen-reader order.
 */
export default function CookieBanner() {
  const t = useContent().site.consent
  const id = useId()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [choice, setChoice] = useState<Consent>(NONE)
  const [focusRequest, setFocusRequest] = useState(0)
  const dialog = useRef<HTMLDivElement>(null)
  // Set when the visitor reopened the banner: they already decided, so Escape may close it unchanged
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    initTracking()
    // Mounted on every page, so this mount effect marks the end of hydration
    replayEarlyClicks()
    // Nothing to consent to while no pixel ID is configured; the footer button still opens it
    if (trackingConfigured && !getConsent()) setOpen(true)
    const reopen = () => {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : document.body
      setChoice(getConsent() ?? NONE)
      setExpanded(true)
      setOpen(true)
      setFocusRequest((n) => n + 1)
    }
    window.addEventListener(CONSENT_OPEN_EVENT, reopen)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen)
  }, [])

  useEffect(() => {
    if (focusRequest) dialog.current?.focus()
  }, [focusRequest])

  // While open, nothing focused may hide behind the banner (WCAG 2.4.11): scroll-padding makes the browser scroll
  // focused elements above it, and the same body padding lets the end of the page scroll clear of it
  useEffect(() => {
    const el = dialog.current
    if (!open || !el) return
    const root = document.documentElement
    const observer = new ResizeObserver(() => {
      // Height plus the gap to the viewport edge, twice (offsetHeight ignores the entry transform)
      const space = `${el.offsetHeight + 2 * parseFloat(getComputedStyle(el).bottom)}px`
      root.style.scrollPaddingBottom = space
      document.body.style.paddingBottom = space
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      root.style.scrollPaddingBottom = ''
      document.body.style.paddingBottom = ''
    }
  }, [open])

  const close = () => {
    setOpen(false)
    setExpanded(false)
    returnFocus.current?.focus()
    returnFocus.current = null
  }

  const save = (next: Consent) => {
    updateConsent(next)
    close()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    // Escape never decides for the visitor: it closes the reopened banner unchanged or collapses the settings
    if (returnFocus.current && getConsent()) close()
    else if (expanded) setExpanded(false)
    else return
    e.stopPropagation()
  }

  if (!open) return null

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-text`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-h-[calc(100dvh-1.5rem)] max-w-lg overflow-y-auto rounded-2xl bg-cream p-5 text-ink shadow-2xl ring-1 shadow-ink/30 ring-ink/10 transition duration-300 outline-none starting:translate-y-6 starting:opacity-0 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[26rem] sm:p-6"
    >
      <h2 id={`${id}-title`} className="font-display text-xl leading-tight text-brand-deep uppercase sm:text-2xl">
        {t.title}
      </h2>
      <p id={`${id}-text`} className="mt-2 text-sm leading-relaxed">
        {t.text}{' '}
        <SmartLink href={t.policyHref} location="cookie_banner" className="rounded-sm font-bold underline underline-offset-4 hover:text-brand-deep focus-visible:outline-ink">
          {t.policyLabel}
        </SmartLink>
      </p>

      {expanded && (
        <div id={`${id}-settings`} className="mt-4 space-y-2">
          {(['analytics', 'marketing'] as const).map((key) => (
            <label key={key} className="relative flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl p-3 ring-1 ring-ink/15">
              <span className="text-sm">
                <span id={`${id}-${key}-label`} className="block font-extrabold">
                  {t[`${key}Label`]}
                </span>
                <span id={`${id}-${key}-text`} className="mt-0.5 block text-xs leading-snug text-ink/80">
                  {t[`${key}Text`]}
                </span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={choice[key]}
                onChange={(e) => setChoice((c) => ({ ...c, [key]: e.target.checked }))}
                aria-labelledby={`${id}-${key}-label`}
                aria-describedby={`${id}-${key}-text`}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="relative h-7 w-12 shrink-0 rounded-full bg-ink/55 transition-colors peer-checked:bg-brand-deep peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-cream after:transition-transform peer-checked:after:translate-x-5"
              />
            </label>
          ))}
          <button
            type="button"
            onClick={() => save(choice)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-xs font-extrabold tracking-[0.08em] text-brand-deep uppercase ring-2 ring-brand-deep transition-colors ring-inset hover:bg-brand-deep hover:text-cream focus-visible:outline-ink"
          >
            {t.save}
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className={choiceButton} onClick={() => save(NONE)}>
          {t.rejectAll}
        </button>
        <button type="button" className={choiceButton} onClick={() => save(ALL)}>
          {t.acceptAll}
        </button>
      </div>
      <div className="mt-1 flex justify-center text-sm">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={expanded ? `${id}-settings` : undefined}
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex min-h-11 items-center gap-1 rounded-sm font-bold underline underline-offset-4 hover:text-brand-deep focus-visible:outline-ink"
        >
          {t.settings}
          <ChevronDown width={16} height={16} className={cn('transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>
    </div>
  )
}
