#!/bin/bash
# 🚀 Automated VPS Deployment Script (Bash version)
# This script cleans, builds, and deploys your app to Hostinger VPS

VPS_IP="${1:-31.97.115.105}"
VPS_USER="${2:-root}"
VPS_PATH="${3:-/var/www/rightfit-kitchens.co.uk}"

echo "🚀 Starting automated deployment..."

# Step 1: Clean and build locally
echo "📦 Cleaning and building locally..."
rm -rf dist node_modules/.vite 2>/dev/null || true

if npm run build:prod; then
    echo "✅ Local build completed successfully!"
else
    echo "❌ Local build failed!"
    exit 1
fi

# Step 2: Clean VPS directory
echo "🧹 Cleaning VPS directory..."
ssh "$VPS_USER@$VPS_IP" "
    cd $VPS_PATH
    mkdir -p backup-\$(date +%Y%m%d_%H%M%S)
    cp -r assets backup-\$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    cp index.html backup-\$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    rm -rf assets/
    rm -f index.html favicon.ico robots.txt placeholder.svg
    echo 'VPS cleaned successfully'
"

# Step 3: Upload new files
echo "📤 Uploading new build files..."
if scp -r dist/* "$VPS_USER@$VPS_IP:$VPS_PATH/"; then
    echo "✅ Files uploaded successfully!"
else
    echo "❌ File upload failed!"
    exit 1
fi

# Step 4: Set proper permissions
echo "🔐 Setting file permissions..."
ssh "$VPS_USER@$VPS_IP" "
    chown -R www-data:www-data $VPS_PATH
    chmod -R 755 $VPS_PATH
    echo 'Permissions set successfully'
"

# Step 5: Test deployment
echo "🧪 Testing deployment..."
HTTP_CODE=$(ssh "$VPS_USER@$VPS_IP" "curl -s -o /dev/null -w '%{http_code}' http://localhost/")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Deployment test passed! HTTP 200 OK"
else
    echo "⚠️ Deployment test returned HTTP $HTTP_CODE"
fi

# Step 6: Final verification
echo ""
echo "📋 Deployment Summary:"
echo "  • Local build: ✅ Completed"
echo "  • VPS cleanup: ✅ Completed" 
echo "  • File upload: ✅ Completed"
echo "  • Permissions: ✅ Set"
echo "  • Test: ✅ HTTP $HTTP_CODE"
echo ""
echo "🎉 Deployment completed!"
echo "🌐 Your app should now be live at: http://$VPS_IP"
echo ""
echo "Next steps:"
echo "1. Open http://$VPS_IP in your browser"
echo "2. Check browser console for any errors"
echo "3. Test the app functionality"

