# Production Deployment Guide

## Environment Setup

### 1. Environment Variables

#### For GitHub Actions Deployment (Recommended)
Set the following GitHub Secrets in your repository (Settings → Secrets and variables → Actions):

```bash
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key  
VITE_SUPABASE_PROJECT_ID=your_production_project_id
```

#### For Other Deployment Platforms
Create the following environment variables in your deployment platform:

```bash
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_DEBUG_MODE=false
```

#### Optional Variables
```bash
VITE_APP_NAME=Plan View Kitchen 3D
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ANALYTICS_ID=your_analytics_id
```

### 2. Supabase Configuration

1. **Create Production Supabase Project:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create a new project for production
   - Note down the project URL and anon key

2. **Database Setup:**
   - Run all migrations from `supabase/migrations/` on production database
   - Set up Row Level Security (RLS) policies
   - Configure authentication settings

3. **Security Configuration:**
   - Enable RLS on all tables
   - Set up proper CORS policies
   - Configure rate limiting
   - Set up monitoring and alerts

### 3. Build and Deploy

#### Local Build
```bash
# Install dependencies
npm install

# Build for production
npm run build:prod

# Preview production build locally
npm run preview:prod
```

#### Deployment Platforms

##### Vercel
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

##### Netlify
1. Connect your GitHub repository
2. Set environment variables in Netlify dashboard
3. Configure build command: `npm run build:prod`
4. Set publish directory: `dist`

##### AWS S3 + CloudFront
1. Build the project: `npm run build:prod`
2. Upload `dist` folder to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain and SSL certificate

### 4. Security Checklist

- [ ] Environment variables are set securely
- [ ] No hardcoded credentials in code
- [ ] HTTPS is enabled
- [ ] Security headers are configured
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Monitoring and logging are set up
- [ ] Backup strategy is in place

### 5. Performance Optimization

- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Set up caching headers
- [ ] Optimize images and assets
- [ ] Enable service worker for offline support

### 6. Monitoring

Set up monitoring for:
- Application performance
- Error tracking
- User analytics
- Database performance
- Security events

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure variables start with `VITE_`
   - Check deployment platform configuration
   - Verify variable names match exactly

2. **Supabase Connection Issues**
   - Verify URL and key are correct
   - Check CORS configuration
   - Ensure RLS policies are set up

3. **Build Failures**
   - Check for TypeScript errors
   - Verify all dependencies are installed
   - Review build logs for specific errors

### Support

For additional support, check:
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://react.dev/)


