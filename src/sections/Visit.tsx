import type { SectionProps } from './types'

export default function Visit({ section }: SectionProps<'visit'>) {
  return (
    <section id={section.id} className="py-16 text-center">
      <p>[visit] {section.id}</p>
    </section>
  )
}
