import type { SectionProps } from './types'

export default function Faq({ section }: SectionProps<'faq'>) {
  return (
    <section id={section.id} className="py-16 text-center">
      <p>[faq] {section.id}</p>
    </section>
  )
}
