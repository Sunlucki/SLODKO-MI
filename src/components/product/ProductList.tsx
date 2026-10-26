import { useEffect, useRef } from 'react'
import type { ProductT } from '@/content/schema'
import { trackViewItemList } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { ProductCard } from './ProductCard'

interface Props {
  products: ProductT[]
  /** List identifier for analytics (view_item_list / select_item) */
  listName: string
  className?: string
}

/**
 * Product cards: swipeable scroll-snap row on phones, 2 columns from sm, 4 from lg.
 * Incomplete last rows are centred (7 products → 4 + 3). Reports view_item_list once
 * when the list first scrolls into view.
 */
export function ProductList({ products, listName, className }: Props) {
  const ref = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        trackViewItemList(products, listName)
        io.disconnect()
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
    // Once per mount — content is static; remount (key) to track a different list
  }, [])

  return (
    <ul
      ref={ref}
      role="list"
      className={cn(
        // Phones: bleed to the screen edges (Container has px-4) and leave room for the hover lift/focus ring
        '-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        'sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 lg:gap-5',
        className,
      )}
    >
      {products.map((product, i) => (
        <li key={product.slug} className="w-[78%] max-w-80 shrink-0 snap-start sm:w-[calc(50%-0.5rem)] sm:max-w-none lg:w-[calc(25%-0.9375rem)]">
          <ProductCard product={product} index={i} listName={listName} />
        </li>
      ))}
    </ul>
  )
}
