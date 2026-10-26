import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import antonLatin from '@/assets/fonts/anton-latin.woff2?url'
import antonPl from '@/assets/fonts/anton-pl.woff2?url'
import CookieBanner from '@/components/consent/CookieBanner'
import { site } from '@/content'
import { trackPageView } from '@/lib/analytics'
import Footer from './Footer'
import Header from './Header'

/** Injects theme colours from site.json as CSS variables (SSR, no flash). */
function ThemeStyle() {
  const c = site.theme.colors
  const css = `:root{--c-cream:${c.cream};--c-ink:${c.ink};--c-brand:${c.brand};--c-brand-deep:${c.brandDeep};--c-blush:${c.blush};--c-caramel:${c.caramel}}`
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

/** Scroll to #hash targets after navigation, otherwise to top; report page views. */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  const hydrated = useRef(false)
  useEffect(() => {
    // On the first (hydration) run keep the browser's own position: the visitor may already have scrolled
    if (!hydrated.current) {
      hydrated.current = true
      return
    }
    const el = hash && document.getElementById(decodeURIComponent(hash.slice(1)))
    if (!el) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    // Off-screen sections only have a placeholder height (content-visibility: auto); render them first so the
    // target position is exact, then re-aim once in case images or fonts changed the layout meanwhile
    document.querySelectorAll<HTMLElement>('main > section, main ~ footer').forEach((section) => (section.style.contentVisibility = 'visible'))
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const id = setTimeout(() => {
      const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
      if (Math.abs(el.getBoundingClientRect().top - margin) > 8) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 800)
    return () => clearTimeout(id)
  }, [pathname, hash])
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
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Footer />
      <CookieBanner />
      <ScrollManager />
    </>
  )
}
