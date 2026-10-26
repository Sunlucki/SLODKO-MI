import { useState } from 'react'
import type { ImageT } from '@/content/schema'
import { cn } from '@/lib/utils'
import { ProductImage } from './ProductImage'

// Half of the max-w-6xl container on desktop, full width (minus gutters) below lg
const MAIN_SIZES = '(min-width: 1152px) 548px, (min-width: 1024px) 46vw, calc(100vw - 2rem)'

/** Main product photo (page LCP) with thumbnails when the product has more than one image. */
export function ProductGallery({ images, muted }: { images: ImageT[]; muted?: boolean }) {
  const [active, setActive] = useState(0)
  return (
    <div className="lg:sticky lg:top-8">
      <ProductImage image={images[active]} sizes={MAIN_SIZES} priority muted={muted} className="aspect-square rounded-frame" />
      {images.length > 1 && (
        <ul role="list" className="mt-4 flex flex-wrap gap-3">
          {images.map((image, i) => (
            <li key={image.src}>
              {/* Accessible name = the thumbnail's alt text */}
              <button
                type="button"
                aria-pressed={i === active}
                onClick={() => setActive(i)}
                className={cn(
                  'block size-20 overflow-hidden rounded-2xl ring-2 ring-offset-2 ring-offset-cream transition-opacity focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-caramel',
                  i === active ? 'ring-brand-deep' : 'ring-transparent opacity-70 hover:opacity-100',
                )}
              >
                <ProductImage image={image} sizes="80px" className="size-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
