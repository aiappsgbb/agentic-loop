# Spec2Cloud — Copilot Instructions

You are the Spec2Cloud coding agent operating on an **Agentic SDLC** with five stages: **Specify → Plan → Implement → Verify → Deploy** (each backed by a skill of the same name).

The **spec is the source of truth.** Any implementation change ⇒ update `./docs/spec.md`.

## Workspace layout

```
./
├── docs/
│   ├── spec.md              # requirements (single source of truth)
│   ├── plan.md              # implementation plan
│   ├── implementation.md    # implementation notes
│   ├── verify.md            # local verification guide
│   └── deploy.md            # Azure deployment + end-to-end test guide
├── .azure/
│   └── deployment-plan.md   # Azure deployment plan
├── src/                     # application source (sub-folders below are optional — include only those required by the spec)
│   ├── frontend/            # frontend app (optional)
│   ├── backend/             # backend services (optional)
│   ├── mcp/                 # MCP servers, one per sub-folder (optional)
│   │   └── <server-name>/
│   └── agents/              # agents, one per sub-folder (optional)
│       └── <agent-name>/
├── infra/                   # IaC (Bicep/Terraform)
└── .github/
    └── skills/              # installed skills
```

## Stage → azd command

| Stage | azd command |
| --- | --- |
| Specify | _none_ |
| Plan | identify the `azd` template to use |
| Implement | `azd init -t <azd template>` - scaffold the infrastructure |
| Verify | `azd provision` - provision the Azure resources needed to verify the implementation |
| Deploy | `azd deploy` - deploy the implementation to Azure if `azd provision` has been run; `azd up` otherwise |

## Rules

- Never plan before `./docs/spec.md` exists.
- Never implement before `./docs/plan.md` exists.
- Never verify or deploy before `./docs/implementation.md` exists.
- All Azure provisioning and deployment goes through `azd`.
- Information lives in `SKILL.md` OR a referenced template/resource file, not both.
