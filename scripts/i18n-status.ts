/**
 * npm run i18n:status — how complete each translation (src/data/i18n/<locale>/) is, per language and file. Exit 0.
 * npm run i18n:check  — the same, but exit 1 while any language misses texts. CI runs it as a warning only: a missing
 *                       text shows in Polish, so it never breaks the site.
 *
 *   --missing   also list the missing texts (path in the file → Polish text)
 *   <locale>…   only these languages, e.g. npm run i18n:status -- en --missing
 */
import { languages, percent, translations } from './lib/content-store.ts'

const args = process.argv.slice(2)
const check = args.includes('--check')
const listMissing = args.includes('--missing')
const only = args.filter((a) => !a.startsWith('--'))

const { locales, translations: codes } = languages()
const unknown = only.filter((code) => !codes.includes(code))
if (unknown.length) {
  console.error(`✗ Not a translation language: ${unknown.join(', ')} (available: ${codes.join(', ') || 'none'})`)
  process.exit(2)
}
const report = translations()
if (!report) {
  console.error('✗ Content is invalid, so translations cannot be compared — run `npm run content:check` and fix the errors first.')
  process.exit(1)
}
const files = report.files.filter((f) => !only.length || only.includes(f.locale))
if (!files.length) {
  console.log(`No translation languages in site.json → i18n.locales (default language: ${report.defaultLocale}).`)
  process.exit(0)
}

// ── Table (Markdown, also readable in a terminal and in a GitHub step summary) ──

const rows: string[][] = [['Language', 'File', 'Translated', '%', 'Missing']]
const summary: { code: string; label: string; translated: number; total: number }[] = []
for (const code of [...new Set(files.map((f) => f.locale))]) {
  const own = files.filter((f) => f.locale === code)
  const label = locales.find((l) => l.code === code)?.label ?? code
  for (const f of own)
    rows.push([code, f.file.replace(`src/data/i18n/${code}/`, '') + (f.exists ? '' : ' (no file)'), `${f.translated} / ${f.total}`, percent(f.translated, f.total), String(f.missing.length)])
  const translated = own.reduce((n, f) => n + f.translated, 0)
  const total = own.reduce((n, f) => n + f.total, 0)
  rows.push([code, 'all files', `${translated} / ${total}`, percent(translated, total), String(total - translated)])
  summary.push({ code, label, translated, total })
}
const widths = rows[0].map((_, i) => Math.max(3, ...rows.map((r) => r[i].length)))
const right = [false, false, true, true, true]
const line = (r: string[]) => `| ${r.map((c, i) => (right[i] ? c.padStart(widths[i]) : c.padEnd(widths[i]))).join(' | ')} |`
const rule = `| ${widths.map((w, i) => (right[i] ? `${'-'.repeat(w - 1)}:` : '-'.repeat(w))).join(' | ')} |`

console.log(`Translations of the ${report.defaultLocale} content (src/data/i18n/<locale>/). Missing texts show in ${report.defaultLocale}.\n`)
console.log([line(rows[0]), rule, ...rows.slice(1).map(line)].join('\n'))
console.log('')
for (const s of summary) {
  const missing = s.total - s.translated
  console.log(`${missing ? '•' : '✓'} ${s.code} (${s.label}): ${s.translated} of ${s.total} texts translated (${percent(s.translated, s.total)})${missing ? ` — ${missing} missing` : ''}`)
}

if (listMissing)
  for (const f of files.filter((x) => x.missing.length)) {
    console.log(`\n${f.file}${f.exists ? '' : ' (does not exist yet)'} — ${f.missing.length} missing:`)
    for (const m of f.missing) console.log(`  ${m.path}: ${JSON.stringify(m.source)}`)
  }

const incomplete = summary.filter((s) => s.translated < s.total)
if (!incomplete.length) {
  console.log('\n✓ Every translation is complete.')
  process.exit(0)
}
if (!listMissing) console.log(`\nList the missing texts: npm run i18n:status -- ${incomplete.length === 1 ? `${incomplete[0].code} ` : ''}--missing`)
if (check) {
  // GitHub Actions annotation: visible on the run page although the CI step only warns
  if (process.env.GITHUB_ACTIONS)
    for (const s of incomplete)
      console.log(`::warning title=Missing translations (${s.code})::${s.total - s.translated} of ${s.total} texts show in ${report.defaultLocale} — npm run i18n:status -- ${s.code} --missing`)
  console.error(`\n✗ ${incomplete.map((s) => s.code).join(', ')}: translations are incomplete`)
  process.exit(1)
}
