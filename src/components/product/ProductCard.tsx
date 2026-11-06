import { useId } from 'react'
import { useContent } from '@/content'
import type { ProductT } from '@/content/schema'
import { Plus } from '@/components/ui/icons'
import { SmartLink } from '@/components/ui/SmartLink'
import { trackSelectItem } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { isCutout } from './helpers'
import { ProductImage } from './ProductImage'
import { ProductParticles, useParticleBurst } from './ProductParticles'

// Matches the ProductList layout: ~78vw scroller on phones, 2 columns from sm, 4 from lg (max-w-6xl container)
const SIZES = '(min-width: 1152px) 264px, (min-width: 1024px) 23vw, (min-width: 640px) 46vw, 76vw'

interface Props {
  product: ProductT
  /** Position in the list (GA4 select_item index) */
  index: number
  /** List identifier for analytics, e.g. the section id */
  listName: string
}

/**
 * Product card: the product name is the single link, stretched over the whole card,
 * so the round "+" and the image stay decorative (no nested interactive elements).
 */
export function ProductCard({ product, index, listName }: Props) {
  const statusId = useId()
  const { site, formatPrice } = useContent()
  const price = formatPrice(product)
  const burstArea = useParticleBurst<HTMLDivElement>()
  const particles = product.available && isCutout(product.images[0])
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col rounded-2xl border bg-white p-3 text-ink transition-[transform,box-shadow] duration-300',
        'hover:shadow-xl hover:shadow-brand-deep/15 motion-safe:hover:-translate-y-1',
        // Caramel ring shows on dark tones, the ink outline around it on light ones (caramel on cream alone is 1.5:1)
        'has-[a:focus-visible]:ring-4 has-[a:focus-visible]:ring-caramel motion-safe:has-[a:focus-visible]:-translate-y-1',
        'has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-ink',
        product.available ? 'border-brand-deep' : 'border-ink/30',
      )}
    >
      {/* Badge as a ribbon across the top-left corner; the wrapper clips it to the card's rounded corner */}
      {product.badge && (
        <span className="pointer-events-none absolute -top-px -left-px z-10 size-28 overflow-hidden rounded-tl-2xl">
          <span className="absolute top-[1.375rem] left-[-2.375rem] w-40 -rotate-45 bg-caramel py-1.5 text-center text-[10px] font-extrabold tracking-[0.12em] whitespace-nowrap text-ink uppercase shadow-md shadow-ink/20">
            {product.badge}
          </span>
        </span>
      )}
      <div ref={burstArea} className="relative">
        {particles && <ProductParticles slug={product.slug} />}
        <ProductImage image={product.images[0]} sizes={SIZES} muted={!product.available} className="aspect-square rounded-xl bg-none" />
        <span
          aria-hidden
          className={cn(
            'absolute top-2 right-2 grid size-11 place-items-center rounded-full text-cream transition-transform duration-300 motion-safe:group-hover:rotate-90',
            product.available ? 'bg-brand-deep' : 'bg-ink/60',
          )}
        >
          <Plus width={20} height={20} />
        </span>
        {!product.available && (
          <span
            id={statusId}
            className="absolute bottom-2 left-2 rounded-full bg-ink px-3 py-1.5 text-[10px] font-extrabold tracking-[0.12em] text-cream uppercase"
          >
            {site.ui.product.unavailable}
          </span>
        )}
      </div>

      {/* The price pill floats right so long names wrap underneath it instead of into a narrow column */}
      <div className="flow-root px-1 pt-4">
        {price && (
          <span className="float-right mt-0.5 ml-3 rounded-full bg-brand-deep px-3 py-1.5 text-[10px] font-extrabold tracking-[0.12em] whitespace-nowrap text-cream uppercase">
            {price}
          </span>
        )}
        <h3 className={cn('font-display text-2xl leading-[1.05] uppercase', product.available ? 'text-ink' : 'text-ink/70')}>
          <SmartLink
            href={`/produkt/${product.slug}`}
            location={`product-card:${listName}`}
            onClick={() => trackSelectItem(product, listName, index)}
            aria-describedby={product.available ? undefined : statusId}
            className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none"
          >
            {product.name}
          </SmartLink>
        </h3>
      </div>
      <p className="px-1 pt-2 pb-1 text-sm leading-snug text-ink/75">{product.shortDescription}</p>
    </article>
  )
}
