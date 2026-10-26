import { cn } from '@/lib/utils'

/** Re-opens the cookie settings (required by GDPR: withdrawing consent must be as easy as giving it). */
export default function ConsentSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" className={cn('underline-offset-4 hover:underline', className)}>
      Ustawienia cookies
    </button>
  )
}
