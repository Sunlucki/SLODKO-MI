import { useEffect, useRef } from 'react'
import { locales, useContent } from '@/content'
import { cn } from '@/lib/utils'
import { LanguageLinks } from '../languages'
import { roundButton } from './MobileMenu'

/**
 * Round button with the current language ("PL") that opens the list of languages. A native
 * <details>, so it works before the bundle has loaded; after hydration an outside click or Escape closes it.
 */
export function LanguageSwitcher() {
  const { site, locale } = useContent()
  const ref = useRef<HTMLDetailsElement>(null)
  const current = locales.find((l) => l.code === locale) ?? locales[0]

  useEffect(() => {
    const details = ref.current
    if (!details) return
    const onPointer = (e: PointerEvent) => {
      if (details.open && !details.contains(e.target as Node)) details.open = false
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !details.open) return
      details.open = false
      details.querySelector('summary')?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <details ref={ref} className="relative">
      <summary className={cn(roundButton, 'list-none text-xs font-extrabold tracking-[0.08em] [&::-webkit-details-marker]:hidden')}>
        <span className="sr-only">{site.ui.common.language} </span>
        {current.short}
      </summary>
      <LanguageLinks
        className="absolute top-full right-0 z-50 mt-2 w-max min-w-44 rounded-2xl bg-cream p-1.5 text-ink shadow-xl ring-1 shadow-ink/25 ring-ink/10"
        linkClassName="flex min-h-11 items-center justify-between gap-6 rounded-xl px-3 text-sm font-semibold transition-colors hover:bg-blush aria-[current=page]:font-extrabold aria-[current=page]:text-brand-deep"
      />
    </details>
  )
}
