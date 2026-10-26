import type { RouteRecord } from 'vite-react-ssg'
import Layout from '@/components/layout/Layout'
import RouteError from '@/components/layout/RouteError'
import { contentFor, defaultLocale, locales } from '@/content'
import NotFound from '@/pages/NotFound'
import PageRenderer from '@/pages/PageRenderer'
import ProductPage from '@/pages/ProductPage'

// Every JSON file in src/data/pages becomes a pre-rendered route in every language
// ("/", "/en/", "/ru/"…), so an LLM can add, remove or restructure pages by editing content only.
// Product pages come from products.json; each language also gets its own 404 page.
const localeRoutes = locales.flatMap(({ code }) => {
  const c = contentFor(code)
  const prefix = code === defaultLocale ? '' : `${code}/`
  return [
    ...c.pages.map((page) => {
      const path = (prefix + page.path.replace(/^\/|\/$/g, '')).replace(/\/$/, '')
      return path ? { path, element: <PageRenderer page={page} /> } : { index: true, element: <PageRenderer page={page} /> }
    }),
    {
      path: `${prefix}produkt/:slug`,
      element: <ProductPage />,
      getStaticPaths: () => c.products.map((p) => `${prefix}produkt/${p.slug}`),
    },
    // 404 page of this language: postbuild turns it into <prefix>404.html, which Apache serves for
    // missing URLs under the prefix (public/.htaccess)
    { path: `${prefix}404`, element: <NotFound /> },
  ]
})

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    // Recovers tabs whose client-side navigation fails after a redeploy
    errorElement: <RouteError />,
    entry: 'src/components/layout/Layout.tsx',
    children: [...localeRoutes, { path: '*', element: <NotFound /> }],
  },
]
