// ─────────────────────────────────────────────────────────────────────────────
// Azure Front Door (Standard) — path-mount Kratos under the agentic-loop-site.
//
// Goal: serve the agentic-loop-site at `/*` and the *always-latest* Kratos app
// at `/kratos/*` from a single origin (one host), so the site can embed Kratos
// without copying any Kratos files. Both apps are Azure Static Web Apps; this
// profile fronts both and routes by path:
//
//   /kratos/*   ──▶  Kratos SWA      (includes /kratos/.auth/* and /kratos/api/*)
//   /*          ──▶  agentic-loop-site SWA
//
// Because `/kratos/*` is a more specific match than `/*`, Front Door always
// prefers the Kratos route for those paths. No URL rewrite is configured: the
// Kratos Next.js app is built with basePath `/kratos`, so it expects to receive
// the `/kratos/...` prefix verbatim.
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

// ── Routes ──────────────────────────────────────────────────────────────────
// Kratos route is declared first and matches the more specific `/kratos/*`
// pattern (covers /kratos/.auth/* + /kratos/api/* too). Front Door longest-
// prefix-matches, so these paths never fall through to the site origin.
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

@description('The redirect URI to register on the Kratos Entra app registration.')
output kratosAuthRedirectUri string = 'https://${endpoint.properties.hostName}/kratos/.auth/login/aad/callback'
