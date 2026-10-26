// npm run content:check — validates all content (also runs before every build).
import { loadEnv } from 'vite'
import { loadContent } from '../src/content/validate'

const { content, errors } = loadContent()
if (!content) {
  console.error(`✗ Content is invalid (${errors.length} problem${errors.length === 1 ? '' : 's'}):\n`)
  for (const e of errors) console.error(`  • ${e}`)
  process.exit(1)
}

// Informed consent (GDPR art. 7 and 13): every tracker this build enables must be named in the cookie banner
// and in the privacy policy. IDs come from the shell or .env / .env.local, exactly as the build reads them.
const env = loadEnv('production', process.cwd(), 'VITE_')
const VENDORS = [
  { id: 'VITE_GA_ID', name: 'Google Analytics', pattern: /Google Analytics/i },
  { id: 'VITE_META_PIXEL_ID', name: 'Meta Pixel', pattern: /\bMeta\b/ },
  { id: 'VITE_TIKTOK_PIXEL_ID', name: 'TikTok', pattern: /TikTok/i },
  { id: 'VITE_GTM_ID', name: 'Google Tag Manager', pattern: /Google Tag Manager/i },
]
const { consent } = content.site
const bannerText = [consent.text, consent.analyticsText, consent.marketingText].join('\n')
const policyPath = consent.policyHref.split('#')[0].replace(/(.)\/$/, '$1')
const policy = content.pages.find((p) => p.path === policyPath)
const policyText = policy ? JSON.stringify(policy.sections) : ''
const consentErrors: string[] = []
for (const v of VENDORS.filter((v) => env[v.id])) {
  if (!v.pattern.test(bannerText))
    consentErrors.push(`${v.id} is set, but "${v.name}" is not named in site.json → consent (text, analyticsText or marketingText)`)
  if (policy && !v.pattern.test(policyText))
    consentErrors.push(`${v.id} is set, but "${v.name}" is not named in the privacy policy (${consent.policyHref})`)
}
if (consentErrors.length) {
  console.error(`✗ Consent texts do not name every enabled tracker:\n`)
  for (const e of consentErrors) console.error(`  • ${e}`)
  console.error(`\n  Name the vendor and purpose in both places (visitors are asked again automatically), or unset the ID.`)
  process.exit(1)
}
if (!policy && VENDORS.some((v) => env[v.id])) console.warn(`⚠ Privacy policy ${consent.policyHref} is not a page of this site: check by hand that it names every tracker`)

const sections = content.pages.reduce((n, p) => n + p.sections.length, 0)
console.log(
  `✓ Content OK — ${content.pages.length} pages, ${sections} sections, ${content.catalog.products.length} products, ` +
    `${content.reviews.items.length} reviews, ${Object.keys(content.images).length} images`,
)
