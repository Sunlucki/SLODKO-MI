import { PageSeo } from '@/components/Seo'
import { getPage } from '@/content'
import type { PageT } from '@/content/schema'
import { RenderSections } from '@/sections/registry'

/** Renders any page defined in src/data/pages/*.json. */
export default function PageRenderer({ page }: { page: PageT }) {
  return (
    <>
      <PageSeo page={page} />
      <RenderSections page={page} />
    </>
  )
}

export function pageByPath(path: string): PageT {
  const page = getPage(path)
  if (!page) throw new Error(`No page for ${path}`)
  return page
}
