/**
 * MCP stdio server "slodkomi-content" — lets any MCP client (Claude Code/Desktop, Cursor, Windsurf, VS Code…)
 * read and edit the site content safely. Registered in .mcp.json; run manually: npx tsx scripts/content-mcp.ts
 *
 * Only src/data/site.json, products.json and src/data/pages/<slug>.json can be written (reviews.json is read-only —
 * scripts/fetch-google-reviews.ts refreshes it). Every write is validated with loadContent() (same rules as the build)
 * and rolled back automatically when it introduces errors. stdout is the JSON-RPC channel — log only to stderr.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { loadContent } from '../src/content/validate.ts'
import {
  applyOperations,
  commit,
  contentPath,
  describeChanges,
  imageManifest,
  jsonSchema,
  overview,
  PROTECTED_PAGE,
  readText,
  ROOT,
  run,
  SCHEMA_NAMES,
  sectionCatalog,
  serialize,
  tail,
  type Operation,
} from './lib/content-store.ts'

type Result = { content: { type: 'text'; text: string }[]; isError?: boolean }

const ok = (data: unknown): Result => ({ content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] })
const fail = (message: string): Result => ({ content: [{ type: 'text', text: message }], isError: true })

/** Wraps a handler so thrown errors become tool errors instead of protocol errors. */
function guard<A>(fn: (args: A) => Result | Promise<Result>) {
  return async (args: A): Promise<Result> => {
    try {
      return await fn(args)
    } catch (e) {
      return fail((e as Error).message)
    }
  }
}

/** Validates + writes one file; reports what changed or why it was rolled back. */
function save(file: string, doc: unknown): Result {
  const { rel } = contentPath(file, 'write')
  const beforeText = readText(rel)
  const text = serialize(rel, doc)
  const result = commit([{ rel, text }])
  if (!result.ok)
    return fail(`Rolled back — ${rel} was NOT changed. The change introduces ${result.errors.length} error(s):\n- ${result.errors.join('\n- ')}`)
  const changes = beforeText === null ? [`created ${rel}`] : describeChanges(JSON.parse(beforeText), JSON.parse(text))
  if (!result.errors.length) return ok(`Saved ${rel} — content is valid.\n${changes.join('\n')}`)
  return ok(`Saved ${rel} (no new errors).\n${changes.join('\n')}\n\nContent is still INVALID — pre-existing problems (not caused by this change):\n- ${result.errors.join('\n- ')}`)
}

const parseJson = (value: unknown): unknown => (typeof value === 'string' ? JSON.parse(value) : value)

const PatchOp = z.object({
  op: z.enum(['add', 'remove', 'replace', 'move', 'copy', 'test']),
  path: z.string().describe('JSON Pointer inside the file, e.g. "/sections/0/headline/1/text"; "-" appends to an array'),
  value: z.unknown().optional().describe('For add / replace / test'),
  from: z.string().optional().describe('For move / copy'),
})

const fileArg = z.string().describe('Content file, e.g. "src/data/site.json", "src/data/products.json" or "src/data/pages/home.json"')

const server = new McpServer(
  { name: 'slodkomi-content', version: '1.0.0' },
  {
    instructions:
      'Edits the content of the SŁODKO MI website (Polish cinnamon-roll bakery). All texts, links, images, products ' +
      'and the order of page sections live in JSON files under src/data. Start with list_content, read get_schema ' +
      'before larger edits, prefer patch_content for small changes. Writes are validated and rolled back on error. ' +
      'Site copy is Polish. src/data/reviews.json is read-only (Google reviews are never written or invented). ' +
      'Use link tokens (@order, @phone, @directions, @instagram, @facebook, @reviews, @writeReview) instead of raw URLs. ' +
      'Image keys must exist (list_images / add_image). Run build_site at the end to verify.',
  },
)

server.registerTool(
  'list_content',
  {
    title: 'Content overview',
    description:
      'Lists editable files and a map of the content: pages (file, path, title, ordered sections with id/type/enabled), ' +
      'nav, categories, products, available section types, link tokens, image keys and the current validation status.',
    annotations: { readOnlyHint: true },
  },
  guard(() => ok(overview())),
)

server.registerTool(
  'get_schema',
  {
    title: 'JSON Schema of content files',
    description:
      'Returns the JSON Schema of a content file kind (site = src/data/site.json, catalog = products.json, reviews = reviews.json, ' +
      'page = src/data/pages/*.json) or all of them, plus a Markdown catalogue of section types with their fields.',
    inputSchema: { name: z.enum([...SCHEMA_NAMES, 'all']).default('all') },
    annotations: { readOnlyHint: true },
  },
  guard(({ name }) => {
    const names = name === 'all' ? SCHEMA_NAMES : [name]
    const schemas = Object.fromEntries(names.map((n) => [n, jsonSchema(n)]))
    return { content: [{ type: 'text', text: JSON.stringify(schemas) }, { type: 'text', text: `# Section types\n\n${sectionCatalog()}` }] }
  }),
)

server.registerTool(
  'read_content',
  {
    title: 'Read a content file',
    description: 'Returns the JSON of one content file (also src/data/reviews.json, which is read-only).',
    inputSchema: { file: fileArg },
    annotations: { readOnlyHint: true },
  },
  guard(({ file }) => {
    const { rel } = contentPath(file)
    const text = readText(rel)
    return text === null ? fail(`${rel} does not exist`) : ok(text)
  }),
)

server.registerTool(
  'write_content',
  {
    title: 'Replace a content file',
    description:
      'Replaces a whole content file (or creates a new page src/data/pages/<slug>.json). The JSON is validated together ' +
      'with all other content; on any new error nothing is written and the errors are returned.',
    inputSchema: { file: fileArg, content: z.unknown().describe('The complete JSON document (object or JSON string)') },
    annotations: { destructiveHint: true },
  },
  guard(({ file, content }) => save(file, parseJson(content))),
)

server.registerTool(
  'patch_content',
  {
    title: 'Patch a content file (RFC 6902)',
    description:
      'Applies JSON Patch operations to a content file — best for small edits (change a text, reorder or disable a section, ' +
      'add a product). On a missing page file the patch starts from {} (use {"op":"add","path":"","value":{...}} to create one). ' +
      'Validated like write_content and rolled back on error.',
    inputSchema: { file: fileArg, operations: z.array(PatchOp).min(1) },
    annotations: { destructiveHint: true },
  },
  guard(({ file, operations }) => {
    const { rel } = contentPath(file, 'write')
    const text = readText(rel)
    if (text === null && !rel.startsWith('src/data/pages/')) return fail(`${rel} does not exist`)
    return save(rel, applyOperations(text === null ? {} : JSON.parse(text), operations as Operation[]))
  }),
)

server.registerTool(
  'delete_page',
  {
    title: 'Delete a page file',
    description: `Deletes src/data/pages/<slug>.json (never ${PROTECTED_PAGE}). Rolled back if anything still links to the page.`,
    inputSchema: { file: fileArg },
    annotations: { destructiveHint: true },
  },
  guard(({ file }) => {
    const { rel } = contentPath(file, 'write')
    if (!rel.startsWith('src/data/pages/')) return fail('Only page files can be deleted')
    if (rel === PROTECTED_PAGE) return fail('The home page cannot be deleted')
    if (readText(rel) === null) return fail(`${rel} does not exist`)
    const result = commit([{ rel, text: null }])
    return result.ok ? ok(`Deleted ${rel}`) : fail(`Rolled back — ${rel} was NOT deleted:\n- ${result.errors.join('\n- ')}`)
  }),
)

server.registerTool(
  'validate_content',
  {
    title: 'Validate all content',
    description: 'Runs the same validation as the build (schemas + images, product slugs, links, anchors).',
    annotations: { readOnlyHint: true },
  },
  guard(() => {
    const { content, errors } = loadContent(ROOT)
    if (!content) return fail(`Content is invalid:\n- ${errors.join('\n- ')}`)
    const sections = content.pages.reduce((n, p) => n + p.sections.length, 0)
    return ok(`Content OK — ${content.pages.length} pages, ${sections} sections, ${content.catalog.products.length} products, ${Object.keys(content.images).length} images`)
  }),
)

server.registerTool(
  'list_images',
  {
    title: 'List image keys',
    description: 'Image keys usable in any "src" field (e.g. "products/oreo"), with original size and transparency.',
    annotations: { readOnlyHint: true },
  },
  guard(() => ok(Object.entries(imageManifest()).map(([key, m]) => ({ key, width: m.width, height: m.height, transparent: m.alpha })))),
)

const IMAGE_SRC = 'assets/images'
const slugArg = (what: string) => z.string().regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and dashes only').describe(what)

server.registerTool(
  'add_image',
  {
    title: 'Add an image',
    description:
      'Copies a local image (jpg/png/webp) into assets/images/<group>/<name>.<ext> and runs the image pipeline (responsive WebP + manifest). ' +
      'Returns the new key "<group>/<name>" for "src" fields. A file that already is assets/images/<group>/<name>.<ext> is processed in place. ' +
      'Use a cut-out PNG/WebP with transparency for products. Mark AI-generated pictures with "aiGenerated": true where you use the key.',
    inputSchema: {
      source: z.string().describe('Absolute path of the image file on this computer'),
      group: slugArg('Folder: "products", "photos", "og" (social preview, 1200×630) or a new one'),
      name: slugArg('File name without extension, e.g. "malina-kokos"'),
      overwrite: z.boolean().default(false).describe('Replace an existing image with the same key'),
    },
  },
  guard(async ({ source, group, name, overwrite }) => {
    const ext = path.extname(source).toLowerCase().replace('jpeg', 'jpg')
    if (!['.jpg', '.png', '.webp'].includes(ext)) return fail('Only .jpg, .jpeg, .png and .webp files are supported')
    if (!existsSync(source) || !statSync(source).isFile()) return fail(`File not found: ${source}`)
    const dir = path.join(ROOT, IMAGE_SRC, group)
    const target = path.join(dir, `${name}${ext}`)
    // The documented workflow puts the photo into assets/images first: then the source IS the target — never copy or delete it
    const same = (a: string, b: string) => {
      const [x, y] = [statSync(a), statSync(b)]
      return x.dev === y.dev && x.ino === y.ino
    }
    const inPlace = existsSync(target) && same(source, target)
    const others = (existsSync(dir) ? readdirSync(dir).filter((f) => f.replace(/\.[^.]+$/, '') === name) : []).filter(
      (f) => !inPlace || path.join(dir, f) !== target,
    )
    if (others.length && !overwrite) return fail(`Image "${group}/${name}" already exists (${others.join(', ')}). Pass overwrite: true to replace it.`)
    if (!inPlace) {
      mkdirSync(dir, { recursive: true })
      // Copy under a temporary name first, so a failed copy never leaves the key without a file
      const tmp = path.join(dir, `.${name}-${process.pid}.tmp`)
      copyFileSync(source, tmp)
      renameSync(tmp, target)
    }
    for (const f of others) if (path.join(dir, f) !== target) unlinkSync(path.join(dir, f))
    const { code, output } = await run(process.execPath, ['scripts/process-images.mjs'])
    if (code !== 0) return fail(`Image pipeline failed:\n${tail(output, 30)}`)
    const key = `${group}/${name}`
    return ok({ key, ...imageManifest()[key], usage: { src: key, alt: '<opis po polsku>' } })
  }),
)

server.registerTool(
  'build_site',
  {
    title: 'Build the site',
    description: 'Runs npm run build (content check + static pre-render into dist/) and returns the end of the log. Takes up to a few minutes.',
  },
  guard(async () => {
    const { code, output } = await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'])
    return code === 0 ? ok(`Build OK\n\n${tail(output)}`) : fail(`Build failed (exit ${code})\n\n${tail(output)}`)
  }),
)

await server.connect(new StdioServerTransport())
console.error(`slodkomi-content MCP server ready (${ROOT})`)
