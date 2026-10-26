import type { ReactNode } from 'react'
import { SmartLink } from '@/components/ui/SmartLink'
import { useContent } from '@/content'

/**
 * Right notch content: a round button (language switcher in the header, phone in the menu overlay),
 * the menu button and the CTA pill. The menu overlay renders the same row with its close button.
 */
export function HeaderActions({ lead, menuButton }: { lead: ReactNode; menuButton: ReactNode }) {
  const { site } = useContent()
  return (
    <div className="flex h-(--nf-item) w-[calc(var(--nf-right)-var(--nf-gap))] items-center justify-end gap-1.5 md:gap-2">
      {lead}
      {menuButton}
      <SmartLink
        href={site.header.cta.href}
        location="header"
        className="hidden h-full flex-1 items-center justify-center rounded-full bg-brand-deep px-5 text-xs font-extrabold tracking-[0.1em] text-caramel uppercase transition-colors duration-200 hover:bg-ink md:inline-flex lg:text-[0.8125rem]"
      >
        {site.header.cta.label}
      </SmartLink>
    </div>
  )
}
