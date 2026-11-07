import { useContent } from '@/content'
import { ProductList } from '@/components/product/ProductList'
import { CtaButton, ctaGroup } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/ui/Reveal'
import { Container, Section, SectionHeading } from '@/components/ui/Section'
import type { SectionProps } from './types'

/** "Meet your new favourites": heading + sticker, optional intro, product cards, optional CTA. */
export default function ProductGrid({ section }: SectionProps<'productGrid'>) {
  const list = useContent().productsFor(section.source, section.limit)
  if (!list.length) return null
  const headingId = `${section.id}-heading`
  return (
    <Section id={section.id} tone={section.tone} labelledBy={headingId}>
      <Container>
        <Reveal>
          <SectionHeading id={headingId} tone={section.tone} sticker={section.sticker}>
            {section.heading}
          </SectionHeading>
          {section.intro && (
            <p className="mx-auto mt-6 max-w-[40rem] text-center text-xs leading-relaxed font-bold tracking-[0.18em] uppercase sm:text-sm">
              {section.intro}
            </p>
          )}
        </Reveal>
        <Reveal delay={120} className="mt-10 md:mt-14">
          <ProductList products={list} listName={section.id} />
        </Reveal>
        {section.cta && (
          <div className={cn('mt-10 sm:justify-center md:mt-14', ctaGroup)}>
            <CtaButton cta={section.cta} location={section.id} />
          </div>
        )}
      </Container>
    </Section>
  )
}
