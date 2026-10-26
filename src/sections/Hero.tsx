import type { SectionProps } from './types'

export default function Hero({ section }: SectionProps<'hero'>) {
  return (
    <section id={section.id} className="py-16 text-center">
      <p>[hero] {section.id}</p>
    </section>
  )
}
