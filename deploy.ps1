# Load VITE_AZURE_CLIENT_ID from .env if present
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*VITE_AZURE_CLIENT_ID\s*=\s*(.+)$') {
            $env:VITE_AZURE_CLIENT_ID = $Matches[1].Trim()
        }
    }
}

$SWA_TOKEN = az staticwebapp secrets list --name agentic-loop --resource-group rg-agentic-loop --query properties.apiKey -o tsv

npm run build
npx @azure/static-web-apps-cli deploy ./dist --deployment-token $SWA_TOKEN --env default
