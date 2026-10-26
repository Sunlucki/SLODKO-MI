import type { SectionProps } from './types'

export default function CtaBanner({ section }: SectionProps<'cta'>) {
  return (
    <section id={section.id} className="py-16 text-center">
      <p>[cta] {section.id}</p>
    </section>
  )
}
