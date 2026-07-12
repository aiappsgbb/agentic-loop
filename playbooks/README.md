# Playbooks

This directory contains playbook content that is rendered on the Agentic Loop site.

## Structure

Each playbook should have:
- `README.md` - Main content (required)
- `images/` - Images referenced in the README (optional)

Use [Getting Started](./getting-started/README.md) as the golden content pattern and [`.template/README.md`](./.template/README.md) as the authoring scaffold. Every rendered playbook follows **Intro -> Build -> Run -> Scale** and includes **Setup**, **Create a new project**, **Open GitHub Copilot**, **Run the build loop**, **Troubleshooting**, and **Clean up** slides. The primary invocation is `/spec2cloud`; stage commands are the optional review-first path.

## Images

Place images in `playbooks/<playbook-name>/images/` and reference them in the README as:

```markdown
![Alt text](./images/image-name.png)
```

Images are bundled automatically by Vite via `import.meta.glob` in
[`src/pages/PlaybookPage.tsx`](../src/pages/PlaybookPage.tsx) — the relative
`./images/...` paths are rewritten to hashed, base-path-aware asset URLs at
build time (works both locally and on GitHub Pages). This directory is the
single source of truth; **do not** copy images into `public/`.
