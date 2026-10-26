import { AiBadge } from '@/components/ui/AiBadge'
import { CtaButton } from '@/components/ui/Button'
import { Picture } from '@/components/ui/Picture'
import { Reveal } from '@/components/ui/Reveal'
import { Container, Section, SectionHeading } from '@/components/ui/Section'
import { cn } from '@/lib/utils'
import type { SectionProps } from './types'

// Desktop: first photo floats low on the left, second high on the right. Mobile: a tilted pair under the text.
const placement = ['lg:absolute lg:bottom-0 lg:left-4 xl:left-0', 'lg:absolute lg:top-0 lg:right-4 xl:right-0']
const tilt = ['-rotate-6', 'rotate-6']

export default function About({ section }: SectionProps<'about'>) {
  const headingId = `${section.id}-title`
  return (
    <Section id={section.id} tone={section.tone} labelledBy={headingId} className="overflow-x-clip">
      <Container className="relative">
        <Reveal className="relative z-10 mx-auto max-w-2xl text-center">
          <SectionHeading id={headingId} tone={section.tone} sticker={section.sticker}>
            {section.heading}
          </SectionHeading>
          <div className="mx-auto mt-8 max-w-[40rem] space-y-5 text-xs leading-relaxed font-bold tracking-[0.16em] uppercase sm:text-sm">
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
          <div className="mt-14 flex justify-center gap-5 sm:gap-10 lg:contents">
            {section.images.map((image, i) => (
              <Reveal key={image.src} delay={150 * (i + 1)} className={cn('w-[42%] max-w-48 lg:w-32 xl:w-44', placement[i])}>
                <div className={cn('relative', tilt[i])}>
                  <Picture
                    image={image}
                    sizes="(min-width: 1280px) 176px, (min-width: 1024px) 128px, 42vw"
                    className="aspect-[4/5] w-full rounded-2xl object-cover shadow-[0_18px_40px_-14px_rgb(0_0_0/0.45)]"
                  />
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
