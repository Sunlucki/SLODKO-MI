import Magnet from '@/components/Magnet'
import { AiBadge } from '@/components/ui/AiBadge'
import { CtaButton, IconLink } from '@/components/ui/Button'
import { MapPin, SquiggleArrow } from '@/components/ui/icons'
import { Picture } from '@/components/ui/Picture'
import { images, useContent } from '@/content'
import type { ProductT } from '@/content/schema'
import { cn } from '@/lib/utils'
import { Spotlight } from './hero/Spotlight'
import { Ticker } from './hero/Ticker'
import type { SectionProps } from './types'

// CtaButton sizes are fixed; on narrow phones shrink the lg pill + badge so pill, badge and pin share one row.
const compactOnPhones = 'max-sm:[&>span]:h-12 max-sm:[&>span:first-child]:px-6 max-sm:[&>span:last-child]:w-12'

/**
 * Hero: the reference's notched frame (SVG border-image .nf-hero, src/components/layout/frame.ts).
 * The header sits in the two top notches, the spotlight card in the bottom-right one (md+), and the
 * ticker band runs along the bottom edge. Phones read: headline → product note → photo → text + buttons.
 */
export default function Hero({ section }: SectionProps<'hero'>) {
  const { getProduct } = useContent()
  const titleId = `${section.id}-title`
  // Transparent cut-outs float freely; regular photos get a round "plate" crop.
  const cutout = images[section.image.src]?.alpha ?? false
  const spotlight = section.spotlight?.productSlugs.map(getProduct).filter((p): p is ProductT => Boolean(p)) ?? []

  return (
    <section id={section.id} aria-labelledby={titleId} className="relative px-(--nf-inset) pt-(--nf-inset)">
      <div className="nf-hero relative isolate flex flex-col text-cream md:min-h-[48rem] lg:min-h-[clamp(46rem,calc(100svh-2*var(--nf-inset)),60rem)]">
        {/* Soft pink glow behind the product, kept clear of the notches */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[8%] top-[22%] bottom-[18%] -z-10 rounded-full bg-[radial-gradient(closest-side,var(--color-brand),transparent)] opacity-40 lg:inset-x-[30%] lg:top-[12%]"
        />

        <div className="relative grid flex-1 grid-cols-1 content-start px-6 pt-[calc(var(--nf-notch-h)+2rem)] pb-[calc(var(--nf-band)+2.5rem)] md:px-12 md:pb-[calc(var(--nf-card-h)+2rem)] lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:content-stretch lg:gap-x-6 lg:px-16 lg:pt-[calc(var(--nf-notch-h)+3rem)] lg:pb-[calc(var(--nf-band)+3rem)]">
          <h1
            id={titleId}
            className="relative z-20 font-display text-[clamp(3.25rem,15.5vw,4.75rem)] leading-[0.92] tracking-[-0.005em] wrap-anywhere uppercase md:text-[clamp(4rem,10vw,6rem)] lg:col-span-5 lg:row-start-1 lg:text-[clamp(4.25rem,6.6vw,8rem)]"
          >
            {section.headline.map((line, i) => (
              <span key={i} className={cn('block', line.accent && 'text-caramel')}>
                {line.text}{' '}
              </span>
            ))}
          </h1>

          {section.note && (
            <p className="relative z-20 mt-8 mb-16 ml-auto w-fit max-w-[15rem] text-right md:mb-20 lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:mt-4 lg:mb-0 lg:ml-0 lg:max-w-none lg:self-start lg:pl-2 lg:text-left">
              <span className="block font-display text-[1.75rem] leading-none text-caramel uppercase lg:text-[2.125rem]">{section.note.title}</span>
              {section.note.subtitle && <span className="mt-1.5 block text-[0.6875rem] font-extrabold tracking-[0.2em] text-cream uppercase">{section.note.subtitle}</span>}
              <SquiggleArrow className="absolute top-full right-3 mt-5 rotate-[-18deg] text-caramel lg:top-6 lg:right-full lg:mt-0 lg:mr-2 lg:rotate-[-4deg]" />
            </p>
          )}

          {/* lg+: the box spans the frame's full height; the picture is a bit taller than the frame (its height,
              and so its width, follow the viewport), starts just under the top edge and is cut off by the bottom one. */}
          <div className="relative z-10 mx-auto w-full max-w-[20rem] md:max-w-[24rem] lg:absolute lg:top-[calc(-1*(var(--nf-notch-h)+3rem))] lg:-right-6 lg:-bottom-[calc(var(--nf-band)+3rem)] lg:col-span-5 lg:col-start-5 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:flex lg:max-w-none lg:justify-end lg:[clip-path:inset(-50%_-50%_0_-50%)]">
            <div
              className={cn('relative lg:top-[9%] lg:h-[94%] lg:max-w-[38vw] lg:shrink-0', cutout ? 'drop-shadow-2xl drop-shadow-ink/50' : 'aspect-square')}
              style={cutout ? { aspectRatio: `${images[section.image.src]?.width} / ${images[section.image.src]?.height}` } : undefined}
            >
              {!cutout && <span aria-hidden className="absolute -inset-3 rounded-full border-2 border-dashed border-cream/30 lg:-inset-5" />}
              <Picture
                image={section.image}
                sizes="(min-width: 1024px) min(48vw, 75vh), (min-width: 768px) 384px, 320px"
                priority
                className={cn(
                  'relative w-full lg:h-full',
                  cutout ? 'h-auto object-contain object-bottom max-lg:[mask-image:linear-gradient(to_bottom,#000_72%,transparent)]' : 'aspect-square rounded-full object-cover shadow-[0_40px_80px_-30px] shadow-ink/70',
                )}
              />
              {section.image.aiGenerated && <AiBadge className="absolute bottom-4 left-0 lg:bottom-[22%]" />}
            </div>
          </div>

          <div className="relative z-10 mt-10 lg:col-span-5 lg:row-start-2 lg:mt-8 lg:self-end">
            {section.description && <p className="max-w-sm text-base leading-relaxed text-cream/90 lg:text-lg">{section.description}</p>}
            <div className="mt-7 flex flex-wrap items-center gap-2.5 sm:gap-3 lg:mt-9">
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

          {section.aside && (
            <p className="relative z-10 hidden max-w-[17rem] text-sm leading-relaxed text-cream/90 lg:col-span-3 lg:col-start-10 lg:row-start-2 lg:mt-10 lg:block lg:self-start lg:pl-2">
              {section.aside}
            </p>
          )}
        </div>

        {section.ticker.length > 0 && (
          <Ticker
            items={section.ticker}
            className="absolute bottom-0 left-0 flex h-(--nf-band) items-center overflow-hidden rounded-b-[var(--nf-r)] [right:0] md:[right:var(--nf-card-w)]"
          />
        )}
      </div>

      {spotlight.length > 0 && section.spotlight && (
        <div className="relative z-20 mt-(--nf-inset) md:absolute md:right-(--nf-inset) md:bottom-0 md:mt-0 md:h-[calc(var(--nf-card-h)-var(--nf-gap))] md:w-[calc(var(--nf-card-w)-var(--nf-gap))]">
          <Spotlight label={section.spotlight.label} products={spotlight} />
        </div>
      )}
    </section>
  )
}
