import { cn } from '@/lib/utils'

/** Visible disclosure for AI-generated illustrations (Image.aiGenerated) — place it over the image's corner. */
export function AiBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'pointer-events-none inline-block rounded-full bg-ink/75 px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] text-cream uppercase backdrop-blur-sm',
        className,
      )}
    >
      Ilustracja
    </span>
  )
}
