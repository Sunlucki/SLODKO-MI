import type { SectionProps } from './types'

export default function TextBlock({ section }: SectionProps<'text'>) {
  return (
    <section id={section.id} className="py-16 text-center">
      <p>[text] {section.id}</p>
    </section>
  )
}
