# import_db_schema.ps1
# Run on the PRODUCTION server to recreate the MongoDB schema structure.
# Usage:
#   .\import_db_schema.ps1
#   .\import_db_schema.ps1 -MongoUri "mongodb://127.0.0.1:27017/crm_db"
#
# Prerequisites:
#   - Node.js installed on the production machine
#   - MongoDB running and accessible

param(
    [string]$MongoUri = ""
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n=== CRM Database Schema Import ===" -ForegroundColor Cyan

# Verify Node.js is available
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not on PATH. Install it from https://nodejs.org"
    exit 1
}

# Verify schema file exists
$SchemaFile = Join-Path $ScriptDir "db_schema.json"
if (!(Test-Path $SchemaFile)) {
    Write-Error "Schema file not found: $SchemaFile"
    Write-Host "Copy db_schema.json (from your backup) to the same folder as this script."
    exit 1
}

# Install mongodb driver locally if not already present
$NodeModules = Join-Path $ScriptDir "node_modules\mongodb"
if (!(Test-Path $NodeModules)) {
    Write-Host "Installing mongodb driver (one-time)..." -ForegroundColor Yellow
    Push-Location $ScriptDir
    npm install mongodb --no-save
    Pop-Location
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install mongodb driver."
        exit 1
    }
}

# Run the import script
Write-Host "Running schema import..." -ForegroundColor Yellow
$ImportScript = Join-Path $ScriptDir "import_db_schema.js"

if ($MongoUri -ne "") {
    node $ImportScript $ScriptDir $MongoUri
} else {
    node $ImportScript $ScriptDir
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSchema import completed successfully." -ForegroundColor Green
} else {
    Write-Error "Schema import failed (exit code $LASTEXITCODE)."
    exit 1
}
