# ─────────────────────────────────────────────────────────────────────────────
# Provision Azure Front Door to mount the always-latest Kratos app under
# /kratos/* on the same host as the agentic-loop-site.
#
# Prereqs:
#   - The agentic-loop-site Static Web App is already deployed (see ../deploy.ps1).
#   - The Kratos frontend Static Web App is already deployed, built with
#     NEXT_PUBLIC_BASE_PATH=/kratos (see the kratos-agent repo).
#   - `az` CLI logged in to the right subscription.
#
# This script resolves both SWA default hostnames and deploys infra/frontdoor.bicep.
# It prints the Front Door host + the Kratos EasyAuth redirect URI you must add to
# the Kratos Entra app registration.
# ─────────────────────────────────────────────────────────────────────────────

param(
  [string]$ResourceGroup = 'rg-agentic-loop',
  [string]$SiteSwaName   = 'agentic-loop',
  [string]$KratosSwaName = 'kratos-frontend',
  [string]$KratosSwaResourceGroup = '',
  [string]$KratosApiContainerApp = '',
  [string]$KratosApiResourceGroup = '',
  [string]$ProfileName   = 'afd-agentic-loop',
  [string]$EndpointName  = 'agentic-loop',
  [ValidateSet('Standard_AzureFrontDoor', 'Premium_AzureFrontDoor')]
  [string]$Sku           = 'Standard_AzureFrontDoor'
)

$ErrorActionPreference = 'Stop'

if (-not $KratosSwaResourceGroup) { $KratosSwaResourceGroup = $ResourceGroup }
if (-not $KratosApiResourceGroup) { $KratosApiResourceGroup = $KratosSwaResourceGroup }

Write-Host "Resolving Static Web App hostnames..." -ForegroundColor Cyan

$siteHost = az staticwebapp show `
  --name $SiteSwaName --resource-group $ResourceGroup `
  --query 'defaultHostname' -o tsv

$kratosHost = az staticwebapp show `
  --name $KratosSwaName --resource-group $KratosSwaResourceGroup `
  --query 'defaultHostname' -o tsv

if (-not $siteHost)   { throw "Could not resolve site SWA '$SiteSwaName' hostname." }
if (-not $kratosHost) { throw "Could not resolve Kratos SWA '$KratosSwaName' hostname." }

# Resolve the Kratos backend Container App FQDN (fronted at /kratos/api/* so the
# embedded UI calls the backend same-origin, no CORS). If the app name was not
# supplied, discover the single Container App in the Kratos resource group.
if (-not $KratosApiContainerApp) {
  $KratosApiContainerApp = az containerapp list `
    --resource-group $KratosApiResourceGroup `
    --query "[?starts_with(name, 'ca-agent')].name | [0]" -o tsv
}
if (-not $KratosApiContainerApp) {
  throw "Could not find a Kratos backend Container App in '$KratosApiResourceGroup'. Pass -KratosApiContainerApp explicitly."
}

$kratosApiHost = az containerapp show `
  --name $KratosApiContainerApp --resource-group $KratosApiResourceGroup `
  --query 'properties.configuration.ingress.fqdn' -o tsv

if (-not $kratosApiHost) { throw "Could not resolve Kratos backend Container App '$KratosApiContainerApp' FQDN." }

Write-Host "  site       : $siteHost"      -ForegroundColor Green
Write-Host "  kratos     : $kratosHost"    -ForegroundColor Green
Write-Host "  kratos-api : $kratosApiHost" -ForegroundColor Green

Write-Host "Deploying Front Door (this can take a few minutes)..." -ForegroundColor Cyan

$outputs = az deployment group create `
  --resource-group $ResourceGroup `
  --template-file "$PSScriptRoot/frontdoor.bicep" `
  --parameters `
    profileName=$ProfileName `
    endpointName=$EndpointName `
    siteHostName=$siteHost `
    kratosHostName=$kratosHost `
    kratosApiHostName=$kratosApiHost `
    sku=$Sku `
  --query 'properties.outputs' -o json | ConvertFrom-Json

$fdHost      = $outputs.frontDoorHostName.value
$redirectUri = $outputs.kratosAuthRedirectUri.value

Write-Host ""
Write-Host "✅ Front Door deployed." -ForegroundColor Green
Write-Host "   Host: https://$fdHost" -ForegroundColor Green
Write-Host ""
Write-Host "➡  Add this redirect URI to the Kratos Entra app registration:" -ForegroundColor Yellow
Write-Host "   $redirectUri" -ForegroundColor Yellow
Write-Host ""
Write-Host "➡  Build the site with VITE_KRATOS_BASE=/kratos (default) so the" -ForegroundColor Yellow
Write-Host "   persona builder + launcher deep-link into https://$fdHost/kratos/." -ForegroundColor Yellow
