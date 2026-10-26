import type { SectionProps } from './types'

export default function About({ section }: SectionProps<'about'>) {
  return (
    <section id={section.id} className="py-16 text-center">
      <p>[about] {section.id}</p>
    </section>
  )
}
