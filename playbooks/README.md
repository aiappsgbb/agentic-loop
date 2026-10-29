# Playbooks

This directory contains playbook content that is rendered on the Agentic Loop site.

## Structure

Each playbook should have:
- `README.md` - Main content (required)
- `images/` - Images referenced in the README (optional)

Use [Getting Started](./getting-started/README.md) as the golden content pattern, [Enterprise Knowledge Grounding](./enterprise-knowledge-grounding/README.md) as the detailed reference, and [`.template/README.md`](./.template/README.md) as the authoring scaffold. Every rendered playbook follows **Intro -> Build -> Run -> Scale** and includes **Setup**, **Create a new project**, **Open GitHub Copilot**, **Run the build loop**, a scenario exercise, trace review, and **Clean up**. New builds invoke `foundry-agentic-loop` from the bundled plugin. SDD runs Specify → Implement → Verify → Deploy, with planning in Specify, evidence gates, spec approval and separate deployment approval. Rapid is an explicit alternative for an existing project. Link to the published plugin and keep recovery instructions aligned with its maintained guide. Do not mark the plugin as awaiting publication or remove separate Foundry Skills/A2A preview notices.

Every playbook must be independently runnable. Its **Setup** slide lists all required accounts, permissions, CLIs, authentication steps, plugins, preview features, devices, and scenario-specific dependencies. Never require readers to finish setup in another playbook or in this directory README.

The common prerequisites live in [`SETUP.md`](./SETUP.md) and are embedded verbatim between `shared-playbook-setup` markers in every playbook and the authoring template. After changing them, run `node scripts/sync-playbook-setup.mjs` from the repository root. Tests reject drift. Keep devices, preview access, extra workflow plugins and other scenario-specific prerequisites outside the shared markers. The build plugin bundles its build skill, canvas and workflow; check for `microsoft-foundry` separately and install it only when missing and approved.

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

The shared setup screenshots live in `playbooks/shared/images/` and are referenced as `../shared/images/<file>`. The renderer rewrites these to bundled, base-path-aware URLs too. They depict the portal's environment and project hand-off instructions, not a local readiness verdict.
