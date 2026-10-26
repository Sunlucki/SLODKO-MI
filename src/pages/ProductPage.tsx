import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Magnet from '@/components/Magnet'
import { Seo } from '@/components/Seo'
import { catalogLink } from '@/components/product/helpers'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductList } from '@/components/product/ProductList'
import { CtaButton } from '@/components/ui/Button'
import { ChevronRight } from '@/components/ui/icons'
import { Reveal } from '@/components/ui/Reveal'
import { Container, Section, SectionHeading, Sticker } from '@/components/ui/Section'
import { SmartLink } from '@/components/ui/SmartLink'
import { useContent } from '@/content'
import type { ProductT } from '@/content/schema'
import { trackViewItem } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { breadcrumbJsonLd, productJsonLd, type Crumb } from '@/lib/schema-org'
import NotFound from './NotFound'

const label = 'text-[11px] font-extrabold tracking-[0.18em] uppercase'

export default function ProductPage() {
  const { slug = '' } = useParams()
  const product = useContent().getProduct(slug)
  if (!product) return <NotFound />
  // Keyed so gallery state and view tracking reset when navigating between products
  return <ProductView key={product.slug} product={product} />
}

function ProductView({ product }: { product: ProductT }) {
  const c = useContent()
  const { site, catalog } = c
  const ui = site.ui.product
  const path = `/produkt/${product.slug}`
  const location = `product:${product.slug}`
  const list = catalogLink(c)
  const crumbs: Crumb[] = [
    { name: ui.breadcrumbHome, path: '/' },
    { name: list.label, path: list.href },
    { name: product.name, path },
  ]
  const category = catalog.categories.find((cat) => cat.slug === product.category)?.name
  const price = c.formatPrice(product)
  const others = c.products.filter((p) => p.slug !== product.slug)

  useEffect(() => {
    trackViewItem(product)
  }, [product])

  return (
    <>
      <Seo
        title={product.name}
        description={product.shortDescription}
        path={path}
        ogImage={product.images[0].src}
        jsonLd={[productJsonLd(product, c), breadcrumbJsonLd(crumbs, c)]}
      />

      <article aria-labelledby="product-name" className="pt-6 pb-16 md:pt-10 md:pb-20">
        <Container>
          <Breadcrumbs crumbs={crumbs} />

          <div className="mt-6 grid items-start gap-10 lg:mt-8 lg:grid-cols-2 lg:gap-14">
            <ProductGallery images={product.images} muted={!product.available} />

            <div className="lg:pt-4">
              <div className="flex flex-wrap items-center gap-3">
                {category && <p className={`${label} text-brand-deep`}>{category}</p>}
                {product.badge && <Sticker>{product.badge}</Sticker>}
                {!product.available && <span className={cn(label, 'rounded-full bg-ink px-3 py-1.5 text-[10px] text-cream')}>{ui.unavailable}</span>}
              </div>

              <h1 id="product-name" className="mt-4 font-display text-[clamp(3rem,9vw,5.5rem)] leading-[0.92] tracking-tight text-brand-deep uppercase">
                {product.name}
              </h1>
              <p className="mt-6 text-lg leading-snug font-bold">{product.shortDescription}</p>
              <p className="mt-4 max-w-prose leading-relaxed text-ink/80">{product.description}</p>

              {(price || product.weight) && (
                <p className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  {price && <span className="font-display text-4xl text-brand-deep">{price}</span>}
                  {product.weight && <span className={`${label} text-ink/70`}>{product.weight}</span>}
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Magnet padding={60} magnetStrength={4} maxOffset={10}>
                  <CtaButton cta={site.catalog.productCta} location={location} product={product} size="lg" />
                </Magnet>
                {site.catalog.secondaryCta && (
                  <CtaButton cta={site.catalog.secondaryCta} location={location} product={product} size="lg" withCircle={false} />
                )}
              </div>

              <div className="mt-10 grid gap-6 rounded-2xl bg-blush p-5 sm:p-6">
                <div>
                  <h2 className={`${label} text-brand-deep`}>{ui.allergensHeading}</h2>
                  {product.allergens.length > 0 && (
                    <ul role="list" className="mt-3 flex flex-wrap gap-2">
                      {product.allergens.map((a) => (
                        <li key={a} className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold tracking-[0.08em] uppercase">
                          {site.ui.allergenNames[a] ?? a}
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* The note is always shown: an empty or partial allergen list must never read as "no allergens" */}
                  <p className="mt-3 text-sm">{ui.allergyNote}</p>
                </div>
                {product.ingredients.length > 0 && (
                  <div>
                    <h2 className={`${label} text-brand-deep`}>{ui.ingredientsHeading}</h2>
                    <ul className="mt-3 grid gap-1.5 text-sm">
                      {product.ingredients.map((item) => (
                        <li key={item} className="flex items-baseline gap-2">
                          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-brand-deep" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </article>

      {others.length > 0 && ui.otherProductsHeading && (
        <Section id="inne-smaki" labelledBy="inne-smaki-heading" className="pt-4 md:pt-8">
          <Container>
            <Reveal>
              <SectionHeading id="inne-smaki-heading">{ui.otherProductsHeading}</SectionHeading>
            </Reveal>
            <Reveal delay={120} className="mt-10 md:mt-14">
              <ProductList products={others} listName="inne-smaki" />
            </Reveal>
          </Container>
        </Section>
      )}
    </>
  )
}

function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label={useContent().site.ui.common.breadcrumb}>
      <ol className={`${label} flex flex-wrap items-center gap-x-2`}>
        {crumbs.map((crumb, i) => (
          <li key={crumb.path} className="flex min-w-0 items-center gap-2">
            {i > 0 && <ChevronRight width={12} height={12} className="shrink-0 text-brand-deep" />}
            {i < crumbs.length - 1 ? (
              <SmartLink href={crumb.path} location="breadcrumb" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                {crumb.name}
              </SmartLink>
            ) : (
              <span aria-current="page" className="text-brand-deep">
                {crumb.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
