# GitHub Actions Deployment Setup Guide

## ✅ Step 1: Workflow File Created
The GitHub Actions workflow file has been created at `.github/workflows/deploy.yml`

## 🔑 Step 2: Set Up GitHub Secrets

Go to your GitHub repository and add these secrets:

### Navigate to Secrets:
1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Required Secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VPS_HOST` | `31.97.115.105` | Your VPS IP address |
| `VPS_USER` | `root` | SSH username for your VPS |
| `VPS_SSH_KEY` | `[Your private SSH key]` | Content of your private SSH key file |
| `VPS_SSH_PASSPHRASE` | `[Your SSH key passphrase]` | Passphrase for your encrypted SSH key |
| `VPS_PORT` | `22` | SSH port (optional, defaults to 22) |

## 🔐 Step 3: SSH Key Setup

### If you already have SSH access to your VPS:
1. Find your private key file (usually `~/.ssh/id_rsa` or similar)
2. Copy the **entire content** of the private key file
3. Paste it as the value for `VPS_SSH_KEY` secret

### If you need to create SSH keys:

#### On Windows (PowerShell):
```powershell
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Display your public key (to add to VPS)
Get-Content ~/.ssh/id_rsa.pub

# Display your private key (to add to GitHub secrets)
Get-Content ~/.ssh/id_rsa
```

#### Add public key to your VPS:
```bash
# SSH into your VPS
ssh root@31.97.115.105

# Add your public key
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

## 🚀 Step 4: Test the Deployment

### Automatic Deployment:
- **Push any changes** to the `main` branch
- GitHub Actions will **automatically** build and deploy
- Check the **Actions** tab in GitHub to see progress

### Manual Deployment:
1. Go to your GitHub repository
2. Click the **Actions** tab
3. Click **Deploy to Production** workflow
4. Click **Run workflow** button
5. Select `main` branch and click **Run workflow**

## 📊 Step 5: Monitor Deployments

### View Deployment Status:
- **Actions tab** shows all deployment runs
- **Green checkmark** = successful deployment
- **Red X** = failed deployment (click to see logs)

### Deployment Features:
✅ **Automatic backup** before each deployment  
✅ **Build verification** before uploading  
✅ **File upload** with proper permissions  
✅ **Health check** after deployment  
✅ **Detailed logs** for troubleshooting  

## 🔧 Troubleshooting

### Common Issues:

**SSH Connection Failed:**
- Verify `VPS_HOST`, `VPS_USER`, and `VPS_SSH_KEY` secrets
- Test SSH connection manually: `ssh root@31.97.115.105`

**Build Failed:**
- Check if `npm run build:prod` works locally
- Verify all dependencies are in `package.json`

**Permission Denied:**
- Ensure SSH key has proper permissions on VPS
- Verify user has write access to `/var/www/rightfit-kitchens.co.uk`

**Deployment Test Failed:**
- Check if nginx is running on VPS
- Verify domain/IP configuration
- Check if files were uploaded correctly

## 🎯 Next Steps

1. **Add the secrets** to your GitHub repository
2. **Commit and push** this setup to trigger first deployment
3. **Monitor the Actions tab** to see deployment progress
4. **Test your live site** at http://31.97.115.105/

## 📝 Usage Examples

### Commit and Deploy:
```bash
git add .
git commit -m "feat: Add new feature"
git push origin main
# 🚀 Automatic deployment triggered!
```

### Manual Deploy:
- Use the **Run workflow** button in GitHub Actions
- Perfect for deploying without code changes
- Useful for configuration updates

---

**🎉 Once set up, you'll have a professional CI/CD pipeline with zero manual deployment steps!**
