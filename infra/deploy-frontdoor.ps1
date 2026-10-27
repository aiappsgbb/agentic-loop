# Provision Azure Front Door for an existing portal Static Web App.
# Requires Azure CLI authentication in the target subscription.

param(
  [string]$ResourceGroup = 'rg-agentic-loop',
  [string]$SiteSwaName   = 'agentic-loop',
  [string]$ProfileName   = 'afd-agentic-loop',
  [string]$EndpointName  = 'agentic-loop',
  [ValidateSet('Standard_AzureFrontDoor', 'Premium_AzureFrontDoor')]
  [string]$Sku           = 'Standard_AzureFrontDoor'
)

$ErrorActionPreference = 'Stop'

Write-Host "Resolving portal Static Web App hostname..." -ForegroundColor Cyan

$siteHost = az staticwebapp show `
  --name $SiteSwaName --resource-group $ResourceGroup `
  --query 'defaultHostname' -o tsv

if ($LASTEXITCODE -ne 0) { throw "Could not query site SWA '$SiteSwaName'." }
if (-not $siteHost)   { throw "Could not resolve site SWA '$SiteSwaName' hostname." }

Write-Host "  site       : $siteHost"      -ForegroundColor Green

Write-Host "Deploying Front Door (this can take a few minutes)..." -ForegroundColor Cyan

$outputs = az deployment group create `
  --resource-group $ResourceGroup `
  --template-file "$PSScriptRoot/frontdoor.bicep" `
  --parameters `
    profileName=$ProfileName `
    endpointName=$EndpointName `
    siteHostName=$siteHost `
    sku=$Sku `
  --query 'properties.outputs' -o json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) { throw "Front Door deployment failed." }
$fdHost      = $outputs.frontDoorHostName.value
if (-not $fdHost) { throw "Front Door deployment did not return a hostname." }

Write-Host ""
Write-Host "✅ Front Door deployed." -ForegroundColor Green
Write-Host "   Host: https://$fdHost" -ForegroundColor Green
Write-Host ""
Write-Host "Build the portal with npm run build -- --base=/ before publishing to the SWA." -ForegroundColor Yellow
