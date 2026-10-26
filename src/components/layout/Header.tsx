import { useLocation } from 'react-router-dom'
import { stripLocale, useContent, type Localized } from '@/content'
import { cn } from '@/lib/utils'
import { HeaderActions } from './header/HeaderActions'
import { LanguageSwitcher } from './header/LanguageSwitcher'
import { Logo } from './header/Logo'
import { MobileMenu } from './header/MobileMenu'

/** True when the page opens with a hero frame — the header then sits in the frame's notches. */
function startsWithHero(c: Localized, pathname: string): boolean {
  return c.getPage(stripLocale(pathname))?.sections.find((s) => s.enabled)?.type === 'hero'
}

/**
 * Site header, laid out on the frame grid (--nf-* variables, src/components/layout/frame.ts):
 * logo pill top-left, two round buttons + CTA pill top-right. Over a hero it is absolutely
 * positioned so every item sits exactly inside the hero's SVG notches; elsewhere it is a bar on cream.
 */
export default function Header() {
  const { pathname } = useLocation()
  const c = useContent()
  const framed = startsWithHero(c, pathname)

  return (
    <header className={cn('z-40 flex items-start justify-between gap-3 p-(--nf-inset)', framed ? 'absolute inset-x-0 top-0' : 'relative')}>
      <Logo location="header" className="h-(--nf-item) w-[calc(var(--nf-left)-var(--nf-gap))]" />
      <HeaderActions lead={<LanguageSwitcher />} menuButton={<MobileMenu />} />
    </header>
  )
}
