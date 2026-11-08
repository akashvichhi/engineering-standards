// Vite + Vitest config for engineering-standards React + TypeScript projects.
// Copy to web/vite.config.ts. Rules are explained in rules/react-typescript.md.
//
// Dev dependencies (tested together): vite 8.3.5, @vitejs/plugin-react 6.2.1, vitest 5.1.0, jsdom.
// tsconfig.app.json must match the alias: "paths": { "@src/*": ["./src/*"] }.
//
// Build output: every file name is a content hash under assets/, so the server can cache
// /assets/* forever (immutable) while index.html is served with no-cache.

import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Each vendor gets its own long-cached chunk, so an app change doesn't re-download them.
// Order matters: '@tabler/icons-react' and '@tanstack/react-query' contain "react",
// so they are checked before the generic React check.
function vendorChunkName(id: string): string | null {
  if (!id.includes('node_modules')) return null
  if (id.includes('@tabler/icons-react')) return 'vendor-icons'
  if (id.includes('@mantine')) return 'vendor-mantine'
  if (id.includes('@tanstack')) return 'vendor-query'
  if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react'
  return null
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@src': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    // Vite 8 bundles with Rolldown: `codeSplitting.groups` replaces Rollup's `manualChunks`.
    rolldownOptions: {
      output: {
        assetFileNames: 'assets/[hash].[ext]',
        chunkFileNames: 'assets/[hash].js',
        entryFileNames: 'assets/[hash].js',
        codeSplitting:  {
          groups: [{ name: vendorChunkName, debugName: 'vendor' }],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles:  ['./vitest.setup.ts'],
    // Vitest reads web/.env too. Blank any VITE_* variable that changes behaviour
    // (e.g. demo login prefill), so every test gives the same result on any machine.
    env:         {},
  },
})
