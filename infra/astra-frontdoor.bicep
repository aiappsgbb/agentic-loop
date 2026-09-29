targetScope = 'resourceGroup'

@description('Existing Agentic Loop Front Door profile. This template does not modify site or Kratos routes.')
param profileName string = 'afd-agentic-loop'

@description('Existing Front Door endpoint.')
param endpointName string = 'agentic-loop'

@description('Astra Container App hostname, without scheme or path.')
@minLength(1)
param astraHostName string

resource profile 'Microsoft.Cdn/profiles@2023-05-01' existing = {
  name: profileName
}

resource endpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' existing = {
  parent: profile
  name: endpointName
}

resource originGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  parent: profile
  name: 'og-astra'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/healthz'
      probeRequestType: 'GET'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 100
    }
  }
}

resource origin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  parent: originGroup
  name: 'origin-astra'
  properties: {
    hostName: astraHostName
    originHostHeader: astraHostName
    httpPort: 80
    httpsPort: 443
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    enforceCertificateNameCheck: true
  }
}

resource canonical 'Microsoft.Cdn/profiles/ruleSets@2023-05-01' = {
  parent: profile
  name: 'astraCanonical'
}

// Relative assets need the directory form. Only /astra (without slash) redirects,
// on the same host; ordinary /astra/ entries go straight to the origin.
resource trailingSlash 'Microsoft.Cdn/profiles/ruleSets/rules@2023-05-01' = {
  parent: canonical
  name: 'TrailingSlash'
  properties: {
    order: 1
    conditions: [
      {
        name: 'UrlPath'
        parameters: {
          typeName: 'DeliveryRuleUrlPathMatchConditionParameters'
          operator: 'Equal'
          matchValues: ['/astra']
          negateCondition: false
          transforms: []
        }
      }
    ]
    actions: [
      {
        name: 'UrlRedirect'
        parameters: {
          typeName: 'DeliveryRuleUrlRedirectActionParameters'
          redirectType: 'PermanentRedirect'
          destinationProtocol: 'Https'
          customPath: '/astra/'
        }
      }
    ]
    matchProcessingBehavior: 'Stop'
  }
}

resource route 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  parent: endpoint
  name: 'route-astra'
  dependsOn: [origin, trailingSlash]
  properties: {
    originGroup: { id: originGroup.id }
    // Replace the matched /astra/ prefix: assets and API keep their root paths
    // at the Container App while the browser remains on the Front Door host.
    originPath: '/'
    patternsToMatch: ['/astra', '/astra/*']
    supportedProtocols: ['Http', 'Https']
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
    ruleSets: [{ id: canonical.id }]
    // No cache configuration: the route also carries configuration and streamed runs.
  }
}

output agenticLoopOrigin string = 'https://${endpoint.properties.hostName}'
output astraUrl string = 'https://${endpoint.properties.hostName}/astra/'
