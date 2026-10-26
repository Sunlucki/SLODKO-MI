import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import antonLatinExt from '@fontsource/anton/files/anton-latin-ext-400-normal.woff2?url'
import antonLatin from '@fontsource/anton/files/anton-latin-400-normal.woff2?url'
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
      {/* Display font of the LCP headline (Polish glyphs need both subsets) */}
      <link rel="preload" as="font" type="font/woff2" href={antonLatin} crossOrigin="" />
      <link rel="preload" as="font" type="font/woff2" href={antonLatinExt} crossOrigin="" />
    </Head>
  )
}

/** Scroll to #hash targets after navigation, otherwise to top; report page views. */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0 })
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
