import type { PageT, SectionOf, SectionT } from '@/content/schema'

export interface SectionProps<K extends SectionT['type']> {
  section: SectionOf<K>
  page: PageT
  /** Position on the page (0 = first) — the first section may render priority images */
  index: number
}
