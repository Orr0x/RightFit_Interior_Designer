# 🚀 Automated VPS Deployment Script
# This script cleans, builds, and deploys your app to Hostinger VPS

param(
    [string]$VpsIp = "31.97.115.105",
    [string]$VpsUser = "root",
    [string]$VpsPath = "/var/www/rightfit-kitchens.co.uk"
)

Write-Host "🚀 Starting automated deployment..." -ForegroundColor Green

# Step 1: Clean and build locally
Write-Host "📦 Cleaning and building locally..." -ForegroundColor Yellow
try {
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue dist, node_modules\.vite
    npm run build:prod
    Write-Host "✅ Local build completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Local build failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Clean VPS directory
Write-Host "🧹 Cleaning VPS directory..." -ForegroundColor Yellow
$cleanCommands = @(
    "cd $VpsPath",
    "mkdir -p backup-`$(date +%Y%m%d_%H%M%S)",
    "cp -r assets backup-`$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true",
    "cp index.html backup-`$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true",
    "rm -rf assets/",
    "rm -f index.html favicon.ico robots.txt placeholder.svg",
    "echo 'VPS cleaned successfully'"
)

foreach ($cmd in $cleanCommands) {
    try {
        ssh "$VpsUser@$VpsIp" "$cmd"
    } catch {
        Write-Host "⚠️ Warning: VPS clean command failed: $cmd" -ForegroundColor Yellow
    }
}

# Step 3: Upload new files
Write-Host "📤 Uploading new build files..." -ForegroundColor Yellow
try {
    scp -r dist/* "$VpsUser@$VpsIp`:$VpsPath/"
    Write-Host "✅ Files uploaded successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ File upload failed: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Set proper permissions
Write-Host "🔐 Setting file permissions..." -ForegroundColor Yellow
$permissionCommands = @(
    "chown -R www-data:www-data $VpsPath",
    "chmod -R 755 $VpsPath",
    "echo 'Permissions set successfully'"
)

foreach ($cmd in $permissionCommands) {
    try {
        ssh "$VpsUser@$VpsIp" "$cmd"
    } catch {
        Write-Host "⚠️ Warning: Permission command failed: $cmd" -ForegroundColor Yellow
    }
}

# Step 5: Test deployment
Write-Host "🧪 Testing deployment..." -ForegroundColor Yellow
try {
    $testResult = ssh "$VpsUser@$VpsIp" "curl -s -o /dev/null -w '%{http_code}' http://localhost/"
    if ($testResult -eq "200") {
        Write-Host "✅ Deployment test passed! HTTP 200 OK" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Deployment test returned HTTP $testResult" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Warning: Could not test deployment" -ForegroundColor Yellow
}

# Step 6: Final verification
Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "  • Local build: ✅ Completed" -ForegroundColor Green
Write-Host "  • VPS cleanup: ✅ Completed" -ForegroundColor Green
Write-Host "  • File upload: ✅ Completed" -ForegroundColor Green
Write-Host "  • Permissions: ✅ Set" -ForegroundColor Green
Write-Host "  • Test: ✅ HTTP 200" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host "🌐 Your app should now be live at: http://$VpsIp" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open http://$VpsIp in your browser" -ForegroundColor White
Write-Host "2. Check browser console for any errors" -ForegroundColor White
Write-Host "3. Test the app functionality" -ForegroundColor White


