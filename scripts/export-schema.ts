/**
 * npm run content:schema — writes JSON Schemas of all content files to schema/ (+ schema/README.md with the
 * section type catalogue), generated from the Zod contract in src/content/schema.ts. Commit the output:
 * editors and LLMs read it, and the data files reference it via "$schema".
 *
 *   --check   do not write; exit 1 when schema/ is out of date (part of npm run content:check)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { ROOT, SCHEMA_DIR, schemaFiles } from './lib/content-store.ts'

const check = process.argv.includes('--check')
const files = schemaFiles()
const stale = Object.entries(files).filter(([rel, text]) => {
  const abs = path.join(ROOT, rel)
  return !existsSync(abs) || readFileSync(abs, 'utf8') !== text
})

if (check) {
  if (stale.length) {
    console.error(`✗ ${SCHEMA_DIR}/ is out of date (${stale.map(([rel]) => rel).join(', ')}).\n  Run \`npm run content:schema\` and commit the result.`)
    process.exit(1)
  }
  console.log(`✓ ${SCHEMA_DIR}/ is up to date`)
} else {
  mkdirSync(path.join(ROOT, SCHEMA_DIR), { recursive: true })
  for (const [rel, text] of stale) writeFileSync(path.join(ROOT, rel), text)
  console.log(stale.length ? `✓ Updated ${stale.map(([rel]) => rel).join(', ')}` : `✓ ${SCHEMA_DIR}/ already up to date`)
}
