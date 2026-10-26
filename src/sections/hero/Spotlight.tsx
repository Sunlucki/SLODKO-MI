import { useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight } from '@/components/ui/icons'
import { Picture } from '@/components/ui/Picture'
import { SmartLink } from '@/components/ui/SmartLink'
import type { ProductT } from '@/content/schema'
import { trackEngagement, trackSelectItem } from '@/lib/analytics'

const navButton =
  'inline-grid size-11 cursor-pointer place-items-center rounded-full bg-brand-deep text-cream transition-colors duration-200 hover:bg-ink focus-visible:ring-4 focus-visible:ring-caramel focus-visible:outline-none'

/** Mini product card cycling through spotlight products (SSR renders the first one). */
export function Spotlight({ label, products }: { label: string; products: ProductT[] }) {
  const [index, setIndex] = useState(0)
  const product = products[index]
  const many = products.length > 1
  const go = (step: number) => {
    setIndex((i) => (i + step + products.length) % products.length)
    trackEngagement('spotlight_navigate', step > 0 ? 'next' : 'prev')
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.6875rem] font-extrabold tracking-[0.2em] text-brand-deep uppercase">
          {label}
          {many && (
            <span className="ml-2 text-ink/70 tabular-nums">
              {String(index + 1).padStart(2, '0')}/{String(products.length).padStart(2, '0')}
            </span>
          )}
        </p>
        {many && (
          <div className="flex gap-1.5">
            <button type="button" aria-label="Poprzedni produkt" onClick={() => go(-1)} className={navButton}>
              <ChevronLeft width={18} height={18} />
            </button>
            <button type="button" aria-label="Następny produkt" onClick={() => go(1)} className={navButton}>
              <ChevronRight width={18} height={18} />
            </button>
          </div>
        )}
      </div>

      <div aria-live="polite" className="group relative mt-3 flex items-center gap-4">
        <div key={product.slug} className="size-20 shrink-0 overflow-hidden rounded-2xl bg-blush transition-opacity duration-500 starting:opacity-0">
          <Picture image={product.images[0]} sizes="80px" decorative className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
        </div>
        <div className="min-w-0">
          <SmartLink
            href={`/produkt/${product.slug}`}
            location="hero"
            onClick={() => trackSelectItem(product, 'hero_spotlight', index)}
            className="line-clamp-2 font-display text-xl leading-[1.05] text-brand-deep uppercase after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-4 focus-visible:after:ring-caramel"
          >
            {product.name}
          </SmartLink>
          <span aria-hidden className="mt-1.5 inline-flex items-center gap-1 text-[0.6875rem] font-extrabold tracking-[0.16em] uppercase underline-offset-4 group-hover:underline">
            Zobacz smak
            <ArrowUpRight width={14} height={14} />
          </span>
        </div>
      </div>
    </div>
  )
}
