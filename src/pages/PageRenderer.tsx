import { PageSeo } from '@/components/Seo'
import { useContent, type Localized } from '@/content'
import type { PageT } from '@/content/schema'
import { bakeryJsonLd, breadcrumbJsonLd, faqJsonLd, websiteJsonLd } from '@/lib/schema-org'
import { RenderSections } from '@/sections/registry'

/** Structured data: business + website on the home page, breadcrumbs elsewhere; FAQPage wherever a FAQ section is shown. */
function pageJsonLd(page: PageT, c: Localized): object[] {
  const base =
    page.path === '/'
      ? [bakeryJsonLd(c), websiteJsonLd(c)]
      : [
          breadcrumbJsonLd(
            [
              { name: c.site.ui.product.breadcrumbHome, path: '/' },
              { name: page.seo.title, path: page.path },
            ],
            c,
          ),
        ]
  const faq = page.sections.flatMap((s) => (s.enabled && s.type === 'faq' ? s.items : []))
  return faq.length > 0 ? [...base, faqJsonLd(faq, c)] : base
}

/** Renders any page defined in src/data/pages/*.json (in the language version the route passes). */
export default function PageRenderer({ page }: { page: PageT }) {
  const c = useContent()
  return (
    <>
      <PageSeo page={page} jsonLd={pageJsonLd(page, c)} />
      <RenderSections page={page} />
    </>
  )
}
