// Source photos live in assets/images/<group>/<name>.(jpg|jpeg|png|webp).
// This script writes responsive WebP variants to public/images/<group>/<name>-<width>.webp
// and a manifest (src/generated/images.json) that components and the content validator use.
// Images under assets/images/og/ additionally get a 1200×630 JPG for social previews.
//
//   npm run images
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SRC = 'assets/images'
const OUT = 'public/images'
const MANIFEST = 'src/generated/images.json'
const WIDTHS = [480, 960, 1600]

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
  const widths = WIDTHS.filter((w) => w < width).concat(width < WIDTHS.at(-1) ? [width] : [WIDTHS.at(-1)])
  const unique = [...new Set(widths)].sort((a, b) => a - b)

  await mkdir(path.dirname(path.join(OUT, key)), { recursive: true })
  for (const w of unique) {
    const dest = path.join(OUT, `${key}-${w}.webp`)
    if (await isFresh(file, dest)) continue
    await sharp(file)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: alpha ? 82 : 76, alphaQuality: 90, effort: 5 })
      .toFile(dest)
  }
  if (key.startsWith('og/')) {
    const dest = path.join(OUT, `${key}.jpg`)
    if (!(await isFresh(file, dest)))
      await sharp(file).rotate().resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(dest)
  }
  manifest[key] = { width, height, widths: unique, alpha }
  console.log(`✓ ${key} (${width}×${height}${alpha ? ', alpha' : ''}) → ${unique.join(', ')}`)
}

await mkdir(path.dirname(MANIFEST), { recursive: true })
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
console.log(`\n${Object.keys(manifest).length} images → ${MANIFEST}`)
