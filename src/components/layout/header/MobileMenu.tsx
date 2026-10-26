import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CtaButton, IconLink } from '@/components/ui/Button'
import { Close, Facebook, Instagram, Menu, Phone } from '@/components/ui/icons'
import { SmartLink } from '@/components/ui/SmartLink'
import { site } from '@/content'
import { trackEngagement } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { Notch } from './Notch'

const roundButton =
  'inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-brand-deep text-cream transition-colors duration-200 hover:bg-ink focus-visible:ring-4 focus-visible:ring-caramel focus-visible:outline-none'

/** Menu button (below lg) + full-screen dialog drawn as the hero frame: focus trap, Escape, scroll lock. */
export function MobileMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const { pathname, hash } = useLocation()
  const id = useId()

  useEffect(() => setOpen(false), [pathname, hash])

  // Layout effect: the scroll lock is released before ScrollManager scrolls to a #hash target.
  useLayoutEffect(() => {
    if (!open) return
    const root = document.documentElement
    const overflow = root.style.overflow
    root.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return setOpen(false)
      if (e.key !== 'Tab' || !dialogRef.current) return
      const items = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button')
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    // The dialog is lg:hidden — close it (and release the lock) when e.g. a tablet rotates past lg
    const desktop = window.matchMedia('(min-width: 64rem)')
    const onDesktop = () => desktop.matches && setOpen(false)
    document.addEventListener('keydown', onKey)
    desktop.addEventListener('change', onDesktop)
    return () => {
      document.removeEventListener('keydown', onKey)
      desktop.removeEventListener('change', onDesktop)
      root.style.overflow = overflow
      buttonRef.current?.focus({ preventScroll: true })
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Otwórz menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen(true)
          trackEngagement('open_menu')
        }}
        className={cn(roundButton, className)}
      >
        <Menu />
      </button>

      {open && (
        <div
          ref={dialogRef}
          id={id}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-cream p-2 transition-opacity duration-300 starting:opacity-0 lg:hidden"
        >
          <div className="relative flex min-h-full flex-col rounded-frame bg-brand-deep px-6 pt-28 pb-8 text-cream transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] starting:translate-y-6">
            <Notch corner="tl" className="absolute top-0 left-0 pr-3 pb-3">
              <Logo location="menu" onClick={close} />
            </Notch>
            <Notch corner="tr" className="absolute top-0 right-0 pb-3 pl-3">
              <div className="flex h-12 items-center">
                <button ref={closeRef} type="button" aria-label="Zamknij menu" onClick={close} className={roundButton}>
                  <Close />
                </button>
              </div>
            </Notch>

            <nav aria-label="Menu główne">
              <ul className="flex flex-col gap-1">
                {site.nav.map((link, i) => (
                  <li key={link.href}>
                    <SmartLink
                      href={link.href}
                      location="menu"
                      onClick={close}
                      className="group flex items-baseline gap-3 py-1 font-display text-[clamp(2.75rem,13vw,4.5rem)] leading-[1.05] uppercase transition-colors hover:text-caramel"
                    >
                      <span aria-hidden className="font-sans text-xs font-extrabold tracking-[0.2em] text-caramel">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {link.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-auto flex flex-col gap-8 pt-12">
              <div className="flex flex-wrap items-center gap-2">
                <CtaButton cta={{ ...site.header.cta, variant: 'light' }} location="menu" size="lg" />
              </div>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <address className="text-sm leading-relaxed text-cream/90 not-italic">
                  {site.address.street}
                  <br />
                  {site.address.postalCode} {site.address.city}
                  <br />
                  <span className="font-bold text-cream">{site.address.entranceNote}</span>
                </address>
                <div className="flex gap-2">
                  <IconLink href="@instagram" label="Instagram" location="menu">
                    <Instagram />
                  </IconLink>
                  {site.links.facebook && (
                    <IconLink href="@facebook" label="Facebook" location="menu">
                      <Facebook />
                    </IconLink>
                  )}
                  <IconLink href="@phone" label={`Zadzwoń: ${site.contact.phoneDisplay}`} location="menu">
                    <Phone />
                  </IconLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
