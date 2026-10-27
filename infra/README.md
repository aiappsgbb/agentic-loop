# Infrastructure - portal hosting

Azure Front Door serves the portal Static Web App through the `route-site`
catch-all (`/*`). The portal has no embedded reference application or persona
import relay.

## Files

| File | Purpose |
|------|---------|
| `frontdoor.bicep` | Front Door profile, endpoint, site origin group/origin and catch-all route. |
| `frontdoor.parameters.json` | Example parameters; supply the portal SWA hostname. |
| `deploy-frontdoor.ps1` | Resolve an existing portal SWA hostname and deploy the template. |

## Provisioning

Authenticate Azure CLI in the intended subscription, deploy the portal SWA
(`../deploy.ps1`), then run `./deploy-frontdoor.ps1` with the matching resource
group, SWA, profile and endpoint names. Build with `npm run build -- --base=/`
for root hosting. GitHub Pages uses the default `/agentic-loop/` build instead.

## Production releases

Pushes to `main` run `.github/workflows/deploy-afd.yml`, which builds the root
site, uses GitHub OIDC to publish to `stapp-agentic-loop-livetest` in
`rg-agentic-loop-livetest`, and purges the `afd-agentic-loop` endpoint cache.
The separate Pages workflow publishes the same source with its Pages base path.
`public/staticwebapp.config.json` supplies the portal's SPA navigation fallback.

## Retired reference integration

Kratos is no longer part of the portal. The frontend routes `/reference/kratos`
and `/kratos` fall through to the standard not-found page; nested legacy paths
do the same. `VITE_KRATOS_BASE` and `VITE_KRATOS_STANDALONE_URL` are no longer used.

After a successful SWA upload, the production workflow lists Front Door routes
and deletes only `route-kratos` and `route-kratos-api` if present. Deletion errors
fail the release. Repeat runs are safe when those routes are already absent.
The remaining `route-site` sends their former paths to the portal.

This explicit retirement is required because incremental ARM deployments do not
delete resources omitted from Bicep. Running `deploy-frontdoor.ps1` alone does
not retire old routes; use the production workflow for existing deployments.
The standalone frontend, backend, Entra registration and unused origin groups
are intentionally not deleted or changed by this portal release.
