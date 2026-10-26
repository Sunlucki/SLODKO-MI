// npm run content:check — validates all content (also runs before every build).
import { loadContent } from '../src/content/validate'

const { content, errors } = loadContent()
if (!content) {
  console.error(`✗ Content is invalid (${errors.length} problem${errors.length === 1 ? '' : 's'}):\n`)
  for (const e of errors) console.error(`  • ${e}`)
  process.exit(1)
}
const sections = content.pages.reduce((n, p) => n + p.sections.length, 0)
console.log(
  `✓ Content OK — ${content.pages.length} pages, ${sections} sections, ${content.catalog.products.length} products, ` +
    `${content.reviews.items.length} reviews, ${Object.keys(content.images).length} images`,
)
