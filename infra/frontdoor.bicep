// ─────────────────────────────────────────────────────────────────────────────
// Azure Front Door (Standard) — path-mount Kratos under the agentic-loop-site.
//
// Goal: serve the agentic-loop-site at `/*` and the *always-latest* Kratos app
// at `/kratos/*` from a single origin (one host), so the site can embed Kratos
// without copying any Kratos files. Both apps are Azure Static Web Apps; this
// profile fronts both and routes by path:
//
//   /kratos/api/*  ──▶  Kratos backend (Container App), prefix rewritten to /api/*
//   /kratos/*      ──▶  Kratos SWA      (includes /kratos/.auth/*)
//   /*             ──▶  agentic-loop-site SWA
//
// Front Door longest-prefix-matches, so `/kratos/api/*` (most specific) wins over
// `/kratos/*`, which in turn wins over `/*`. The Kratos Next.js app is built with
// basePath `/kratos` and so receives the `/kratos/...` prefix verbatim on the SWA
// route (no rewrite there). The API route strips the prefix: the browser calls
// the same-origin path `/kratos/api/...` (so there is no CORS), and the route's
// `originPath: '/api/'` strips the `/kratos/api` prefix before forwarding to the
// backend, which serves `/api/...`.
// This keeps the embed truly same-origin — the backend is reached through the same
// Front Door host as the UI, eliminating cross-origin calls entirely.
//
// EasyAuth: Kratos runs its own Entra app registration. Its redirect URI must be
//   https://<front-door-host>/kratos/.auth/login/aad/callback
// (see infra/deploy-frontdoor.ps1 output + README).
// ─────────────────────────────────────────────────────────────────────────────

targetScope = 'resourceGroup'

@description('Front Door profile name.')
param profileName string = 'afd-agentic-loop'

@description('Front Door endpoint name (becomes <name>-<hash>.z01.azurefd.net).')
param endpointName string = 'agentic-loop'

@description('Default hostname of the agentic-loop-site Static Web App (no scheme), e.g. agentic-loop.azurestaticapps.net')
param siteHostName string

@description('Default hostname of the Kratos Static Web App (no scheme), e.g. kratos-frontend.azurestaticapps.net')
param kratosHostName string

@description('Default hostname of the Kratos backend Container App (no scheme), e.g. ca-agent-xxxx.<region>.azurecontainerapps.io. This is fronted at /kratos/api/* so the embedded UI calls the backend same-origin (no CORS).')
param kratosApiHostName string

@description('Front Door SKU. Standard is sufficient for path routing; Premium adds WAF managed rules + Private Link.')
@allowed([
  'Standard_AzureFrontDoor'
  'Premium_AzureFrontDoor'
])
param sku string = 'Standard_AzureFrontDoor'

// ── Profile + endpoint ──────────────────────────────────────────────────────
resource profile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: profileName
  location: 'global'
  sku: {
    name: sku
  }
}

resource endpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = {
  parent: profile
  name: endpointName
  location: 'global'
  properties: {
    enabledState: 'Enabled'
  }
}

// ── Site origin group + origin (default /* route) ───────────────────────────
resource siteOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  parent: profile
  name: 'og-site'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 100
    }
  }
}

resource siteOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  parent: siteOriginGroup
  name: 'origin-site'
  properties: {
    hostName: siteHostName
    originHostHeader: siteHostName
    httpPort: 80
    httpsPort: 443
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    enforceCertificateNameCheck: true
  }
}

// ── Kratos origin group + origin (/kratos/* route) ──────────────────────────
resource kratosOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  parent: profile
  name: 'og-kratos'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/kratos/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 100
    }
  }
}

resource kratosOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  parent: kratosOriginGroup
  name: 'origin-kratos'
  properties: {
    hostName: kratosHostName
    originHostHeader: kratosHostName
    httpPort: 80
    httpsPort: 443
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    enforceCertificateNameCheck: true
  }
}

// ── Kratos backend origin group + origin (/kratos/api/* route) ──────────────
// The Kratos API is a Container App that serves `/api/*`. We front it here so the
// embedded UI can call it same-origin via `/kratos/api/*` (no CORS). The health
// probe hits the backend `/health` directly (probes ignore the route originPath).
resource kratosApiOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  parent: profile
  name: 'og-kratos-api'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/health'
      probeRequestType: 'GET'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 100
    }
  }
}

resource kratosApiOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  parent: kratosApiOriginGroup
  name: 'origin-kratos-api'
  properties: {
    hostName: kratosApiHostName
    originHostHeader: kratosApiHostName
    httpPort: 80
    httpsPort: 443
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    enforceCertificateNameCheck: true
  }
}

// ── Routes ──────────────────────────────────────────────────────────────────
// The API route is declared first and matches the most specific `/kratos/api/*`
// pattern. Front Door longest-prefix-matches, so these paths reach the backend
// origin before the `/kratos/*` SWA route or the `/*` site route can claim them.
//
// Prefix strip is done with `originPath`, NOT a rule-set UrlRewrite. A rewrite
// rule's source pattern only sees the path AFTER the route's match pattern and
// always keeps the matched prefix (`/kratos/api/x` → `/kratos/api/<dest>`), so a
// rule can never remove `/kratos/api`. Setting `originPath: '/api/'` replaces the
// matched `/kratos/api/` prefix, so `/kratos/api/use-cases` → `/api/use-cases` at
// the backend. (Health probes use the origin group's `/health` probePath and are
// unaffected by originPath.)
resource kratosApiRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  parent: endpoint
  name: 'route-kratos-api'
  dependsOn: [
    kratosApiOrigin
  ]
  properties: {
    originGroup: {
      id: kratosApiOriginGroup.id
    }
    originPath: '/api/'
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/kratos/api/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    // No cache config: API responses must not be cached at the edge.
    enabledState: 'Enabled'
  }
}

// Kratos SWA route matches `/kratos/*` (covers /kratos/.auth/* and the static UI).
resource kratosRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  parent: endpoint
  name: 'route-kratos'
  dependsOn: [
    kratosOrigin
  ]
  properties: {
    originGroup: {
      id: kratosOriginGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/kratos/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    // No cache config: auth + API responses must not be cached at the edge.
    enabledState: 'Enabled'
  }
}

resource siteRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  parent: endpoint
  name: 'route-site'
  dependsOn: [
    siteOrigin
  ]
  properties: {
    originGroup: {
      id: siteOriginGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
  }
}

@description('Front Door endpoint hostname — the single host that serves both the site and the embedded Kratos app.')
output frontDoorHostName string = endpoint.properties.hostName

@description('Same-origin API base the embedded Kratos UI should call (set config.json apiUrl to this, or leave it as the /kratos basePath fallback).')
output kratosApiBasePath string = 'https://${endpoint.properties.hostName}/kratos/api'

@description('The redirect URI to register on the Kratos Entra app registration.')
output kratosAuthRedirectUri string = 'https://${endpoint.properties.hostName}/kratos/.auth/login/aad/callback'
