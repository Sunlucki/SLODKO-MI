import { useId } from 'react'
import { formatPrice } from '@/content'
import type { ProductT } from '@/content/schema'
import { Plus } from '@/components/ui/icons'
import { SmartLink } from '@/components/ui/SmartLink'
import { trackSelectItem } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { ProductImage } from './ProductImage'

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
  const price = formatPrice(product)
  const tag = price ?? product.badge
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col rounded-2xl border bg-white p-3 text-ink transition-[transform,box-shadow] duration-300',
        'hover:shadow-xl hover:shadow-brand-deep/15 motion-safe:hover:-translate-y-1',
        'has-[a:focus-visible]:ring-4 has-[a:focus-visible]:ring-caramel motion-safe:has-[a:focus-visible]:-translate-y-1',
        product.available ? 'border-brand-deep' : 'border-ink/30',
      )}
    >
      <div className="relative">
        <ProductImage image={product.images[0]} sizes={SIZES} muted={!product.available} className="aspect-square rounded-xl" />
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
            Chwilowo niedostępna
          </span>
        )}
      </div>

      {/* The pill floats right so long names wrap underneath it instead of into a narrow column */}
      <div className="flow-root px-1 pt-4">
        {tag && (
          <span
            className={cn(
              'float-right mt-0.5 ml-3 rounded-full px-3 py-1.5 text-[10px] font-extrabold tracking-[0.12em] whitespace-nowrap uppercase',
              price ? 'bg-brand-deep text-cream' : 'bg-caramel text-ink',
            )}
          >
            {tag}
          </span>
        )}
        <h3 className={cn('font-display text-2xl leading-[1.05] uppercase', product.available ? 'text-brand-deep' : 'text-ink/70')}>
          <SmartLink
            href={`/produkt/${product.slug}`}
            location={`product-card:${listName}`}
            onClick={() => trackSelectItem(product, listName, index)}
            aria-describedby={product.available ? undefined : statusId}
            className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none"
          >
            <span aria-hidden className="text-brand">
              ((&nbsp;
            </span>
            {product.name}
            <span aria-hidden className="text-brand">
              &nbsp;))
            </span>
          </SmartLink>
        </h3>
      </div>
      <p className="px-1 pt-2 pb-1 text-sm leading-snug text-ink/75">{product.shortDescription}</p>
    </article>
  )
}
