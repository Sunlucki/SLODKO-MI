import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CtaButton, IconLink } from '@/components/ui/Button'
import { Close, Facebook, Instagram, Menu, Phone } from '@/components/ui/icons'
import { SmartLink } from '@/components/ui/SmartLink'
import { site } from '@/content'
import { trackEngagement } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { HeaderActions } from './HeaderActions'
import { Logo } from './Logo'

const roundButton =
  'inline-grid size-(--nf-item) shrink-0 cursor-pointer place-items-center rounded-full bg-brand-deep text-cream transition-colors duration-200 hover:bg-ink'

/**
 * Menu button + full-screen dialog drawn as the same SVG frame as the hero (.nf-menu): the logo and
 * the close button sit exactly where the header's logo and menu button were. Focus trap, Escape, scroll lock.
 */
export function MobileMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  // Set when a menu link closes the dialog: focus then goes to the link target (ScrollManager), not back to the button
  const followedLink = useRef(false)
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
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      root.style.overflow = overflow
      if (!followedLink.current) buttonRef.current?.focus({ preventScroll: true })
      followedLink.current = false
    }
  }, [open])

  const close = () => setOpen(false)
  const follow = () => {
    followedLink.current = true
    close()
  }

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
          className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-cream p-(--nf-inset) transition-opacity duration-300 starting:opacity-0"
        >
          <div className="nf-menu relative flex min-h-full flex-col px-6 pt-[calc(var(--nf-item)+var(--nf-gap)+2.5rem)] pb-8 text-cream transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] starting:translate-y-6 md:px-10 lg:px-14">
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3">
              <Logo location="menu" onClick={follow} className="h-(--nf-item) w-[calc(var(--nf-left)-var(--nf-gap))]" />
              <HeaderActions
                menuButton={
                  <button ref={closeRef} type="button" aria-label="Zamknij menu" onClick={close} className={roundButton}>
                    <Close />
                  </button>
                }
              />
            </div>

            <nav aria-label="Menu główne">
              <ul className="flex flex-col gap-1">
                {site.nav.map((link, i) => (
                  <li key={link.href}>
                    <SmartLink
                      href={link.href}
                      location="menu"
                      onClick={follow}
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
