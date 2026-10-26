import type { RouteRecord } from 'vite-react-ssg'
import Layout from '@/components/layout/Layout'
import { pages, products } from '@/content'
import NotFound from '@/pages/NotFound'
import PageRenderer from '@/pages/PageRenderer'
import ProductPage from '@/pages/ProductPage'

// Every JSON file in src/data/pages becomes a pre-rendered route, so an LLM can add,
// remove or restructure pages by editing content only. Product pages come from products.json.
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    entry: 'src/components/layout/Layout.tsx',
    children: [
      ...pages.map((page) =>
        page.path === '/' ? { index: true, element: <PageRenderer page={page} /> } : { path: page.path.replace(/^\/|\/$/g, ''), element: <PageRenderer page={page} /> },
      ),
      {
        path: 'produkt/:slug',
        element: <ProductPage />,
        getStaticPaths: () => products.map((p) => `produkt/${p.slug}`),
      },
      { path: '404', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]
