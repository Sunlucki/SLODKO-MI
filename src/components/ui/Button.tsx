import type { ReactNode } from 'react'
import type { CtaT, ProductT } from '@/content/schema'
import { cn } from '@/lib/utils'
import { ArrowUpRight } from './icons'
import { SmartLink } from './SmartLink'

const pill = {
  primary: 'bg-brand-deep text-cream hover:bg-ink',
  light: 'bg-cream text-brand-deep hover:bg-white',
  secondary: 'bg-transparent text-current ring-2 ring-inset ring-current hover:bg-current/10',
} as const

const circle = {
  primary: 'bg-brand-deep text-cream group-hover:bg-ink',
  light: 'bg-cream text-brand-deep group-hover:bg-white',
  secondary: 'text-current ring-2 ring-inset ring-current',
} as const

interface CtaProps {
  cta: CtaT
  location: string
  product?: ProductT
  size?: 'sm' | 'md' | 'lg'
  /** Pill + attached round arrow badge (signature button from the design) */
  withCircle?: boolean
  className?: string
}

/** Content-driven CTA: pill button with an optional round arrow "satellite", like in the reference design. */
export function CtaButton({ cta, location, product, size = 'md', withCircle = true, className }: CtaProps) {
  const sizes = {
    sm: { pill: 'h-9 px-4 text-[11px]', circle: 'size-9', icon: 14 },
    md: { pill: 'h-11 px-6 text-xs', circle: 'size-11', icon: 16 },
    lg: { pill: 'h-14 px-8 text-sm', circle: 'size-14', icon: 20 },
  }[size]
  return (
    <SmartLink
      href={cta.href}
      location={location}
      product={product}
      className={cn('group inline-flex items-center gap-1 font-sans font-extrabold tracking-[0.08em] uppercase focus-visible:outline-none', className)}
    >
      <span
        className={cn(
          'inline-flex items-center rounded-full transition-colors duration-200 group-focus-visible:ring-4 group-focus-visible:ring-caramel',
          sizes.pill,
          pill[cta.variant],
        )}
      >
        {cta.label}
      </span>
      {withCircle && (
        <span
          aria-hidden
          className={cn(
            'inline-grid place-items-center rounded-full transition-[transform,background-color] duration-300 group-hover:rotate-45',
            sizes.circle,
            circle[cta.variant],
          )}
        >
          <ArrowUpRight width={sizes.icon} height={sizes.icon} />
        </span>
      )}
    </SmartLink>
  )
}

interface IconLinkProps {
  href: string
  label: string
  location: string
  children: ReactNode
  variant?: keyof typeof circle
  className?: string
}

/** Round icon-only link (header shortcuts, hero secondary CTA). `label` is the accessible name. */
export function IconLink({ href, label, location, children, variant = 'light', className }: IconLinkProps) {
  return (
    <SmartLink
      href={href}
      location={location}
      aria-label={label}
      title={label}
      className={cn(
        'group inline-grid size-11 place-items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-caramel',
        circle[variant],
        className,
      )}
    >
      {children}
    </SmartLink>
  )
}
