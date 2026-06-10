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

function Exit-Script {
    param([int]$ExitCode = 0)
    Write-Host "`nPress any key to exit..." -ForegroundColor Gray
    try {
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } catch {
        # Fallback for non-interactive hosts
        Read-Host "Press Enter to exit"
    }
    exit $ExitCode
}

Write-Host "`n=== CRM Database Schema Import ===" -ForegroundColor Cyan

# Verify Node.js is available
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not on PATH. Install it from https://nodejs.org"
    Exit-Script 1
}

# Verify schema files exist (either _master_schema.json or legacy db_schema.json)
$MasterSchema = Join-Path $ScriptDir "_master_schema.json"
$LegacySchema = Join-Path $ScriptDir "db_schema.json"

if (!(Test-Path $MasterSchema) -and !(Test-Path $LegacySchema)) {
    Write-Error "Schema file not found in: $ScriptDir"
    Write-Host "Please ensure _master_schema.json (and the collection JSON files) or db_schema.json are in the same folder as this script."
    Exit-Script 1
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
        Exit-Script 1
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
    Exit-Script 0
} else {
    Write-Error "Schema import failed (exit code $LASTEXITCODE)."
    Exit-Script 1
}
