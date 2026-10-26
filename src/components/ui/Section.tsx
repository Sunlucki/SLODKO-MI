import type { ReactNode } from 'react'
import type { ToneT } from '@/content/schema'
import { cn } from '@/lib/utils'

export const toneClass: Record<ToneT, string> = {
  cream: 'bg-cream text-ink',
  blush: 'bg-blush text-ink',
  brand: 'bg-brand-deep text-cream',
  ink: 'bg-ink text-cream',
  caramel: 'bg-caramel text-ink',
}

/** Heading colour that keeps contrast on each tone (brand pink only on light backgrounds, large text). */
export const headingToneClass: Record<ToneT, string> = {
  cream: 'text-brand-deep',
  blush: 'text-brand-deep',
  brand: 'text-cream',
  ink: 'text-cream',
  caramel: 'text-brand-deep',
}

interface SectionProps {
  id: string
  tone?: ToneT
  className?: string
  /** id of the heading element for aria-labelledby */
  labelledBy?: string
  children: ReactNode
}

/** Outer wrapper for every content section: anchor id, tone colours, vertical rhythm. */
export function Section({ id, tone = 'cream', className, labelledBy, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn('relative scroll-mt-24 py-20 md:py-28', toneClass[tone], className)}>
      {children}
    </section>
  )
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>
}

/** Tilted caramel tag, positioned by the parent (e.g. top-right of a heading). */
export function Sticker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'pointer-events-none inline-block rotate-[10deg] rounded-full bg-caramel px-3 py-1 font-sans text-[10px] font-extrabold tracking-[0.12em] whitespace-nowrap text-ink uppercase shadow-[0_6px_16px_-6px_rgb(0_0_0/0.35)] sm:text-[11px]',
        className,
      )}
    >
      {children}
    </span>
  )
}

interface HeadingProps {
  id: string
  tone?: ToneT
  sticker?: string
  as?: 'h1' | 'h2'
  className?: string
  children: ReactNode
}

/** Big condensed display heading with an optional sticker on its top-right corner. */
export function SectionHeading({ id, tone = 'cream', sticker, as: Tag = 'h2', className, children }: HeadingProps) {
  return (
    <div className="relative mx-auto w-fit max-w-full text-center">
      <Tag id={id} className={cn('font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.95] tracking-tight uppercase', headingToneClass[tone], className)}>
        {children}
      </Tag>
      {sticker && <Sticker className="absolute -top-5 right-0 sm:-top-6 sm:translate-x-1/4">{sticker}</Sticker>}
    </div>
  )
}
