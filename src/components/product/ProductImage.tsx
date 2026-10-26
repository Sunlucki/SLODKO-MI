import type { ImageT } from '@/content/schema'
import { AiBadge } from '@/components/ui/AiBadge'
import { Picture } from '@/components/ui/Picture'
import { cn } from '@/lib/utils'
import { isCutout } from './helpers'

interface Props {
  image: ImageT
  sizes: string
  /** Sizing/shape of the frame, e.g. "aspect-square rounded-xl" */
  className?: string
  priority?: boolean
  /** Unavailable product: desaturated */
  muted?: boolean
  /** false hides the "Ilustracja" label of AI-generated images (tiny thumbnails; the main image shows it) */
  aiBadge?: boolean
}

/**
 * Product photo frame that works for both kinds of images: a transparent cut-out floats
 * (object-contain) on a soft blush glow, a regular photo fills the frame (object-cover).
 * Hover motion needs a `group` ancestor (the product card). AI-generated images get a visible label.
 */
export function ProductImage({ image, sizes, className, priority, muted, aiBadge = true }: Props) {
  const cutout = isCutout(image)
  return (
    <div className={cn('relative overflow-hidden bg-radial from-blush from-10% to-cream to-75%', className)}>
      <Picture
        image={image}
        sizes={sizes}
        priority={priority}
        className={cn(
          'size-full transition-[transform,filter,opacity] duration-500 ease-out',
          cutout
            ? 'object-contain p-[9%] drop-shadow-xl drop-shadow-ink/25 motion-safe:group-hover:scale-105 motion-safe:group-hover:-rotate-6'
            : 'object-cover motion-safe:group-hover:scale-105',
          muted && 'opacity-60 grayscale',
        )}
      />
      {aiBadge && image.aiGenerated && <AiBadge className="absolute top-3 left-3" />}
    </div>
  )
}
