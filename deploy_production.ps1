# CRM Production Pipeline Deployment Script

#$TargetRoot = "C:\inetpub"
#$FrontendTarget = "$TargetRoot\wwwroot\crm"
#$BackendTarget = "$TargetRoot\backend"
#$DatabaseTarget = "$TargetRoot\database"

$TargetRoot = "D:\production"
$FrontendTarget = "$TargetRoot\wwwroot\crm"
$BackendTarget = "$TargetRoot\backend"
$DatabaseTarget = "$TargetRoot\database"

$SourceRoot = "d:\crm"
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

# 5. Database Structure Backup
Write-Host "`n[5/5] Performing Database Structure Backup..." -ForegroundColor Yellow
Set-Location $SourceRoot
# Try to run the node script. Ensure mongodb is installed or use backend's node_modules
if (!(Test-Path "node_modules\mongodb")) {
    Write-Host "Installing mongodb driver for backup script..."
    npm install mongodb --no-save
}
node backup_db_schema.js "$DatabaseTarget"
Copy-Item -Path "import_db_schema.js" -Destination "$DatabaseTarget" -Force
Copy-Item -Path "import_db_schema.ps1" -Destination "$DatabaseTarget" -Force

Write-Host "`n--- Deployment Completed Successfully! ---" -ForegroundColor Green
Write-Host "Frontend: $FrontendTarget"
Write-Host "Backend: $BackendTarget"
Write-Host "Database Structure: $DatabaseTarget"
