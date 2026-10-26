import { Seo } from '@/components/Seo'
import { CtaButton } from '@/components/ui/Button'
import { useContent } from '@/content'

export default function NotFound() {
  const ui = useContent().site.ui.notFound
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Seo title={ui.title} description={ui.description} path="/404" noindex />
      <p className="font-display text-[clamp(5rem,20vw,10rem)] leading-none text-brand">404</p>
      <h1 className="font-display text-4xl uppercase text-brand-deep">{ui.heading}</h1>
      <p>{ui.text}</p>
      <CtaButton cta={ui.cta} location="404" />
    </section>
  )
}
