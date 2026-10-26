import { Seo } from '@/components/Seo'
import { CtaButton } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Seo title="Nie znaleziono strony" description="Ta strona nie istnieje. Wróć na stronę główną Słodko Mi." path="/404" noindex />
      <p className="font-display text-[clamp(5rem,20vw,10rem)] leading-none text-brand">404</p>
      <h1 className="font-display text-4xl uppercase text-brand-deep">Tu nie ma cynamonek</h1>
      <p>Ta strona nie istnieje albo została przeniesiona.</p>
      <CtaButton cta={{ label: 'Strona główna', href: '/', variant: 'primary' }} location="404" />
    </section>
  )
}
