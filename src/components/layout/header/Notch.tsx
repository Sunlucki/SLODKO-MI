import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type NotchCorner = 'tl' | 'tr' | 'br'

/**
 * Cream "notch" cut into a corner of a dark frame (hero, mobile menu). The box itself
 * covers the frame's corner; two small squares with a radial-gradient hole give the
 * frame concave (inverted) rounded corners where it flows around the notch.
 * --r is the corner radius shared by the notch and both cut-outs; the cut-outs overlap the
 * notch by 1px so no hairline shows between them at fractional pixel positions.
 */
const shape: Record<NotchCorner, { box: string; a: string; b: string }> = {
  tl: {
    box: 'rounded-br-[var(--r)]',
    a: 'top-0 left-[calc(100%-1px)] h-(--r) w-[calc(var(--r)+1px)] bg-[radial-gradient(circle_at_100%_100%,transparent_calc(var(--r)-0.5px),var(--color-cream)_var(--r))]',
    b: 'top-[calc(100%-1px)] left-0 h-[calc(var(--r)+1px)] w-(--r) bg-[radial-gradient(circle_at_100%_100%,transparent_calc(var(--r)-0.5px),var(--color-cream)_var(--r))]',
  },
  tr: {
    box: 'rounded-bl-[var(--r)]',
    a: 'top-0 right-[calc(100%-1px)] h-(--r) w-[calc(var(--r)+1px)] bg-[radial-gradient(circle_at_0_100%,transparent_calc(var(--r)-0.5px),var(--color-cream)_var(--r))]',
    b: 'top-[calc(100%-1px)] right-0 h-[calc(var(--r)+1px)] w-(--r) bg-[radial-gradient(circle_at_0_100%,transparent_calc(var(--r)-0.5px),var(--color-cream)_var(--r))]',
  },
  br: {
    box: 'rounded-tl-[var(--r)]',
    a: 'right-[calc(100%-1px)] bottom-0 h-(--r) w-[calc(var(--r)+1px)] bg-[radial-gradient(circle_at_0_0,transparent_calc(var(--r)-0.5px),var(--color-cream)_var(--r))]',
    b: 'right-0 bottom-[calc(100%-1px)] h-[calc(var(--r)+1px)] w-(--r) bg-[radial-gradient(circle_at_0_0,transparent_calc(var(--r)-0.5px),var(--color-cream)_var(--r))]',
  },
}

interface Props {
  corner: NotchCorner
  /** false = plain cream box (e.g. header on pages without a hero frame) */
  cut?: boolean
  /** Extra classes for the concave corners, e.g. "hidden md:block" */
  cutClassName?: string
  className?: string
  children: ReactNode
}

export function Notch({ corner, cut = true, cutClassName, className, children }: Props) {
  const s = shape[corner]
  return (
    <div className={cn('relative bg-cream [--r:1.25rem] lg:[--r:1.75rem]', cut && s.box, className)}>
      {children}
      {cut && (
        <>
          <span aria-hidden className={cn('pointer-events-none absolute', s.a, cutClassName)} />
          <span aria-hidden className={cn('pointer-events-none absolute', s.b, cutClassName)} />
        </>
      )}
    </div>
  )
}
