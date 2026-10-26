import { SmartLink } from '@/components/ui/SmartLink'
import { site } from '@/content'
import { cn } from '@/lib/utils'

/** Wordmark pill linking home: brand-deep Anton wordmark + tiny "Smakuje Ci?" line. */
export function Logo({ location, onClick, className }: { location: string; onClick?: () => void; className?: string }) {
  return (
    <SmartLink
      href="/"
      location={location}
      onClick={onClick}
      className={cn(
        'inline-flex h-12 shrink-0 flex-col items-start justify-center rounded-full px-5 text-brand-deep ring-2 ring-brand-deep ring-inset transition-colors duration-200 hover:bg-brand-deep hover:text-cream lg:h-14 lg:px-6',
        className,
      )}
    >
      <span className="font-display text-[1.375rem] leading-none tracking-[0.02em] uppercase lg:text-[1.625rem]">{site.logo.wordmark}</span>
      {site.logo.sub && <span className="mt-0.5 text-[0.5625rem] leading-none font-extrabold tracking-[0.22em] uppercase lg:text-[0.625rem]">{site.logo.sub}</span>}
    </SmartLink>
  )
}
