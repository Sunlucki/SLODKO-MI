import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ProductT } from '@/content/schema'
import { trackAction, type TrackLocation } from '@/lib/analytics'
import { resolveHref } from '@/lib/links'

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** Content href: path, URL or @token (see src/lib/links.ts) */
  href: string
  /** Analytics location label, e.g. "hero", "footer" */
  location: TrackLocation
  product?: ProductT
  children: ReactNode
}

/** The only way components render content links: resolves @tokens, handles base path and fires tracking. */
export function SmartLink({ href, location, product, onClick, children, ...rest }: Props) {
  const link = resolveHref(href)
  const handleClick: Props['onClick'] = (e) => {
    if (link.action) trackAction(link.action, location, product)
    onClick?.(e)
  }
  if (link.external)
    return (
      <a href={link.href} {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})} onClick={handleClick} {...rest}>
        {children}
      </a>
    )
  return (
    <Link to={link.href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  )
}
