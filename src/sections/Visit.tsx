import type { ReactNode } from 'react'
import { useContent } from '@/content'
import { CtaButton } from '@/components/ui/Button'
import { MapPin, Phone } from '@/components/ui/icons'
import { Reveal } from '@/components/ui/Reveal'
import { Container, Section, SectionHeading } from '@/components/ui/Section'
import { SmartLink } from '@/components/ui/SmartLink'
import { cn } from '@/lib/utils'
import type { SectionProps } from './types'
import { MapPanel } from './visit/MapPanel'
import { OpeningHours } from './visit/OpeningHours'

function Label({ children }: { children: ReactNode }) {
  return <h3 className="text-[11px] font-extrabold tracking-[0.2em] text-brand-deep uppercase">{children}</h3>
}

export default function Visit({ section }: SectionProps<'visit'>) {
  const { site } = useContent()
  const { address, contact } = site
  const headingId = `${section.id}-title`
  const hasPanel = section.showMap || Boolean(section.image)

  return (
    // overflow-x-clip: the heading sticker may stick out past the viewport on 320px screens
    <Section id={section.id} tone={section.tone} labelledBy={headingId} className="overflow-x-clip">
      <Container>
        <SectionHeading id={headingId} tone={section.tone} sticker={section.sticker}>
          {section.heading}
        </SectionHeading>
        {section.intro && <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed sm:text-lg">{section.intro}</p>}

        <Reveal className={cn('mt-12 grid gap-4 md:mt-16 lg:gap-6', hasPanel ? 'lg:grid-cols-2' : 'mx-auto max-w-2xl')}>
          <div className="divide-y divide-dashed divide-brand-deep/25 rounded-frame bg-cream p-6 text-ink ring-1 ring-brand-deep/15 ring-inset sm:p-10 [&>*]:py-7 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
            <div>
              <Label>{site.ui.visit.address}</Label>
              <address className="mt-3 not-italic">
                <p className="font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-none tracking-tight text-brand-deep uppercase">{address.street}</p>
                <p className="mt-2 font-bold">
                  {address.postalCode} {address.city} · {address.district}
                </p>
              </address>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-caramel px-4 py-2 text-xs font-extrabold sm:text-sm">
                <MapPin width={16} height={16} className="shrink-0" />
                {address.entranceNote}
              </p>
            </div>

            <OpeningHours />

            <div>
              <Label>{site.ui.visit.phone}</Label>
              <SmartLink
                href="@phone"
                location="visit"
                className="mt-2 inline-flex min-h-11 items-center gap-3 font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-none tracking-tight text-brand-deep hover:text-ink"
              >
                <Phone width={24} height={24} />
                {contact.phoneDisplay}
              </SmartLink>
              <div className="mt-6 flex flex-wrap gap-3">
                {section.ctas.map((cta, i) => (
                  <CtaButton key={cta.href} cta={cta} location="visit" withCircle={i === 0} />
                ))}
              </div>
            </div>
          </div>

          {hasPanel && <MapPanel id={section.id} image={section.image} showMap={section.showMap} />}
        </Reveal>
      </Container>
    </Section>
  )
}
