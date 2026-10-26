import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { localizePath, locales, stripLocale, useContent } from '@/content'

/** Read by the auto-detect script in Layout: an explicit choice always wins over the browser language. */
const STORAGE_KEY = 'slodkomi-lang'

function remember(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // Storage blocked: the URL still carries the choice for this visit
  }
}

/**
 * The current page in every language. Plain links: switching is a full load of that language's
 * pre-rendered page. The #hash is added after hydration only, as the pre-rendered HTML has none.
 */
function useLanguageLinks() {
  const { locale } = useContent()
  const { pathname, hash } = useLocation()
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  const path = stripLocale(pathname).replace(/([^/])$/, '$1/')
  const base = import.meta.env.BASE_URL.slice(0, -1)
  return locales.map((l) => ({ ...l, current: l.code === locale, href: base + localizePath(path + (hydrated ? hash : ''), l.code) }))
}

interface Props {
  className?: string
  linkClassName: string
  /** Show the short code ("PL") after the language name */
  withShort?: boolean
}

/** Language list (header popover, menu overlay, footer); the current language has aria-current. */
export function LanguageLinks({ className, linkClassName, withShort = true }: Props) {
  const links = useLanguageLinks()
  return (
    <ul className={className}>
      {links.map((l) => (
        <li key={l.code}>
          <a
            href={l.href}
            hrefLang={l.htmlLang}
            lang={l.htmlLang}
            aria-current={l.current ? 'page' : undefined}
            onClick={() => remember(l.code)}
            className={linkClassName}
          >
            {l.label}
            {withShort && (
              <span aria-hidden className="text-[0.6875rem] font-extrabold tracking-[0.12em] opacity-80">
                {l.short}
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}
