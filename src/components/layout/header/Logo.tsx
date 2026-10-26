import { SmartLink } from '@/components/ui/SmartLink'
import { site } from '@/content'
import { cn } from '@/lib/utils'

/** Filled wordmark pill linking home: cream Anton wordmark + tiny "Smakuje Ci?" line. */
export function Logo({ location, onClick, className }: { location: string; onClick?: () => void; className?: string }) {
  return (
    <SmartLink
      href="/"
      location={location}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 flex-col items-center justify-center rounded-full bg-brand-deep px-4 text-cream transition-colors duration-200 hover:bg-ink',
        className,
      )}
    >
      <span className="font-display text-[1.375rem] leading-none tracking-[0.02em] whitespace-nowrap uppercase md:text-[1.625rem] lg:text-[1.75rem]">
        {site.logo.wordmark}
      </span>
      {site.logo.sub && (
        <span className="mt-0.5 text-[0.5625rem] leading-none font-extrabold tracking-[0.22em] text-caramel uppercase lg:text-[0.625rem]">{site.logo.sub}</span>
      )}
    </SmartLink>
  )
}
