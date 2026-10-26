import type { SectionProps } from './types'

export default function Gallery({ section }: SectionProps<'gallery'>) {
  return (
    <section id={section.id} className="py-16 text-center">
      <p>[gallery] {section.id}</p>
    </section>
  )
}
