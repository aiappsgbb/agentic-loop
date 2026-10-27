// Azure Front Door serves the portal Static Web App at /*.
// Retired integration routes are removed by the production deployment workflow;
// incremental ARM deployments do not delete resources omitted from this template.

targetScope = 'resourceGroup'

@description('Front Door profile name.')
param profileName string = 'afd-agentic-loop'

@description('Front Door endpoint name (becomes <name>-<hash>.z01.azurefd.net).')
param endpointName string = 'agentic-loop'

@description('Default hostname of the agentic-loop-site Static Web App (no scheme), e.g. agentic-loop.azurestaticapps.net')
param siteHostName string

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

@description('Front Door endpoint hostname serving the portal.')
output frontDoorHostName string = endpoint.properties.hostName
