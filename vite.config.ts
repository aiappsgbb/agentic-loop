import { defineConfig, loadEnv, type Plugin } from 'vite'
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
export default defineConfig(({ mode }) => ({
  // Served from https://aiappsgbb.github.io/agentic-loop/ on GitHub Pages.
  base: '/agentic-loop/',
  plugins: [react(), mdSpaFallback()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: loadEnv(mode, process.cwd(), '').VITE_WORKSHOP_AI === 'local' || process.env.VITE_WORKSHOP_AI === 'local'
      ? {
        '/agentic-loop/api/workshop': {
          target: 'http://127.0.0.1:4318',
          rewrite: path => path.replace('/agentic-loop/api/workshop', '/api/workshop'),
          changeOrigin: true,
        },
      } : undefined,
  },
}))
