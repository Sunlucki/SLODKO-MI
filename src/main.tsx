import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './routes'
import './styles/globals.css'

if (typeof window !== 'undefined') {
  // The host also serves /<path>/index.html, which the router does not know (it would swap the page for the 404 view)
  const { pathname, search, hash } = window.location
  if (pathname.endsWith('/index.html')) window.history.replaceState(window.history.state, '', pathname.slice(0, -'index.html'.length) + search + hash)
  // No route has a loader, yet vite-react-ssg gives each one a loader that fetches a per-build manifest on the first
  // client-side navigation. An empty manifest skips that request, so a tab opened before a redeploy keeps working.
  window.__VITE_REACT_SSG_STATIC_LOADER_MANIFEST__ = {}
}

// In production this bundle is requested only after the first paint (see deferAppScript in
// scripts/postbuild.ts), so hydration never delays the LCP.
export const createRoot = ViteReactSSG({ routes, basename: import.meta.env.BASE_URL })
