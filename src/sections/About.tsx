import { AiBadge } from '@/components/ui/AiBadge'
import { CtaButton } from '@/components/ui/Button'
import { Picture } from '@/components/ui/Picture'
import { Reveal } from '@/components/ui/Reveal'
import { Container, Section, SectionHeading } from '@/components/ui/Section'
import { cn } from '@/lib/utils'
import type { SectionProps } from './types'

// Desktop (as in the reference): small square photos, the first low on the left, the second high on the right
const placement = ['lg:absolute lg:bottom-6 lg:left-[6%]', 'lg:absolute lg:top-10 lg:right-[6%]']

export default function About({ section }: SectionProps<'about'>) {
  const headingId = `${section.id}-title`
  return (
    <Section id={section.id} tone={section.tone} labelledBy={headingId} className="overflow-x-clip">
      <Container className="relative">
        <Reveal className="relative z-10 mx-auto max-w-4xl text-center">
          {/* The statement heading is set in sentence case and brand colour, like the reference */}
          <SectionHeading id={headingId} tone={section.tone} sticker={section.sticker} className="text-[clamp(2.2rem,4.6vw,3.6rem)] text-balance text-brand-deep normal-case">
            {section.heading}
          </SectionHeading>
          <div className="mx-auto mt-8 max-w-[40rem] space-y-5 text-xs leading-relaxed font-semibold tracking-[0.12em] text-ink/75 uppercase sm:text-sm">
            {section.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          {section.cta && (
            <div className="mt-10">
              <CtaButton cta={section.cta} location="about" />
            </div>
          )}
        </Reveal>

        {section.images.length > 0 && (
          <div className="mt-12 flex justify-center gap-6 lg:contents">
            {section.images.map((image, i) => (
              <Reveal key={image.src} delay={150 * (i + 1)} className={cn('w-28 lg:w-24 xl:w-28', placement[i])}>
                <div className="relative">
                  <Picture image={image} sizes="112px" className="aspect-square w-full rounded-lg object-cover" />
                  {image.aiGenerated && <AiBadge className="absolute bottom-2 left-2" />}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </Section>
  )
}
