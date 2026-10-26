import { useLocation } from 'react-router-dom'
import { getPage } from '@/content'
import { cn } from '@/lib/utils'
import { HeaderActions } from './header/HeaderActions'
import { Logo } from './header/Logo'
import { MobileMenu } from './header/MobileMenu'

/** True when the page opens with a hero frame — the header then sits in the frame's notches. */
function startsWithHero(pathname: string): boolean {
  return getPage(pathname)?.sections.find((s) => s.enabled)?.type === 'hero'
}

/**
 * Site header, laid out on the frame grid (--nf-* variables, src/components/layout/frame.ts):
 * logo pill top-left, two round buttons + CTA pill top-right. Over a hero it is absolutely
 * positioned so every item sits exactly inside the hero's SVG notches; elsewhere it is a bar on cream.
 */
export default function Header() {
  const { pathname } = useLocation()
  const framed = startsWithHero(pathname)

  return (
    <header className={cn('z-40 flex items-start justify-between gap-3 p-(--nf-inset)', framed ? 'absolute inset-x-0 top-0' : 'relative')}>
      <Logo location="header" className="h-(--nf-item) w-[calc(var(--nf-left)-var(--nf-gap))]" />
      <HeaderActions menuButton={<MobileMenu />} />
    </header>
  )
}
