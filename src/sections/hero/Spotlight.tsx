import { useState } from 'react'
import { ProductParticles, useParticleBurst } from '@/components/product/ProductParticles'
import { AiBadge } from '@/components/ui/AiBadge'
import { ChevronLeft, ChevronRight } from '@/components/ui/icons'
import { Picture } from '@/components/ui/Picture'
import { SmartLink } from '@/components/ui/SmartLink'
import { useContent } from '@/content'
import type { ProductT } from '@/content/schema'
import { trackEngagement, trackSelectItem } from '@/lib/analytics'

const navButton =
  'inline-grid size-(--nf-arrow) cursor-pointer place-items-center rounded-full bg-brand-deep text-cream transition-colors duration-200 hover:bg-ink'

/**
 * Mini product card from the reference: brand panel (SVG frame .nf-card) with its own top-right
 * notch holding the two round arrows. Cycles through the spotlight products (SSR renders the first).
 */
export function Spotlight({ label, products }: { label: string; products: ProductT[] }) {
  const { formatPrice, site } = useContent()
  const [index, setIndex] = useState(0)
  const product = products[index]
  const many = products.length > 1
  const go = (step: number) => {
    setIndex((i) => (i + step + products.length) % products.length)
    trackEngagement('spotlight_navigate', step > 0 ? 'next' : 'prev')
  }
  const image = product.images[0]
  const price = formatPrice(product)
  const burstArea = useParticleBurst<HTMLDivElement>(product.slug)

  return (
    <div className="nf-card relative h-full min-h-[9.5rem] text-cream">
      {/* Badge as a ribbon across the top-left corner, as on the product cards */}
      {product.badge && (
        <span key={product.slug} className="pointer-events-none absolute top-0 left-0 z-10 size-24 overflow-hidden rounded-tl-[22px]">
          <span className="absolute top-[1.125rem] left-[-2.5rem] w-36 -rotate-45 bg-caramel py-1 text-center text-[0.5625rem] font-extrabold tracking-[0.12em] whitespace-nowrap text-ink uppercase shadow-md shadow-ink/30">
            {product.badge}
          </span>
        </span>
      )}
      {many && (
        <div className="absolute top-0 right-0 z-10 flex gap-1.5">
          <button type="button" aria-label={site.ui.common.previousProduct} onClick={() => go(-1)} className={navButton}>
            <ChevronLeft width={18} height={18} />
          </button>
          <button type="button" aria-label={site.ui.common.nextProduct} onClick={() => go(1)} className={navButton}>
            <ChevronRight width={18} height={18} />
          </button>
        </div>
      )}

      <div aria-live="polite" className="group grid h-full grid-cols-[44%_1fr] items-center gap-3 py-3 pr-4 pl-2">
        <div ref={burstArea} key={product.slug} className="relative aspect-square transition-opacity duration-500 starting:opacity-0">
          <ProductParticles slug={product.slug} />
          <Picture
            image={image}
            sizes="160px"
            decorative
            className="relative size-full object-contain drop-shadow-lg drop-shadow-ink/40 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3"
          />
          {image.aiGenerated && <AiBadge className="absolute bottom-0 left-1 scale-90" />}
        </div>
        <div className="min-w-0 self-end pb-1">
          <p className="text-[0.625rem] font-extrabold tracking-[0.2em] text-caramel uppercase">
            {label}
            {many && (
              <span className="ml-1.5 text-cream/70 tabular-nums">
                {String(index + 1).padStart(2, '0')}/{String(products.length).padStart(2, '0')}
              </span>
            )}
          </p>
          <SmartLink
            href={`/produkt/${product.slug}`}
            location="hero"
            onClick={() => trackSelectItem(product, 'hero_spotlight', index)}
            className="mt-1 line-clamp-3 font-display text-lg leading-[1.05] uppercase after:absolute after:inset-0 after:rounded-[22px] focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-offset-2 focus-visible:after:outline-ink md:text-xl"
          >
            {product.name}
          </SmartLink>
          {price && (
            <span className="mt-2 inline-flex rounded-full bg-cream px-3 py-1 text-[0.625rem] font-extrabold tracking-[0.12em] text-brand-deep uppercase">{price}</span>
          )}
        </div>
      </div>
    </div>
  )
}
