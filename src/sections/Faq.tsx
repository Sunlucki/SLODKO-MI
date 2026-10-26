import { Plus } from '@/components/ui/icons'
import { Reveal } from '@/components/ui/Reveal'
import { Container, Section, SectionHeading } from '@/components/ui/Section'
import { contentFor, defaultLocale } from '@/content'
import { trackEngagement } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import type { SectionProps } from './types'

/** Analytics reports stay in the default language: the question as written there (items match by position). */
function reportedQuestion(path: string, id: string, index: number) {
  const base = contentFor(defaultLocale).getPage(path)?.sections.find((s) => s.id === id)
  return base?.type === 'faq' ? base.items[index]?.question : undefined
}

/** Native <details> accordion: works without JS, answers stay in the pre-rendered HTML. */
export default function Faq({ section, page }: SectionProps<'faq'>) {
  const headingId = `${section.id}-title`
  // Light panels on light tones, solid cream on dark ones so the text keeps its contrast.
  const panel = section.tone === 'brand' || section.tone === 'ink' ? 'bg-cream' : 'bg-white/60'
  return (
    <Section id={section.id} tone={section.tone} labelledBy={headingId}>
      <Container className="max-w-3xl">
        <SectionHeading id={headingId} tone={section.tone} sticker={section.sticker}>
          {section.heading}
        </SectionHeading>
        <Reveal className="mt-12 space-y-3 md:mt-16">
          {section.items.map((item, i) => (
            <details
              key={item.question}
              onToggle={(e) => e.currentTarget.open && trackEngagement('open_faq', reportedQuestion(page.path, section.id, i) ?? item.question)}
              className={cn('group rounded-2xl border border-brand-deep/25 text-ink transition-colors [&[open]]:border-brand-deep/60', panel)}
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 sm:px-7 sm:py-5 [&::-webkit-details-marker]:hidden">
                <span className="font-display text-xl leading-tight text-brand-deep uppercase sm:text-2xl">{item.question}</span>
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-deep text-cream transition-transform duration-300 group-[[open]]:rotate-45"
                >
                  <Plus width={18} height={18} />
                </span>
              </summary>
              <p className="max-w-[62ch] px-5 pb-6 text-[15px] leading-relaxed sm:px-7 sm:text-base">{item.answer}</p>
            </details>
          ))}
        </Reveal>
      </Container>
    </Section>
  )
}
