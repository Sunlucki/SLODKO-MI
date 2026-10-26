import { useParams } from 'react-router-dom'
import { getProduct } from '@/content'
import NotFound from './NotFound'

export default function ProductPage() {
  const { slug = '' } = useParams()
  const product = getProduct(slug)
  if (!product) return <NotFound />
  return <h1 className="p-16 font-display text-5xl">{product.name}</h1>
}
