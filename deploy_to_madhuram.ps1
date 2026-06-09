# Madhuram Live Deployment Script
# Primary Target: C:\inetpub\wwwroot\Madhuram (Requires Administrator Privileges)
$TargetRoot = "D:\production\Madhuram"
$FrontendTarget = $TargetRoot
$BackendTarget = "$TargetRoot\server"

$SourceRoot = "D:\bhavesh\Madhuram-CRM"
$FrontendSource = "$SourceRoot\react-app"
$BackendSource = "$SourceRoot\express-mongo-backend"

Write-Host "--- Starting Deployment to Madhuram ---" -ForegroundColor Cyan

# 1. Build Frontend (Ensure latest changes are included)
Write-Host "`n[1/4] Building Frontend..." -ForegroundColor Yellow
Set-Location $FrontendSource
# Set environment for production if needed
$env:NODE_ENV = "production"
npm run build
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Frontend build failed! Please check for errors." -ForegroundColor Red
    exit 
}

# 2. Prepare Target Directories
Write-Host "`n[2/4] Preparing Target Directories..." -ForegroundColor Yellow
if (!(Test-Path $BackendTarget)) {
    New-Item -ItemType Directory -Path $BackendTarget -Force
}

# 3. Deploy Frontend (dist contents to Madhuram root)
Write-Host "`n[3/4] Deploying Frontend to $FrontendTarget..." -ForegroundColor Yellow
# Clean old frontend files (avoiding deleting the 'server' folder)
Get-ChildItem -Path $FrontendTarget -Exclude "server", "uploads" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "$FrontendSource\dist\*" -Destination $FrontendTarget -Recurse -Force

# 4. Deploy Backend (to Madhuram\server)
Write-Host "`n[4/4] Deploying Backend to $BackendTarget..." -ForegroundColor Yellow
# Copy backend files excluding node_modules and local env
Get-ChildItem -Path $BackendSource -Exclude "node_modules", ".git", ".env" | Copy-Item -Destination $BackendTarget -Recurse -Force

# Copy production env if it exists
if (Test-Path "$BackendSource\.env.production") {
    Copy-Item -Path "$BackendSource\.env.production" -Destination "$BackendTarget\.env" -Force
    Write-Host "Production .env file deployed." -ForegroundColor Gray
}

Write-Host "`n--- Deployment Completed Successfully! ---" -ForegroundColor Green
Write-Host "Website: $FrontendTarget"
Write-Host "API/Backend: $BackendTarget"
Write-Host "`nNOTE: Remember to run 'npm install' in the server folder on the live machine if dependencies changed." -ForegroundColor Cyan
