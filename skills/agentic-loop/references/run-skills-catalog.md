# Run skills catalog

Reusable **run-phase** agent skills. Unlike the [build skills catalog](build-skills-catalog.md) (skills you install to help *build* the app), these are skills the **agent itself runs** at execution time.

**Reuse, don't regenerate.** When the prompt **explicitly names** one of these skills, reuse the existing skill instead of authoring a new `./skills/<skill-name>/SKILL.md` from scratch: install/download it into `./skills/<skill-name>/`, then **create the versioned skill on the Foundry project** and attach it to the agent's toolbox — the same Copilot SDK skills default flow described in [`foundry-toolbox.md`](foundry-toolbox.md). Only author a brand-new skill when the named skill is **not** in this catalog.

This is a starter set of examples, not an exhaustive list.

| Repository               | Skill                            | Reuse when the prompt explicitly names |
| ------------------------ | -------------------------------- | -------------------------------------- |
| `github/awesome-copilot` | `eyeball`                        | Visually inspect a rendered UI or screenshot and report what is on screen or off-spec |
| `github/awesome-copilot` | `finalize-agent-prompt`          | Polish and finalize an agent's system / instruction prompt |
| —                        | `gtm-enterprise-account-planning`| Build an enterprise go-to-market account plan |
| —                        | `gtm-product-led-growth`         | Plan a product-led-growth (PLG) go-to-market motion |
| `github/awesome-copilot` | `incident-postmortem`            | Draft a structured incident postmortem (timeline, impact, root cause, action items) |
| —                        | `linkedin-post-formatter`        | Format content into a LinkedIn-ready post |
| `github/awesome-copilot` | `md-to-docx`                     | Convert Markdown into a DOCX document |
| `github/awesome-copilot` | `roundup`                        | Summarize multiple sources or items into a single roundup |
| `github/awesome-copilot` | `tldr-prompt`                    | Produce a concise TL;DR summary of long content |

For cataloged skills that declare a repository, install with the same command used for build skills:

```bash
gh skills install <repository> <skill> --agent github-copilot --scope project
```

Skills without a repository (`—`) are reused from their named source as agreed with the user; if they are not resolvable from a repository, reuse the local/cataloged version rather than authoring a new one. In all cases, after the skill is present locally, create and version it on Foundry and attach it to the toolbox.
