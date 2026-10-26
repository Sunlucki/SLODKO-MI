import { useEffect, useRef, useState, type RefObject } from 'react'
import BounceCards from '@/components/BounceCards'
import { AiBadge } from '@/components/ui/AiBadge'
import { CtaButton } from '@/components/ui/Button'
import { Picture } from '@/components/ui/Picture'
import { Reveal } from '@/components/ui/Reveal'
import { Container, Section, SectionHeading } from '@/components/ui/Section'
import { images } from '@/content'
import { asset, cn } from '@/lib/utils'
import type { SectionProps } from './types'

const FAN_QUERY = '(min-width: 1024px)'
const CARD_SIZE = 220

/**
 * true once the stage is near the viewport on a desktop-width screen. SSR and the first client
 * render always get false, so the static photo grid is what gets pre-rendered and hydrated.
 */
function useFan(ref: RefObject<HTMLDivElement | null>) {
  const [fan, setFan] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const mq = window.matchMedia(FAN_QUERY)
    let near = false
    const update = () => setFan(near && mq.matches)
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        near = true
        update()
        io.disconnect()
      },
      { rootMargin: '200px 0px' },
    )
    io.observe(el)
    mq.addEventListener('change', update)
    return () => {
      io.disconnect()
      mq.removeEventListener('change', update)
    }
  }, [ref])
  return fan
}

export default function Gallery({ section }: SectionProps<'gallery'>) {
  const headingId = `${section.id}-title`
  const stageRef = useRef<HTMLDivElement>(null)
  // The bouncy fan cannot show the "Ilustracja" label, so AI-generated images keep the photo grid
  const fan = useFan(stageRef) && !section.images.some((image) => image.aiGenerated)
  const count = section.images.length

  return (
    <Section id={section.id} tone={section.tone} labelledBy={headingId} className="overflow-x-clip">
      <Container>
        <Reveal className="text-center">
          <SectionHeading id={headingId} tone={section.tone} sticker={section.sticker}>
            {section.heading}
          </SectionHeading>
          {section.intro && (
            <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed font-bold tracking-[0.16em] uppercase sm:text-sm">{section.intro}</p>
          )}
        </Reveal>

        {/* Fixed height on desktop, so swapping the grid for the bouncy fan never shifts the layout */}
        <div ref={stageRef} className="mt-12 lg:mt-6 lg:h-[22rem]">
          {fan ? (
            <BounceCards
              images={section.images.map((image) => ({ src: asset(`images/${image.src}-${images[image.src].widths[0]}.webp`), alt: image.alt }))}
              style={{ width: '100%' }}
              containerHeight={352}
              cardSize={CARD_SIZE}
              spread={Math.min(175, Math.floor(680 / Math.max(1, count - 1)))}
              rotation={8}
              pushDistance={70}
              borderWidth={6}
              borderColor="white"
              radius={24}
              animationDelay={0.1}
            />
          ) : (
            <ul className="flex flex-wrap justify-center gap-3 sm:gap-5 lg:h-full lg:flex-nowrap lg:items-center">
              {section.images.map((image, i) => (
                <li
                  key={image.src}
                  className={cn('relative w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.875rem)] lg:w-auto lg:max-w-52 lg:flex-1', i % 2 ? 'rotate-2' : '-rotate-2')}
                >
                  <Picture
                    image={image}
                    sizes="(min-width: 1024px) 208px, (min-width: 640px) 30vw, 46vw"
                    className="aspect-[4/5] w-full rounded-2xl object-cover shadow-[0_14px_30px_-12px_rgb(0_0_0/0.4)] ring-6 ring-white lg:aspect-square"
                  />
                  {image.aiGenerated && <AiBadge className="absolute top-2 left-2" />}
                </li>
              ))}
            </ul>
          )}
        </div>

        {section.cta && (
          <div className="mt-12 text-center lg:mt-8">
            <CtaButton cta={section.cta} location="gallery" />
          </div>
        )}
      </Container>
    </Section>
  )
}
