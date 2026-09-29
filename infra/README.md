# Infra — Front Door path mounts

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

## Astra: isolated add-on to the existing Front Door

`astra-frontdoor.bicep` adds only Astra's origin group, origin, canonical-path
rule set and route to an **existing** profile/endpoint. It does not redeploy or
replace the site or Kratos routes. Keep `frontdoor.bicep` for the original stack;
use the add-on for the Astra integration rather than reapplying that whole stack
to a live profile.

| Browser path | Origin | Forwarded path |
| --- | --- | --- |
| `/astra/` | Astra Container App | `/` |
| `/astra/assets/*` | Astra Container App | `/assets/*` |
| `/astra/api/*` | Astra Container App | `/api/*` |
| `/kratos/*`, `/kratos/api/*`, all other paths | Existing routing | Unchanged |

The add-on uses `originPath: '/'`, the Container App hostname as the origin Host
header, HTTPS forwarding, certificate-name verification and `/healthz` probes.
It does not enable caching because the same route serves streamed API responses.
Only `/astra` without the trailing slash gets a same-host 308 to `/astra/`;
query parameters are preserved. Ordinary entry points need no redirect.
There are no root `/api/*` or `/assets/*` overrides, HTML rewrites or iframe
exceptions.

### Upstream contract and release order

1. Prepare and deploy `kmavrodis/astra-azure-demo` with relative asset/API URLs,
   the mounted **Back to Agentic Loop** link, and
   `AGENTIC_LOOP_ORIGIN=https://agentic-loop-geguehdxa0c0h4bx.b02.azurefd.net`.
   Its deployment script takes `--agentic-loop-origin`; this requires its
   existing public access mode. Keep the standalone URL working.
2. Inspect the actual profile, endpoint and current routes, then review an ARM
   what-if for `astra-frontdoor.bicep` in the existing Front Door resource group.
   Expected changes are limited to the five Astra resources; stop if unrelated
   routes/resources would change. Parameters are `profileName` (default
   `afd-agentic-loop`), `endpointName` (default `agentic-loop`) and
   `astraHostName=astra-demo.icyground-ce9cbed9.westeurope.azurecontainerapps.io`.
   Applying the template is a separately authorized live operation.
3. Verify `/astra/` on the real Front Door host: assets, favicon, configuration,
   all three sandbox streams, return navigation, theme, `/astra` canonicalization
   and existing site/Kratos paths. Keep model calls out of infrastructure smoke
   tests unless explicitly approved. Probes can wake the app and incur hosting
   costs; no model resources are provisioned by this add-on.
4. Only then merge/release the host UI. The existing workflows deploy the host
   website, **not** Astra or the new Front Door add-on.

Both home and sidebar use `getAstraUrl()` with the resolved light/dark theme.
On Front Door, `VITE_ASTRA_BASE=/astra` keeps native same-tab navigation on the
same host. GitHub Pages cannot reverse-proxy this mount, so its workflow points
to the canonical Front Door `/astra` URL instead. It does not open another tab.

Astra still validates its Container App Host header and explicitly allows the
configured Front Door browser Origin. No wildcard CORS or forwarded-header
trust is added. Its existing per-address allowance can be shared by users behind
one Front Door edge; global and concurrency limits remain in force. Tenant
sign-in through the mount is intentionally not enabled by this change.

For rollback, first release the host without Astra entry points, then remove
only the five resources declared by `astra-frontdoor.bicep`. An incremental
deployment of the original template does **not** remove the add-on. Keep the
standalone app available and remove its optional allowed origin only after
mounted traffic has stopped.
