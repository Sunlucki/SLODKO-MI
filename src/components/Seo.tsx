import { Head } from 'vite-react-ssg'
import { localizePath, locales, useContent } from '@/content'
import type { PageT } from '@/content/schema'
import { pageUrl, socialImage } from '@/lib/schema-org'

interface Props {
  title: string
  description: string
  /** Path without base and language prefix, e.g. "/" or "/produkt/oreo" */
  path: string
  ogImage?: string
  noindex?: boolean
  /** JSON-LD objects for this page */
  jsonLd?: object[]
}

/**
 * Per-page <head> in the page's language: title, description, canonical, hreflang alternates
 * (every language version + x-default = default language), Open Graph, Twitter, JSON-LD.
 */
export function Seo({ title, description, path, ogImage, noindex, jsonLd = [] }: Props) {
  const c = useContent()
  const { site } = c
  const fullTitle = site.seo.titleTemplate.replace('%s', title)
  const url = pageUrl(c.localize(path))
  const image = socialImage(ogImage ?? site.seo.ogImage)
  const ogLocale = locales.find((l) => l.code === c.locale)?.ogLocale
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {/* noindex pages get no canonical (the two signals contradict each other) and no hreflang */}
      {noindex ? <meta name="robots" content="noindex,follow" /> : <link rel="canonical" href={url} />}
      {!noindex &&
        locales.map((l) => <link key={l.code} rel="alternate" hrefLang={l.htmlLang} href={pageUrl(localizePath(path, l.code))} />)}
      {!noindex && <link rel="alternate" hrefLang="x-default" href={pageUrl(path)} />}
      <meta property="og:type" content="website" />
      {ogLocale && <meta property="og:locale" content={ogLocale} />}
      {locales
        .filter((l) => l.code !== c.locale)
        .map((l) => (
          <meta key={l.code} property="og:locale:alternate" content={l.ogLocale} />
        ))}
      <meta property="og:site_name" content={site.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image.url} />
      <meta property="og:image:width" content={String(image.width)} />
      <meta property="og:image:height" content={String(image.height)} />
      <meta name="twitter:card" content="summary_large_image" />
      {jsonLd.map((data, i) => (
        <script key={i} type="application/ld+json">
          {/* Escape "<" so content can never close the script tag */}
          {JSON.stringify(data).replace(/</g, '\\u003c')}
        </script>
      ))}
    </Head>
  )
}

/** SEO of a page from src/data/pages (page = its language version, path = default-language path). */
export function PageSeo({ page, jsonLd }: { page: PageT; jsonLd?: object[] }) {
  return <Seo title={page.seo.title} description={page.seo.description} path={page.path} ogImage={page.seo.ogImage} noindex={page.seo.noindex} jsonLd={jsonLd} />
}
