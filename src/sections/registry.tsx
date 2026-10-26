// Maps the "type" of a section in src/data/pages/*.json to its React component.
// To add a new section type: add its Zod schema to src/content/schema.ts (Section union),
// create the component here and register it below — TypeScript enforces completeness.
import type { ComponentType } from 'react'
import type { PageT, SectionT } from '@/content/schema'
import About from './About'
import CtaBanner from './CtaBanner'
import Faq from './Faq'
import Gallery from './Gallery'
import Hero from './Hero'
import ProductGrid from './ProductGrid'
import Reviews from './Reviews'
import Split from './Split'
import TextBlock from './TextBlock'
import type { SectionProps } from './types'
import Visit from './Visit'

type Registry = { [K in SectionT['type']]: ComponentType<SectionProps<K>> }

export const sectionRegistry: Registry = {
  hero: Hero,
  about: About,
  split: Split,
  productGrid: ProductGrid,
  reviews: Reviews,
  visit: Visit,
  gallery: Gallery,
  faq: Faq,
  cta: CtaBanner,
  text: TextBlock,
}

export function RenderSections({ page }: { page: PageT }) {
  return (
    <>
      {page.sections
        .filter((s) => s.enabled)
        .map((section, index) => {
          const Component = sectionRegistry[section.type] as ComponentType<SectionProps<typeof section.type>>
          return <Component key={section.id} section={section} page={page} index={index} />
        })}
    </>
  )
}
