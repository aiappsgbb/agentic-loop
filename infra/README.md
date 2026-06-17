# Infra — Front Door path-mount for embedded Kratos

This folder provisions an **Azure Front Door (Standard)** profile that serves the
agentic-loop-site and the **always-latest Kratos** app from a single host:

```
                         ┌────────────────────────────────────────┐
   user ──▶ Front Door ──┤  /kratos/*  ──▶  Kratos SWA (basePath)  │
                         │  /*         ──▶  agentic-loop-site SWA   │
                         └────────────────────────────────────────┘
```

Kratos is **not copied** into this repo. Front Door forwards `/kratos/*`
(including `/kratos/.auth/*` and `/kratos/api/*`) verbatim to the Kratos Static
Web App, which is built with Next.js `basePath: '/kratos'`. Deploying the site
never bundles Kratos code — the embedded app is always whatever is currently
deployed to the Kratos SWA.

## Files

| File | Purpose |
|------|---------|
| `frontdoor.bicep` | AFD profile, endpoint, two origin groups (site + kratos), two routes (`/kratos/*`, `/*`). |
| `frontdoor.parameters.json` | Example parameters (fill in the two SWA hostnames). |
| `deploy-frontdoor.ps1` | Resolves both SWA hostnames via `az` and deploys the Bicep; prints the Entra redirect URI. |

## Deploy order

1. Deploy the **agentic-loop-site** SWA (`../deploy.ps1`).
2. Deploy the **Kratos** frontend SWA from the `kratos-agent` repo, built with
   `NEXT_PUBLIC_BASE_PATH=/kratos`.
3. Run `./deploy-frontdoor.ps1` (adjust the `-SiteSwaName` / `-KratosSwaName`
   / resource-group params as needed).
4. Copy the printed **redirect URI** into the **Kratos** Entra app registration:
   `https://<front-door-host>/kratos/.auth/login/aad/callback`.
5. Rebuild/redeploy the site if you changed `VITE_KRATOS_*` (see below).

## Two auth apps (Variant B)

There are **two** Entra app registrations:

- **App #1 — site**: EasyAuth on the agentic-loop-site SWA (if the site is gated).
- **App #2 — Kratos**: EasyAuth on the Kratos SWA. Its redirect URI must be under
  the Front Door host: `https://<front-door-host>/kratos/.auth/login/aad/callback`.

The site never calls the Kratos import API directly. It builds a manifest, relays
it via same-origin `sessionStorage['kratos.import']`, and navigates into
`/kratos/?embed=1&import=1`. Kratos runs its own login and imports on entry.
Because the relay is **same-origin**, it only works once both apps sit behind the
same Front Door host (production). See `src/lib/kratosHandoff.ts`.

## Frontend env vars

| Var | Default | Purpose |
|-----|---------|---------|
| `VITE_KRATOS_BASE` | `/kratos` | Same-origin mount path the site deep-links into. |
| `VITE_KRATOS_STANDALONE_URL` | _(unset)_ | Local dev only — point at a standalone Kratos (e.g. `http://localhost:3000`). Persona/prompt deep-links work cross-origin; the sessionStorage **import** relay requires same-origin and only works behind Front Door. |

Copy `.env.example` to `.env` to override locally.
