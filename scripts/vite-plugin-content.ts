// Serves validated content as `virtual:content`. Invalid JSON or a broken reference
// fails `vite build` and shows an error overlay in `vite dev`. Zod never reaches the browser.
import type { Plugin } from 'vite'
import { contentFiles, loadContent } from '../src/content/validate.ts'

const ID = 'virtual:content'
const RESOLVED = '\0' + ID

export function contentPlugin(): Plugin {
  let root = process.cwd()
  return {
    name: 'slodkomi-content',
    configResolved(config) {
      root = config.root
    },
    resolveId(id) {
      if (id === ID) return RESOLVED
    },
    load(id) {
      if (id !== RESOLVED) return
      for (const file of contentFiles(root)) this.addWatchFile(file)
      const { content, errors } = loadContent(root)
      if (!content) this.error(`Content validation failed:\n  • ${errors.join('\n  • ')}`)
      return `export default ${JSON.stringify(content)}`
    },
    // hotUpdate (unlike handleHotUpdate) also runs when a file is created or deleted, so a new
    // src/data/pages/*.json becomes a route without restarting the dev server. Runs once per environment.
    hotUpdate({ file }) {
      if (file.includes('/src/data/') || file.endsWith('/src/generated/images.json')) {
        const mod = this.environment.moduleGraph.getModuleById(RESOLVED)
        if (mod) this.environment.moduleGraph.invalidateModule(mod)
        if (this.environment.name === 'client') this.environment.hot.send({ type: 'full-reload' })
        return []
      }
    },
  }
}
