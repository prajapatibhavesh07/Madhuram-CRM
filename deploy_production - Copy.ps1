# CRM Production Pipeline Deployment Script

#$TargetRoot = "C:\inetpub"
#$FrontendTarget = "$TargetRoot\wwwroot\crm"
#$BackendTarget = "$TargetRoot\backend"
#$DatabaseTarget = "$TargetRoot\database"

$TargetRoot = "D:\production"
$FrontendTarget = "$TargetRoot"
$BackendTarget = "$TargetRoot\server"
$DatabaseTarget = "$TargetRoot\database"

$SourceRoot = "D:\bhavesh\Madhuram-CRM"
$FrontendSource = "$SourceRoot\react-app"
$BackendSource = "$SourceRoot\express-mongo-backend"

Write-Host "--- Starting Production Pipeline ---" -ForegroundColor Cyan

# 1. Build Frontend
Write-Host "`n[1/5] Building Frontend..." -ForegroundColor Yellow
Set-Location $FrontendSource
npm install
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Frontend build failed!"; exit }

# 2. Cleanup Target Directories
Write-Host "`n[2/5] Cleaning Target Directories in $TargetRoot..." -ForegroundColor Yellow
foreach ($dir in @($FrontendTarget, $BackendTarget, $DatabaseTarget)) {
    if (Test-Path $dir) {
        Write-Host "Removing old content in $dir..."
        Remove-Item -Path "$dir\*" -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "Creating directory $dir..."
        New-Item -ItemType Directory -Path $dir -Force
    }
}

# 3. Deploy Frontend
Write-Host "`n[3/5] Deploying Frontend to $FrontendTarget..." -ForegroundColor Yellow
Copy-Item -Path "$FrontendSource\dist\*" -Destination $FrontendTarget -Recurse -Force

# 4. Deploy Backend
Write-Host "`n[4/5] Deploying Backend to $BackendTarget..." -ForegroundColor Yellow
# Copy all files except node_modules, .git, and .env
Get-ChildItem -Path $BackendSource -Exclude "node_modules", ".git", ".env" | Copy-Item -Destination $BackendTarget -Recurse -Force
# Ensure .env.production is copied as .env if it exists
if (Test-Path "$BackendSource\.env.production") {
    Copy-Item -Path "$BackendSource\.env.production" -Destination "$BackendTarget\.env" -Force
}

# 5. Database Schema Export (structure only — no document data)
Write-Host "`n[5/5] Exporting Database Schema (structure only)..." -ForegroundColor Yellow

Set-Location $SourceRoot

# Install mongodb driver at project root if not present
if (!(Test-Path "$SourceRoot\node_modules\mongodb")) {
    Write-Host "  Installing mongodb driver for schema export..." -ForegroundColor Gray
    npm install mongodb --no-save --prefix "$SourceRoot"
}

# Run the schema export script
node "$SourceRoot\backup_db_schema.js" "$DatabaseTarget"
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Schema export failed (exit $LASTEXITCODE). Check MongoDB is running."
} else {
    Write-Host "  Schema export complete." -ForegroundColor Green
}

# Copy the import helper scripts alongside the schema so production can restore
Copy-Item -Path "$SourceRoot\import_db_schema.js"  -Destination $DatabaseTarget -Force
Copy-Item -Path "$SourceRoot\import_db_schema.ps1" -Destination $DatabaseTarget -Force

Write-Host "`n--- Deployment Completed Successfully! ---" -ForegroundColor Green
Write-Host "Frontend : $FrontendTarget"
Write-Host "Backend  : $BackendTarget"
Write-Host "Database : $DatabaseTarget  (schema only — see db_schema.json)"
Write-Host "`nTo recreate schema on production, run:"
Write-Host "  $DatabaseTarget\import_db_schema.ps1" -ForegroundColor DarkCyan
