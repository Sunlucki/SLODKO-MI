import { Head } from 'vite-react-ssg'
import { site } from '@/content'
import type { PageT } from '@/content/schema'
import { imageUrl, pageUrl } from '@/lib/schema-org'

interface Props {
  title: string
  description: string
  /** Path without base, e.g. "/" or "/produkt/oreo" */
  path: string
  ogImage?: string
  noindex?: boolean
  /** JSON-LD objects for this page */
  jsonLd?: object[]
}

/** Per-page <head>: title, description, canonical, Open Graph, Twitter, JSON-LD. */
export function Seo({ title, description, path, ogImage, noindex, jsonLd = [] }: Props) {
  const fullTitle = site.seo.titleTemplate.replace('%s', title)
  const url = pageUrl(path)
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {/* noindex pages get no canonical — the two signals contradict each other */}
      {noindex ? <meta name="robots" content="noindex,follow" /> : <link rel="canonical" href={url} />}
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="pl_PL" />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl(ogImage ?? site.seo.ogImage)} />
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

export function PageSeo({ page, jsonLd }: { page: PageT; jsonLd?: object[] }) {
  return <Seo title={page.seo.title} description={page.seo.description} path={page.path} ogImage={page.seo.ogImage} noindex={page.seo.noindex} jsonLd={jsonLd} />
}
