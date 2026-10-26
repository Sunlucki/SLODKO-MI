import { images } from '@/content'
import type { ImageT } from '@/content/schema'
import { asset, cn } from '@/lib/utils'

interface Props {
  image: ImageT
  /** CSS sizes attribute, e.g. "(min-width: 1024px) 33vw, 100vw" */
  sizes: string
  className?: string
  /** Above-the-fold image: eager + high fetch priority (LCP) */
  priority?: boolean
  /** Decorative duplicate: empty alt */
  decorative?: boolean
}

/** Responsive WebP image from the generated manifest (intrinsic width/height prevent layout shift). */
export function Picture({ image, sizes, className, priority, decorative }: Props) {
  const meta = images[image.src]
  if (!meta) return null
  const largest = meta.widths[meta.widths.length - 1]
  const srcSet = meta.widths.map((w) => `${asset(`images/${image.src}-${w}.webp`)} ${w}w`).join(', ')
  return (
    <img
      src={asset(`images/${image.src}-${meta.widths.length > 1 ? meta.widths[1] : largest}.webp`)}
      srcSet={srcSet}
      sizes={sizes}
      width={meta.width}
      height={meta.height}
      alt={decorative ? '' : image.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      {...(priority ? { fetchPriority: 'high' as const } : {})}
      className={cn('block', className)}
    />
  )
}
