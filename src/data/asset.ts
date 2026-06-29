/**
 * Resolve a public-asset path against the Vite base URL.
 *
 * Static assets in `public/` (scenario/playbook images, brand icons) are
 * referenced with root-relative paths. When the app is served from a subpath
 * (e.g. `/agentic-loop/` on GitHub Pages) those paths must be prefixed with
 * `import.meta.env.BASE_URL` so they don't 404. External URLs are left as-is.
 */
export function asset(path: string): string {
  if (/^(https?:)?\/\//.test(path)) return path;
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '');
}
