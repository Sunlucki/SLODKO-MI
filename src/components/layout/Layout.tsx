import { useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import antonLatin from '@/assets/fonts/anton-latin.woff2?url'
import antonPl from '@/assets/fonts/anton-pl.woff2?url'
import CookieBanner from '@/components/consent/CookieBanner'
import { site } from '@/content'
import { trackPageView } from '@/lib/analytics'
import Footer from './Footer'
import { frameCss } from './frame'
import Header from './Header'

/** Injects theme colours from site.json as CSS variables (SSR, no flash). */
function ThemeStyle() {
  const c = site.theme.colors
  const css =
    `:root{--c-cream:${c.cream};--c-ink:${c.ink};--c-brand:${c.brand};--c-brand-deep:${c.brandDeep};--c-blush:${c.blush};--c-caramel:${c.caramel}}` +
    frameCss(c)
  return (
    <Head>
      <html lang="pl" />
      <style>{css}</style>
      <meta name="theme-color" content={c.brandDeep} />
      {/* Display font of the LCP headline (Polish letters live in the second file) */}
      <link rel="preload" as="font" type="font/woff2" href={antonLatin} crossOrigin="" />
      <link rel="preload" as="font" type="font/woff2" href={antonPl} crossOrigin="" />
    </Head>
  )
}

/** Scroll position of each history entry (React Router's history.state.idx), restored on Back/Forward */
const positions = new Map<number, number>()
const entryIndex = (): number | undefined => (window.history.state as { idx?: number } | null)?.idx

/** Off-screen sections only have a placeholder height (content-visibility: auto); render them so offsets are exact. */
function renderAllSections() {
  document.querySelectorAll<HTMLElement>('main > section, main ~ footer').forEach((section) => (section.style.contentVisibility = 'visible'))
}

/** Restore the position on Back/Forward, else scroll to the #hash target (and focus it) or to the top; report page views. */
function ScrollManager() {
  const { pathname, hash, key } = useLocation()
  const navigationType = useNavigationType()
  const hydrated = useRef(false)
  const tracking = useRef(true)

  useEffect(() => {
    const save = () => {
      const idx = entryIndex()
      if (tracking.current && idx !== undefined) positions.set(idx, window.scrollY)
    }
    // Until React has swapped the page, scrolling belongs to the outgoing page and must not be saved for the new entry
    const pause = () => (tracking.current = false)
    // The browser's own restoration would land after React's swap and override the saved position. Full page loads
    // (reload, returning from another site) keep the native restoration.
    const manual = () => (window.history.scrollRestoration = 'manual')
    const native = () => (window.history.scrollRestoration = 'auto')
    save()
    manual()
    window.addEventListener('scroll', save, { passive: true })
    window.addEventListener('popstate', pause)
    window.addEventListener('pagehide', native)
    window.addEventListener('pageshow', manual)
    return () => {
      window.removeEventListener('scroll', save)
      window.removeEventListener('popstate', pause)
      window.removeEventListener('pagehide', native)
      window.removeEventListener('pageshow', manual)
      native()
    }
  }, [])

  // Layout effect: runs before the new page paints and before the scroll events of the swap are dispatched
  useLayoutEffect(() => {
    tracking.current = true
    // On the first (hydration) run keep the browser's own position: the visitor may already have scrolled
    if (!hydrated.current) {
      hydrated.current = true
      return
    }
    const idx = entryIndex()
    const saved = navigationType === 'POP' && idx !== undefined ? positions.get(idx) : undefined
    if (saved !== undefined) {
      renderAllSections()
      window.scrollTo({ top: saved, behavior: 'instant' })
      return
    }
    const el = hash && document.getElementById(decodeURIComponent(hash.slice(1)))
    if (!el) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    // No explicit behavior: the CSS scroll-behavior is smooth, or instant with prefers-reduced-motion.
    // Re-aim once in case images or fonts changed the layout meanwhile.
    renderAllSections()
    el.scrollIntoView({ block: 'start' })
    // Continue keyboard navigation from the target, as a native in-page link does
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
    const id = setTimeout(() => {
      const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
      if (Math.abs(el.getBoundingClientRect().top - margin) > 8) el.scrollIntoView({ block: 'start' })
    }, 800)
    return () => clearTimeout(id)
    // key: a click on a link to the current URL is a new navigation with the same pathname and hash
  }, [pathname, hash, key, navigationType])
  useEffect(() => {
    // Wait a frame so <Head> has updated document.title
    const id = requestAnimationFrame(() => trackPageView(pathname, document.title))
    return () => cancelAnimationFrame(id)
  }, [pathname])
  return null
}

export default function Layout() {
  return (
    <>
      <ThemeStyle />
      <a
        href="#main"
        className="sr-only z-[100] rounded-full bg-ink px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Przejdź do treści
      </a>
      {/* Fixed at the bottom, but first in the DOM: keyboard and screen-reader users meet it before the content it covers */}
      <CookieBanner />
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Footer />
      <ScrollManager />
    </>
  )
}
