import CurvedLoop from '@/components/CurvedLoop'
import { CtaButton } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Container, headingToneClass, Section, toneClass } from '@/components/ui/Section'
import { site } from '@/content'
import type { ToneT } from '@/content/schema'
import { cn } from '@/lib/utils'
import { ShowcaseImage } from './parts/ShowcaseImage'
import type { SectionProps } from './types'

// Colour of the decorative curved band on each panel tone
const bandToneClass: Record<ToneT, string> = {
  cream: 'text-brand-deep',
  blush: 'text-brand-deep',
  brand: 'text-caramel',
  ink: 'text-caramel',
  caramel: 'text-brand-deep',
}

/**
 * Decorative wavy marquee (React Bits CurvedLoop). It measures its text on the client and stays
 * invisible until then; this box reserves the exact SVG aspect ratio, so nothing shifts. CurvedLoop's
 * own wrapper is min-h-screen, hence the centred absolute positioning inside a clipped box.
 */
function CurvedBand({ text, tone }: { text: string; tone: ToneT }) {
  return (
    <div aria-hidden className={cn('pointer-events-none relative aspect-[100/12] overflow-hidden', bandToneClass[tone])}>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
        <CurvedLoop
          marqueeText={text}
          shape="wave"
          curveAmount={60}
          fontSize={64}
          fontWeight={400}
          letterSpacing={2}
          speed={1}
          separator="•"
          edgeFade={0.12}
          interactive={false}
          className="font-display"
        />
      </div>
    </div>
  )
}

export default function CtaBanner({ section }: SectionProps<'cta'>) {
  const headingId = `${section.id}-title`
  const { tone, image } = section
  return (
    <Section id={section.id} labelledBy={headingId} className="px-2 py-2 sm:px-3 sm:py-3 md:py-3">
      <div className={cn('relative overflow-hidden rounded-frame', toneClass[tone], tone === 'cream' && 'ring-1 ring-brand-deep/15 ring-inset')}>
        <Container className={cn('grid items-center gap-12 pt-16 pb-4 md:pt-24', image && 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]')}>
          <Reveal className={cn('text-center', image && 'lg:text-left')}>
            <h2 id={headingId} className={cn('font-display text-[clamp(3rem,11vw,8.5rem)] leading-[0.9] tracking-tight uppercase', headingToneClass[tone])}>
              {section.heading}
            </h2>
            {section.text && (
              <p className={cn('mx-auto mt-6 max-w-md text-xs leading-relaxed font-bold tracking-[0.16em] uppercase sm:text-sm', image && 'lg:mx-0')}>
                {section.text}
              </p>
            )}
            <div className={cn('mt-10 flex flex-wrap items-center justify-center gap-3', image && 'lg:justify-start')}>
              <CtaButton cta={section.primaryCta} location="cta" size="lg" />
              {section.secondaryCta && <CtaButton cta={section.secondaryCta} location="cta" size="lg" withCircle={false} />}
            </div>
          </Reveal>
          {image && (
            <Reveal delay={150} className="mx-auto w-[min(70vw,22rem)]">
              <ShowcaseImage image={image} sizes="(min-width: 1024px) 352px, 70vw" className="w-full rotate-3" />
            </Reveal>
          )}
        </Container>
        {(section.marquee ?? site.tagline) && <CurvedBand text={section.marquee ?? site.tagline} tone={tone} />}
      </div>
    </Section>
  )
}
