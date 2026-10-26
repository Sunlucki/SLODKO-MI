import { openConsentSettings } from '@/lib/analytics'
import { cn } from '@/lib/utils'

/** Re-opens the cookie settings (required by GDPR: withdrawing consent must be as easy as giving it). */
export default function ConsentSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => openConsentSettings()}
      className={cn('inline-flex min-h-11 items-center underline-offset-4 hover:underline', className)}
    >
      Ustawienia cookies
    </button>
  )
}
