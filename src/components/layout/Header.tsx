import { useLocation } from 'react-router-dom'
import { CtaButton, IconLink } from '@/components/ui/Button'
import { Instagram, Phone } from '@/components/ui/icons'
import { SmartLink } from '@/components/ui/SmartLink'
import { getPage, site } from '@/content'
import { cn } from '@/lib/utils'
import { Logo } from './header/Logo'
import { MobileMenu } from './header/MobileMenu'
import { Notch } from './header/Notch'

/** True when the page opens with a hero frame — the header then sits in the frame's corner notches. */
function startsWithHero(pathname: string): boolean {
  return getPage(pathname)?.sections.find((s) => s.enabled)?.type === 'hero'
}

/**
 * Site header. Over a hero it is absolutely positioned so its two cream notches cut into the
 * hero frame's top corners (same inset as the frame); elsewhere it is a plain bar on cream.
 */
export default function Header() {
  const { pathname } = useLocation()
  const framed = startsWithHero(pathname)

  return (
    <header className={cn('z-40 flex items-start justify-between gap-3 px-2 pt-2 lg:px-3 lg:pt-3', framed ? 'absolute inset-x-0 top-0' : 'relative pb-2')}>
      <Notch corner="tl" cut={framed} className="flex items-center gap-4 pr-3 pb-3 lg:pr-4 lg:pb-4 xl:gap-6">
        <Logo location="header" />
        <nav aria-label="Menu główne" className="hidden lg:block">
          <ul className="flex items-center">
            {site.nav.map((link) => (
              <li key={link.href}>
                <SmartLink
                  href={link.href}
                  location="header"
                  className="relative inline-flex h-11 items-center px-2.5 text-xs font-extrabold tracking-[0.14em] uppercase transition-colors after:absolute after:inset-x-2.5 after:bottom-2.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:text-brand-deep hover:after:scale-x-100 xl:px-3.5 xl:after:inset-x-3.5"
                >
                  {link.label}
                </SmartLink>
              </li>
            ))}
          </ul>
        </nav>
      </Notch>

      <Notch corner="tr" cut={framed} className="pb-3 pl-3 lg:pb-4 lg:pl-4">
        <div className="flex h-12 items-center gap-2 lg:h-14">
          <IconLink href="@instagram" label="Instagram" location="header" variant="secondary" className="hidden text-brand-deep hover:bg-brand-deep hover:text-cream hover:border-brand-deep sm:inline-grid">
            <Instagram />
          </IconLink>
          <IconLink href="@phone" label={`Zadzwoń: ${site.contact.phoneDisplay}`} location="header" variant="secondary" className="text-brand-deep hover:bg-brand-deep hover:text-cream hover:border-brand-deep">
            <Phone />
          </IconLink>
          <CtaButton cta={site.header.cta} location="header" className="hidden sm:inline-flex" />
          <MobileMenu className="lg:hidden" />
        </div>
      </Notch>
    </header>
  )
}
