import type { SectionProps } from './types'

export default function Split({ section }: SectionProps<'split'>) {
  return (
    <section id={section.id} className="py-16 text-center">
      <p>[split] {section.id}</p>
    </section>
  )
}
