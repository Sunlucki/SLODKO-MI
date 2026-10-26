import { useEffect, useRef, useState } from 'react'
import { site } from '@/content'
import type { ImageT } from '@/content/schema'
import { Picture } from '@/components/ui/Picture'
import { MapPin } from '@/components/ui/icons'
import { trackEngagement } from '@/lib/analytics'

const sizes = '(min-width: 1152px) 540px, (min-width: 1024px) 47vw, calc(100vw - 2rem)'

/** Photo panel; with `showMap` it offers a click-to-load Google Map (nothing is requested from Google before the click). */
export function MapPanel({ id, image, showMap }: { id: string; image?: ImageT; showMap: boolean }) {
  const [open, setOpen] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)
  const noteId = `${id}-map-note`

  // The button disappears on click, so hand keyboard focus to the map
  useEffect(() => {
    if (open) frame.current?.focus()
  }, [open])

  return (
    <div className="relative min-h-[22rem] overflow-hidden rounded-frame bg-brand-deep sm:min-h-[28rem]">
      {open ? (
        <iframe
          ref={frame}
          src={site.links.mapEmbed}
          title={`Mapa Google — ${site.legalName}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <>
          {image && <Picture image={image} sizes={sizes} className="absolute inset-0 size-full object-cover" />}
          {showMap && (
            <div className="absolute inset-0 flex flex-col items-center justify-end gap-3 bg-linear-to-t from-ink/85 via-ink/30 to-transparent p-6 text-center text-cream">
              <button
                type="button"
                aria-describedby={noteId}
                onClick={() => {
                  setOpen(true)
                  trackEngagement('open_map')
                }}
                className="group inline-flex items-center gap-1 rounded-full font-sans text-xs font-extrabold tracking-[0.08em] uppercase"
              >
                <span className="inline-flex h-12 items-center rounded-full bg-cream px-6 text-brand-deep transition-colors group-hover:bg-white">
                  {site.ui.visit.showMap}
                </span>
                <span aria-hidden className="inline-grid size-12 place-items-center rounded-full bg-caramel text-ink transition-transform duration-300 group-hover:-rotate-12">
                  <MapPin width={18} height={18} />
                </span>
              </button>
              <p id={noteId} className="text-[11px] font-semibold tracking-[0.08em]">
                {site.ui.visit.mapNote}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
