# Deployment Status

## Current Deployment Setup

### ✅ **Active Deployment Method: GitHub Actions**

**File:** `.github/workflows/deploy.yml`

**Trigger:** Automatic on push to `main` branch

**Process:**
1. **Build** - Compiles the project using `npm run build`
2. **Package** - Creates deployment package from `dist/` folder
3. **Deploy** - Uploads to VPS at `/var/www/rightfit-kitchens.co.uk`
4. **Verify** - Tests deployment and sets permissions

**VPS Details:**
- **Host:** Configured via GitHub Secrets (`VPS_HOST`)
- **User:** Configured via GitHub Secrets (`VPS_USER`)
- **Path:** `/var/www/rightfit-kitchens.co.uk`
- **SSH:** Uses SSH key authentication

### 🗑️ **Archived Deployment Methods**

#### **Manual PowerShell Script**
**File:** `docs/deployment/deploy.ps1` (archived)

**Purpose:** Manual deployment script for testing
**Status:** Superseded by GitHub Actions
**Use Case:** Was used for testing deployment process

#### **Manual Bash Script**
**File:** `docs/deployment/deploy.sh` (archived)

**Purpose:** Manual deployment script for testing
**Status:** Superseded by GitHub Actions
**Use Case:** Was used for testing deployment process

## Deployment Workflow

```
Push to main → GitHub Actions → Build → Deploy to VPS → Live Site
```

## Environment Variables

The deployment uses these GitHub Secrets:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_SUPABASE_PROJECT_ID` - Supabase project ID
- `VPS_HOST` - VPS IP address
- `VPS_USER` - VPS username
- `VPS_SSH_KEY` - SSH private key
- `VPS_SSH_PASSPHRASE` - SSH key passphrase
- `VPS_PORT` - SSH port (default: 22)

## Build Commands

- **Development:** `npm run build`
- **Production:** `npm run build:prod`

## Deployment Features

- **Automatic backups** - Creates timestamped backups before deployment
- **Clean deployment** - Removes old files before uploading new ones
- **Permission setting** - Sets proper file permissions for web server
- **Deployment testing** - Verifies deployment with HTTP status check
- **Manual trigger** - Can be triggered manually from GitHub UI

## Monitoring

- **GitHub Actions logs** - View deployment status and logs
- **VPS logs** - Check server logs if issues occur
- **HTTP status** - Automatic testing after deployment

## Rollback

If deployment fails:
1. Check GitHub Actions logs for errors
2. Previous backup is automatically created
3. Manual rollback possible using archived scripts if needed

## Security

- **SSH key authentication** - Secure connection to VPS
- **Environment variables** - Sensitive data stored in GitHub Secrets
- **File permissions** - Proper permissions set for web server
- **Clean deployment** - Old files removed to prevent conflicts
