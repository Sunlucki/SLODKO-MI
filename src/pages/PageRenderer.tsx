import { PageSeo } from '@/components/Seo'
import { getPage } from '@/content'
import type { PageT } from '@/content/schema'
import { bakeryJsonLd, breadcrumbJsonLd, faqJsonLd, websiteJsonLd } from '@/lib/schema-org'
import { RenderSections } from '@/sections/registry'

/** Structured data: business + website on the home page, breadcrumbs elsewhere; FAQPage wherever a FAQ section is shown. */
function pageJsonLd(page: PageT): object[] {
  const base =
    page.path === '/'
      ? [bakeryJsonLd(), websiteJsonLd()]
      : [
          breadcrumbJsonLd([
            { name: 'Strona główna', path: '/' },
            { name: page.seo.title, path: page.path },
          ]),
        ]
  const faq = page.sections.flatMap((s) => (s.enabled && s.type === 'faq' ? s.items : []))
  return faq.length > 0 ? [...base, faqJsonLd(faq)] : base
}

/** Renders any page defined in src/data/pages/*.json. */
export default function PageRenderer({ page }: { page: PageT }) {
  return (
    <>
      <PageSeo page={page} jsonLd={pageJsonLd(page)} />
      <RenderSections page={page} />
    </>
  )
}

export function pageByPath(path: string): PageT {
  const page = getPage(path)
  if (!page) throw new Error(`No page for ${path}`)
  return page
}
