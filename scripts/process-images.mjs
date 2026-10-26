// Source photos live in assets/images/<group>/<name>.(jpg|jpeg|png|webp).
// This script writes responsive WebP variants to public/images/<group>/<name>-<width>.webp
// and a manifest (src/generated/images.json) that components and the content validator use.
// Images under assets/images/og/ additionally get a 1200×630 JPG for social previews, and so do
// transparent cut-outs (<key>-og.jpg, flattened onto the site's cream background — og:image of product pages).
//
//   npm run images
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SRC = 'assets/images'
const OUT = 'public/images'
const MANIFEST = 'src/generated/images.json'
const WIDTHS = [480, 600, 720, 960, 1600]
const CREAM = JSON.parse(await readFile('src/data/site.json', 'utf8')).theme.colors.cream

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) out.push(full)
  }
  return out
}

async function isFresh(src, dest) {
  try {
    return (await stat(dest)).mtimeMs >= (await stat(src)).mtimeMs
  } catch {
    return false
  }
}

const manifest = {}
for (const file of (await walk(SRC)).sort()) {
  const key = path.relative(SRC, file).replace(/\\/g, '/').replace(/\.[^.]+$/, '')
  const meta = await sharp(file).rotate().metadata()
  const width = meta.autoOrient?.width ?? meta.width
  const height = meta.autoOrient?.height ?? meta.height
  const alpha = Boolean(meta.hasAlpha)
  // Skip a step that is within 5% of the original width (it would be a near-duplicate file)
  const widths = WIDTHS.filter((w) => w < width * 0.95).concat(width < WIDTHS.at(-1) ? [width] : [WIDTHS.at(-1)])
  const unique = [...new Set(widths)].sort((a, b) => a - b)

  // Remove variants of this image that are no longer generated (e.g. after the width list changed)
  const dir = path.dirname(path.join(OUT, key))
  const prefix = `${path.basename(key)}-`
  for (const f of await readdir(dir).catch(() => [])) {
    const w = f.startsWith(prefix) && f.endsWith('.webp') ? Number(f.slice(prefix.length, -5)) : NaN
    if (Number.isInteger(w) && !unique.includes(w)) await rm(path.join(dir, f))
  }

  await mkdir(path.dirname(path.join(OUT, key)), { recursive: true })
  for (const w of unique) {
    const dest = path.join(OUT, `${key}-${w}.webp`)
    if (await isFresh(file, dest)) continue
    await sharp(file)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: alpha ? 72 : 70, alphaQuality: 80, effort: 6, smartSubsample: true })
      .toFile(dest)
  }
  if (key.startsWith('og/')) {
    const dest = path.join(OUT, `${key}.jpg`)
    if (!(await isFresh(file, dest)))
      await sharp(file).rotate().resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(dest)
  } else if (alpha) {
    // Social apps show transparency as black and crop to ~1.91:1, so centre the cut-out on cream with a margin
    const dest = path.join(OUT, `${key}-og.jpg`)
    if (!(await isFresh(file, dest)))
      await sharp(file)
        .rotate()
        .resize(1080, 560, { fit: 'contain', background: CREAM })
        .extend({ top: 35, bottom: 35, left: 60, right: 60, background: CREAM })
        .flatten({ background: CREAM })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(dest)
  }
  manifest[key] = { width, height, widths: unique, alpha }
  console.log(`✓ ${key} (${width}×${height}${alpha ? ', alpha' : ''}) → ${unique.join(', ')}`)
}

await mkdir(path.dirname(MANIFEST), { recursive: true })
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
console.log(`\n${Object.keys(manifest).length} images → ${MANIFEST}`)
