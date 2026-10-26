import type { SectionProps } from './types'

export default function ProductGrid({ section }: SectionProps<'productGrid'>) {
  return (
    <section id={section.id} className="py-16 text-center">
      <p>[productGrid] {section.id}</p>
    </section>
  )
}
