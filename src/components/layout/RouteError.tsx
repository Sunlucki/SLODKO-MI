import { useEffect } from 'react'
import { useRouteError } from 'react-router-dom'

const KEY = 'route-error-reload'

/**
 * Root error element. A client-side navigation can fail when the site was redeployed while the tab was
 * open (stale bundle or data files); a full load of the target URL then fetches the current files.
 * At most one automatic reload per URL and minute, so a page that also fails on a full load cannot loop.
 */
export default function RouteError() {
  const error = useRouteError()

  useEffect(() => {
    if (import.meta.env.DEV) return // keep the error on screen while developing
    try {
      const [at, href] = (sessionStorage.getItem(KEY) ?? '').split(' ')
      if (href === location.href && Date.now() - Number(at) < 60_000) return
      sessionStorage.setItem(KEY, `${Date.now()} ${location.href}`)
    } catch {
      return // without storage the guard cannot work: let the visitor reload by hand
    }
    location.reload()
  }, [error])

  return (
    <main className="grid min-h-svh place-items-center bg-cream px-4 text-center text-ink">
      <div>
        <h1 className="font-display text-4xl text-brand-deep uppercase">Coś poszło nie tak</h1>
        <p className="mt-4">Odśwież stronę, aby spróbować ponownie.</p>
        <button
          type="button"
          onClick={() => location.reload()}
          className="mt-8 inline-flex h-11 cursor-pointer items-center rounded-full bg-brand-deep px-6 text-xs font-extrabold tracking-[0.08em] text-cream uppercase hover:bg-ink"
        >
          Odśwież
        </button>
      </div>
    </main>
  )
}
