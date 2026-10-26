import ConsentSettingsButton from '@/components/consent/ConsentSettingsButton'
import { Picture } from '@/components/ui/Picture'
import { SmartLink } from '@/components/ui/SmartLink'
import { fmt, useContent } from '@/content'
import { Wordmark } from './footer/Wordmark'
import { LanguageLinks } from './languages'

const tiny = 'text-[11px] font-extrabold tracking-[0.2em] uppercase'

export default function Footer() {
  const { address, consent, footer, legalName, logo, ui } = useContent().site
  return (
    <footer className="px-2 pb-2 sm:px-3 sm:pb-3">
      <div className="rounded-frame bg-brand-deep p-2 text-cream sm:p-3">
        <div className="grid gap-2 sm:gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col justify-between gap-14 rounded-2xl bg-cream p-6 text-ink sm:p-10 lg:min-h-[30rem]">
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:flex sm:flex-wrap sm:gap-x-16 lg:gap-x-24">
              {footer.columns.map((col, i) => (
                <nav key={col.title} aria-labelledby={`footer-col-${i}`}>
                  <h2 id={`footer-col-${i}`} className={`${tiny} text-brand-deep`}>
                    {col.title}
                  </h2>
                  <ul className="mt-3">
                    {col.links.map((link) => (
                      <li key={link.href + link.label}>
                        <SmartLink
                          href={link.href}
                          location="footer"
                          className="inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:text-brand-deep hover:underline"
                        >
                          {link.label}
                        </SmartLink>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
            <Wordmark text={logo.wordmark} />
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink sm:aspect-[16/9] lg:aspect-auto">
            <Picture image={footer.image} sizes="(min-width: 1024px) 33vw, 100vw" className="absolute inset-0 size-full object-cover" />
            <div className={`absolute inset-x-0 bottom-0 space-y-1 bg-linear-to-t from-ink/90 via-ink/60 to-transparent p-5 pt-20 text-cream sm:p-6 sm:pt-24 ${tiny}`}>
              {/* Year is fixed at build time; a client in a newer year must not trigger a hydration error */}
              <p suppressHydrationWarning>{fmt(ui.layout.copyright, { year: new Date().getFullYear(), name: legalName })}</p>
              {footer.note && <p className="tracking-[0.12em] opacity-90">{footer.note}</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-x-8 px-3 pt-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:pt-3">
          <p className="py-2 font-semibold">
            {address.street}, {address.postalCode} {address.city}
          </p>
          <div className="flex flex-wrap gap-x-6 font-bold">
            <nav aria-label={ui.common.language}>
              <LanguageLinks
                className="flex flex-wrap gap-x-4"
                linkClassName="inline-flex min-h-11 items-center underline-offset-4 hover:underline aria-[current=page]:underline"
                withShort={false}
              />
            </nav>
            <SmartLink href={consent.policyHref} location="footer" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
              {consent.policyLabel}
            </SmartLink>
            <ConsentSettingsButton className="inline-flex min-h-11 items-center" />
          </div>
        </div>
      </div>
    </footer>
  )
}
