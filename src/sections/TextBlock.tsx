import { Container, headingToneClass, Section, SectionHeading } from '@/components/ui/Section'
import { cn } from '@/lib/utils'
import type { SectionProps } from './types'

/** Plain prose (privacy policy etc.). The heading is the page's h1 when this is the first section. */
export default function TextBlock({ section, index }: SectionProps<'text'>) {
  const headingId = `${section.id}-title`
  const first = index === 0
  const Sub = first ? 'h2' : 'h3'
  return (
    <Section id={section.id} tone={section.tone} labelledBy={section.heading ? headingId : undefined}>
      <Container className="max-w-3xl">
        {section.heading && (
          <SectionHeading id={headingId} tone={section.tone} as={first ? 'h1' : 'h2'}>
            {section.heading}
          </SectionHeading>
        )}
        <div className={cn('space-y-5 text-base leading-relaxed sm:text-[17px]', section.heading && 'mt-10 md:mt-14')}>
          {section.blocks.map((block, i) =>
            block.kind === 'paragraph' ? (
              <p key={i}>{block.text}</p>
            ) : block.kind === 'subheading' ? (
              <Sub key={i} className={cn('pt-5 font-display text-2xl leading-tight uppercase sm:text-3xl', headingToneClass[section.tone])}>
                {block.text}
              </Sub>
            ) : (
              <ul key={i} className="list-disc space-y-2 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            ),
          )}
        </div>
      </Container>
    </Section>
  )
}
