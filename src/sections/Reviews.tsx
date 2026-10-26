import type { SectionProps } from './types'

export default function Reviews({ section }: SectionProps<'reviews'>) {
  return (
    <section id={section.id} className="py-16 text-center">
      <p>[reviews] {section.id}</p>
    </section>
  )
}
