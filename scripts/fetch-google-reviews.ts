/**
 * npm run reviews:fetch — refreshes src/data/reviews.json from Google Places API (New).
 *
 * Env: GOOGLE_PLACES_API_KEY (required), GOOGLE_PLACE_ID (optional — without it the place is searched
 * by site.json legalName + address and the found id is printed so you can save it).
 * Fetched reviews replace the stored ones (Places content may be cached for 30 days at most), newest
 * first; they are validated with the Reviews schema and only then written. With a place id, site.json → links.writeReview is pointed at
 * Google's "write a review" form (only that field is touched).
 *
 * --dry-run: fetch and print the result without writing any file.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Reviews, type ReviewsT, type SiteT } from '../src/content/schema.ts'

type Review = ReviewsT['items'][number]

interface PlaceReview {
  rating?: number
  text?: { text?: string }
  originalText?: { text?: string }
  relativePublishTimeDescription?: string
  publishTime?: string
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string }
}

interface PlaceDetails {
  rating?: number
  userRatingCount?: number
  reviews?: PlaceReview[]
  googleMapsUri?: string
}

interface SearchResult {
  places?: { id: string; displayName?: { text?: string }; formattedAddress?: string; googleMapsUri?: string }[]
}

const API = 'https://places.googleapis.com/v1'
const REVIEWS_FILE = path.resolve('src/data/reviews.json')
const SITE_FILE = path.resolve('src/data/site.json')
const dryRun = process.argv.includes('--dry-run')

function fail(message: string): never {
  console.error(`✗ ${message}`)
  process.exit(1)
}

try {
  process.loadEnvFile()
} catch {
  // No .env file — use the environment as is (CI secrets)
}
const apiKey =
  process.env.GOOGLE_PLACES_API_KEY ||
  fail('GOOGLE_PLACES_API_KEY is not set. Add it to .env (local) or to the repository secrets (GitHub Actions). See .env.example.')

async function places<T>(url: string, fieldMask: string, body?: object): Promise<T> {
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': fieldMask },
    body: body && JSON.stringify(body),
  })
  if (!res.ok) fail(`Places API ${res.status} ${res.statusText} (${url}):\n${await res.text()}`)
  return (await res.json()) as T
}

async function findPlaceId(site: SiteT): Promise<string> {
  const { legalName, address } = site
  const textQuery = `${legalName}, ${address.street}, ${address.postalCode} ${address.city}`
  const { places: found = [] } = await places<SearchResult>(
    `${API}/places:searchText`,
    'places.id,places.displayName,places.formattedAddress,places.googleMapsUri',
    {
      textQuery,
      languageCode: 'pl',
      locationBias: { circle: { center: { latitude: address.geo.lat, longitude: address.geo.lng }, radius: 500 } },
    },
  )
  const place = found[0] ?? fail(`No Google place found for "${textQuery}". Set GOOGLE_PLACE_ID manually.`)
  console.log(`Found place: ${place.displayName?.text} — ${place.formattedAddress}\n  ${place.googleMapsUri}`)
  console.log(`  GOOGLE_PLACE_ID=${place.id}  ← save it in .env / repository variables to skip the search`)
  return place.id
}

function toReview(r: PlaceReview): Review | null {
  const author = r.authorAttribution?.displayName?.trim()
  const text = (r.text?.text ?? r.originalText?.text)?.trim()
  if (!author || !text || !r.rating) return null
  const photo = r.authorAttribution?.photoUri
  return {
    author,
    rating: r.rating,
    text,
    relativeTime: r.relativePublishTimeDescription,
    publishTime: r.publishTime,
    // Google returns protocol-relative photo URLs ("//lh3.googleusercontent.com/…")
    authorPhoto: photo?.startsWith('//') ? `https:${photo}` : photo,
    authorUrl: r.authorAttribution?.uri,
  }
}

/** Same author + same beginning of the text = same review (also matches shortened copies edited by hand). */
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const dedupeKey = (r: Review) => `${norm(r.author)}|${norm(r.text).slice(0, 40)}`

const site = JSON.parse(readFileSync(SITE_FILE, 'utf8')) as SiteT
const current = JSON.parse(readFileSync(REVIEWS_FILE, 'utf8')) as ReviewsT

const placeId = process.env.GOOGLE_PLACE_ID || (await findPlaceId(site))
const details = await places<PlaceDetails>(`${API}/places/${encodeURIComponent(placeId)}?languageCode=pl`, 'rating,userRatingCount,reviews,googleMapsUri')

const fetched = (details.reviews ?? []).map(toReview).filter((r): r is Review => r !== null)
// Google Maps Platform terms allow caching Places content for at most 30 days, so every run replaces
// the stored reviews with the current API response (kept as-is when the API returns none).
const items = (fetched.length ? fetched : current.items)
  .slice()
  // Newest first (ISO dates compare as strings); undated reviews keep their order after the dated ones
  .sort((a, b) => {
    const [x, y] = [a.publishTime ?? '', b.publishTime ?? '']
    return x < y ? 1 : x > y ? -1 : 0
  })

const result = Reviews.safeParse({
  ...current,
  rating: details.rating ?? current.rating,
  count: details.userRatingCount ?? current.count,
  fetchedAt: new Date().toISOString().slice(0, 10),
  items,
})
if (!result.success)
  fail(`Fetched data does not match the Reviews schema — nothing written:\n${result.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n')}`)

const known = new Set(current.items.map(dedupeKey))
const added = fetched.filter((r) => !known.has(dedupeKey(r))).length
console.log(
  `✓ Google: ${result.data.rating} ★ from ${result.data.count} ratings — fetched ${fetched.length} reviews, ${added} new, ${result.data.items.length} stored`,
)

// links.writeReview: replace only that value so the rest of site.json keeps its hand formatting
const writeReview = `https://search.google.com/local/writereview?placeid=${placeId}`
const siteRaw = readFileSync(SITE_FILE, 'utf8')
const siteNext = siteRaw.replace(/("writeReview"\s*:\s*)"(?:[^"\\]|\\.)*"/, (_, prefix: string) => prefix + JSON.stringify(writeReview))
if ((JSON.parse(siteNext) as SiteT).links.writeReview !== writeReview) fail(`Could not update links.writeReview in ${SITE_FILE}`)

if (dryRun) {
  console.log('\n--dry-run: nothing written. reviews.json would be:\n')
  console.log(JSON.stringify(result.data, null, 2))
  console.log(`\nsite.json links.writeReview → ${writeReview}${siteNext === siteRaw ? ' (unchanged)' : ''}`)
} else {
  writeFileSync(REVIEWS_FILE, JSON.stringify(result.data, null, 2) + '\n')
  console.log(`  wrote ${path.relative(process.cwd(), REVIEWS_FILE)}`)
  if (siteNext !== siteRaw) {
    writeFileSync(SITE_FILE, siteNext)
    console.log(`  updated links.writeReview in ${path.relative(process.cwd(), SITE_FILE)}`)
  }
}
