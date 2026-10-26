import { useEffect, useRef, useState } from 'react'
import { AiBadge } from '@/components/ui/AiBadge'
import { CtaButton } from '@/components/ui/Button'
import { Picture } from '@/components/ui/Picture'
import { Reveal } from '@/components/ui/Reveal'
import { headingToneClass, Section, toneClass } from '@/components/ui/Section'
import type { SectionOf } from '@/content/schema'
import { asset, cn } from '@/lib/utils'
import { ShowcaseImage } from './parts/ShowcaseImage'
import type { SectionProps } from './types'

type VideoT = NonNullable<SectionOf<'split'>['left']['video']>

const cover = 'absolute inset-0 -z-10 size-full object-cover'
const coverSizes = '(min-width: 768px) 50vw, 100vw'

/**
 * Muted background loop that only plays while on screen. With prefers-reduced-motion it never loads
 * and the poster photo (with its alt text) stays; the video fades in once it actually plays.
 */
function CoverVideo({ video }: { video: VideoT }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.muted = true
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <>
      <Picture image={video.poster} sizes={coverSizes} className={cover} />
      <video
        ref={ref}
        src={asset(video.src)}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
        onPlaying={() => setPlaying(true)}
        className={cn(cover, 'opacity-0 transition-opacity duration-700', playing && 'opacity-100')}
      />
    </>
  )
}

export default function Split({ section }: SectionProps<'split'>) {
  const { left, right } = section
  const headingId = `${section.id}-title`
  const coverImage = left.video ? left.video.poster : left.image
  return (
    <Section id={section.id} labelledBy={headingId} className="px-2 py-0 sm:px-3 md:py-0">
      <div className="grid overflow-hidden rounded-frame md:grid-cols-2">
        <div className="relative isolate flex min-h-[24rem] items-center justify-center p-8 md:min-h-[32rem] lg:min-h-[35rem]">
          {left.video ? <CoverVideo video={left.video} /> : <Picture image={left.image} sizes={coverSizes} className={cover} />}
          <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-ink/70 via-ink/40 to-ink/25" />
          {coverImage.aiGenerated && <AiBadge className="absolute bottom-3 left-3" />}
          <Reveal>
            <p className="text-center font-display text-[clamp(3rem,8vw,7rem)] leading-[0.88] tracking-tight wrap-anywhere text-cream uppercase [text-shadow:0_4px_24px_rgb(0_0_0/0.35)]">
              {left.title.map((line, i) => (
                <span key={i} className="block">
                  {line}{' '}
                </span>
              ))}
            </p>
          </Reveal>
        </div>

        <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center sm:px-10', toneClass[right.tone])}>
          <Reveal className="flex flex-col items-center">
            <h2 id={headingId} className={cn('font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.95] tracking-tight uppercase', headingToneClass[right.tone])}>
              {right.heading}
            </h2>
            <ShowcaseImage image={right.image} sizes="(min-width: 768px) 288px, 60vw" className="mt-8 w-[min(60vw,18rem)] md:w-[min(28vw,18rem)]" />
            <p className="mt-8 max-w-xs text-xs leading-relaxed font-bold tracking-[0.16em] uppercase">{right.caption}</p>
            {right.cta && (
              <div className="mt-8">
                <CtaButton cta={right.cta} location="split" />
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </Section>
  )
}
