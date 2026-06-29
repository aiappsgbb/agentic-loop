import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Rewrite SPA deep links that end in `.md` (e.g. /skills/<name>/SKILL.md) to
// index.html so direct loads and refreshes don't 404 in dev. Vite's default
// history fallback skips paths with a file extension.
function mdSpaFallback(): Plugin {
  return {
    name: 'md-spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && /\/SKILL\.md(\?.*)?$/.test(req.url) && req.headers.accept?.includes('text/html')) {
          req.url = '/index.html'
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Served from https://aiappsgbb.github.io/agentic-loop/ on GitHub Pages.
  base: '/agentic-loop/',
  plugins: [react(), mdSpaFallback()],
})
