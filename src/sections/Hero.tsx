import Magnet from '@/components/Magnet'
import { Notch } from '@/components/layout/header/Notch'
import { CtaButton, IconLink } from '@/components/ui/Button'
import { MapPin, SquiggleArrow } from '@/components/ui/icons'
import { Picture } from '@/components/ui/Picture'
import { getProduct, images } from '@/content'
import type { ProductT } from '@/content/schema'
import { cn } from '@/lib/utils'
import { Spotlight } from './hero/Spotlight'
import { Ticker } from './hero/Ticker'
import type { SectionProps } from './types'

// CtaButton sizes are fixed; on narrow phones shrink the lg pill + badge so pill, badge and pin share one row.
const compactOnPhones = 'max-sm:[&>span]:h-12 max-sm:[&>span:first-child]:px-6 max-sm:[&>span:last-child]:w-12'

/**
 * Hero frame: brand-deep panel inset from the viewport whose corners are "notched" —
 * the header sits in the top two (see Header), the spotlight card in the bottom-right one.
 */
export default function Hero({ section }: SectionProps<'hero'>) {
  const titleId = `${section.id}-title`
  // Transparent cut-outs float freely; regular photos get a round "plate" crop.
  const cutout = images[section.image.src]?.alpha ?? false
  const spotlight = section.spotlight?.productSlugs.map(getProduct).filter((p): p is ProductT => Boolean(p)) ?? []

  return (
    <section id={section.id} aria-labelledby={titleId} className="px-2 pt-2 lg:px-3 lg:pt-3">
      <div className="relative isolate flex flex-col overflow-hidden rounded-frame bg-brand-deep text-cream md:min-h-[46rem] lg:min-h-[max(44rem,calc(100svh-1.5rem))]">
        {/* Soft pink glow behind the product */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-[62%] left-1/2 -z-10 aspect-square w-[150%] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,var(--color-brand),transparent)] opacity-45 md:top-1/2 md:left-3/4 md:w-[70%] lg:left-[58%] lg:w-[60%]"
        />

        <div className="grid flex-1 items-center gap-y-10 px-5 pt-24 pb-10 md:grid-cols-2 md:gap-x-8 md:px-10 md:pt-32 md:pb-12 lg:grid-cols-12 lg:gap-x-6 lg:px-14 lg:pt-36 lg:pb-28">
          <div className="relative z-10 md:row-span-2 lg:col-span-5 lg:row-span-1">
            <h1 id={titleId} className="font-display text-[clamp(3.25rem,15.5vw,4.75rem)] leading-[0.92] tracking-[-0.005em] uppercase md:text-[clamp(3.25rem,7.8vw,5.5rem)] lg:text-[clamp(4rem,6.4vw,7.5rem)]">
              {section.headline.map((line, i) => (
                <span key={i} className={cn('block', line.accent && 'text-caramel')}>
                  {line.text}{' '}
                </span>
              ))}
            </h1>
            {section.description && <p className="mt-6 max-w-sm text-base leading-relaxed text-cream/90 lg:mt-8 lg:text-lg">{section.description}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-2.5 sm:gap-3 lg:mt-10">
              <Magnet padding={70} magnetStrength={5} maxOffset={14}>
                <CtaButton cta={section.primaryCta} location="hero" size="lg" className={compactOnPhones} />
              </Magnet>
              {section.secondaryCta && (
                <IconLink href={section.secondaryCta.href} label={section.secondaryCta.label} location="hero" variant={section.secondaryCta.variant} className="size-12 sm:size-14">
                  <MapPin width={22} height={22} />
                </IconLink>
              )}
            </div>
          </div>

          {/* lg: right column with the note on top and the aside below; smaller screens: note sits above the image */}
          <div className="contents lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:flex lg:flex-col lg:justify-between lg:gap-10 lg:self-stretch lg:pb-16">
            {section.note && (
              <p className="relative z-10 w-56 justify-self-end text-right md:self-end lg:w-auto lg:self-start lg:text-left">
                <span className="block font-display text-[1.75rem] leading-none text-caramel uppercase lg:text-[2rem]">{section.note.title}</span>
                {section.note.subtitle && <span className="mt-1.5 block text-[0.6875rem] font-extrabold tracking-[0.2em] text-cream uppercase">{section.note.subtitle}</span>}
                <SquiggleArrow className="mt-2 ml-auto rotate-[-8deg] text-caramel lg:mt-4 lg:ml-0 lg:rotate-[-32deg]" />
              </p>
            )}
            {section.aside && <p className="relative z-10 hidden max-w-[17rem] self-end text-sm leading-relaxed text-cream/90 lg:block">{section.aside}</p>}
          </div>

          <div
            className={cn(
              'relative z-10 mx-auto w-full max-w-[19rem] md:max-w-none lg:col-span-4 lg:col-start-6 lg:row-start-1 lg:-mb-28 lg:-ml-[6%] lg:w-[112%] lg:translate-y-10 lg:self-end',
              section.note && '-mt-6 md:mt-0',
              spotlight.length > 0 && 'md:mb-36', // keep clear of the spotlight notch
            )}
          >
            <div className={cn('relative', !cutout && 'aspect-square')}>
              {!cutout && <span aria-hidden className="absolute -inset-3 rounded-full border-2 border-dashed border-cream/30 lg:-inset-5" />}
              <Picture
                image={section.image}
                sizes="(min-width: 1024px) 34vw, (min-width: 768px) 45vw, 304px"
                priority
                className={cn(
                  'relative w-full',
                  cutout ? 'h-auto object-contain drop-shadow-2xl drop-shadow-ink/50' : 'aspect-square rounded-full object-cover shadow-[0_40px_80px_-30px] shadow-ink/70',
                )}
              />
            </div>
          </div>
        </div>

        {spotlight.length > 0 && section.spotlight && (
          <Notch
            corner="br"
            cutClassName="hidden md:block"
            className="relative z-20 mx-3 mb-3 rounded-2xl p-4 text-ink md:absolute md:right-0 md:bottom-0 md:m-0 md:w-[22rem] md:rounded-none md:rounded-tl-[var(--r)] md:pt-4 md:pr-4 md:pb-3 md:pl-5 lg:w-[24rem] lg:pt-5 lg:pr-5 lg:pl-6"
          >
            <Spotlight label={section.spotlight.label} products={spotlight} />
          </Notch>
        )}

        {section.ticker.length > 0 && <Ticker items={section.ticker} className="relative flex h-14 shrink-0 items-center lg:h-16" />}
      </div>
    </section>
  )
}
