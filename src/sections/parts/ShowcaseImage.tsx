import { Picture } from '@/components/ui/Picture'
import { images } from '@/content'
import type { ImageT } from '@/content/schema'
import { cn } from '@/lib/utils'

/**
 * Centre-piece product shot on a coloured panel. Transparent cut-outs (alpha in the image manifest)
 * float with a soft shadow; regular photos are cropped into a round "plate" so they still read as a cut-out.
 */
export function ShowcaseImage({ image, sizes, className }: { image: ImageT; sizes: string; className?: string }) {
  const cutout = images[image.src]?.alpha
  return (
    <Picture
      image={image}
      sizes={sizes}
      className={cn(
        cutout
          ? 'h-auto object-contain drop-shadow-[0_24px_28px_rgb(0_0_0/0.3)]'
          : 'aspect-square rounded-full object-cover shadow-[0_28px_50px_-18px_rgb(0_0_0/0.55)] ring-8 ring-cream/40',
        className,
      )}
    />
  )
}
