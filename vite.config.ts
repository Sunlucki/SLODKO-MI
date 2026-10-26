import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { contentPlugin } from './scripts/vite-plugin-content.ts'

// VITE_BASE lets the same build run on a sub-path (e.g. GitHub Pages preview: /SLODKO-MI/).
// On the production host (FTP → public_html) it stays "/".
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  define: {
    'import.meta.env.SITE_URL': JSON.stringify(process.env.SITE_URL || ''),
  },
  plugins: [contentPlugin(), react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    // OUT_DIR allows parallel builds into separate folders (e.g. OUT_DIR=.tmp/check)
    outDir: process.env.OUT_DIR || 'dist',
    assetsInlineLimit: 0,
    // SOURCEMAP=1 for bundle analysis (npx source-map-explorer <dir>/assets/*.js)
    sourcemap: Boolean(process.env.SOURCEMAP),
    // One client bundle: rolldown does not re-hash a chunk when only the name of a chunk it imports
    // changes, which would break the year-long immutable cache of /assets/ after a deploy.
    rolldownOptions: { output: { codeSplitting: false } },
  },
  ssgOptions: {
    script: 'async',
    formatting: 'none',
    dirStyle: 'nested',
    beastiesOptions: { preload: 'media', reduceInlineStyles: false, preloadFonts: false, fonts: false },
  },
})
