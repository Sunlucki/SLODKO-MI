import { site } from '@/content'

export default function Header() {
  return <header className="p-4 font-display text-2xl text-brand-deep">{site.logo.wordmark}</header>
}
