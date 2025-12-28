# Deployment Guide

This guide provides step-by-step instructions for deploying the BeyondChats Article System to production.

## 🎯 Deployment Overview

- **Backend (Laravel API)**: Deploy to Render using Docker
- **Frontend (React)**: Deploy to Netlify
- **Database**: Neon PostgreSQL (managed)
- **Enhancement Service**: Deploy to Render as background service

## 📋 Pre-Deployment Checklist

### 1. Repository Setup
- [ ] All code committed to main branch
- [ ] Environment variables configured
- [ ] Docker files tested locally
- [ ] Database migrations ready

### 2. External Services Setup
- [ ] Neon PostgreSQL database created
- [ ] Groq API key obtained
- [ ] Render account created
- [ ] Netlify account created

## 🚀 Step-by-Step Deployment

### Step 1: Database Setup (Neon PostgreSQL)

1. **Create Neon Database**
   ```bash
   # Visit https://neon.tech
   # Create new project
   # Note down connection details
   ```

2. **Configure Database**
   ```sql
   -- Database will be created automatically
   -- Note the connection string format:
   -- postgresql://username:password@host/database?sslmode=require
   ```

### Step 2: Backend Deployment (Render)

1. **Connect Repository to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

2. **Configure Build Settings**
   ```yaml
   # Render Configuration
   Name: beyondchats-api
   Environment: Docker
   Region: Oregon (US West)
   Branch: main
   Root Directory: blog-article-scraper
   
   # Build Command (leave empty for Docker)
   Build Command: 
   
   # Start Command (leave empty for Docker)
   Start Command: 
   ```

3. **Environment Variables on Render**
   ```env
   APP_NAME=BeyondChats Article System
   APP_ENV=production
   APP_KEY=base64:your-generated-key
   APP_DEBUG=false
   APP_URL=https://your-service-name.onrender.com
   
   DB_CONNECTION=pgsql
   DB_HOST=your-neon-host.neon.tech
   DB_PORT=5432
   DB_DATABASE=your-database
   DB_USERNAME=your-username
   DB_PASSWORD=your-password
   
   LOG_CHANNEL=stack
   LOG_LEVEL=error
   ```

4. **Deploy Backend**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Test API endpoints

### Step 3: Frontend Deployment (Netlify)

1. **Connect Repository to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select repository

2. **Configure Build Settings**
   ```yaml
   # Netlify Configuration
   Base directory: react-article-frontend
   Build command: npm run build
   Publish directory: react-article-frontend/dist
   ```

3. **Environment Variables on Netlify**
   ```env
   VITE_API_BASE_URL=https://your-render-service.onrender.com/api
   VITE_APP_NAME=BeyondChats Article System
   VITE_APP_VERSION=1.0.0
   ```

4. **Deploy Frontend**
   - Click "Deploy site"
   - Wait for build to complete
   - Test frontend functionality

### Step 4: Enhancement Service Deployment (Render)

1. **Create Background Service**
   - In Render Dashboard, click "New +" → "Background Worker"
   - Connect same repository
   - Configure settings:

   ```yaml
   Name: beyondchats-enhancement
   Environment: Docker
   Region: Oregon (US West)
   Branch: main
   Root Directory: article-enhancement-automation
   ```

2. **Environment Variables**
   ```env
   LARAVEL_API_BASE_URL=https://your-render-api.onrender.com/api
   GROQ_API_KEY=your-groq-api-key
   GROQ_MODEL=llama-3.1-70b-versatile
   LOG_LEVEL=info
   EXECUTION_MODE=non-interactive
   REQUEST_TIMEOUT=30000
   MAX_RETRIES=3
   ```

3. **Deploy Service**
   - Click "Create Background Worker"
   - Monitor logs for successful startup

## 🔧 Post-Deployment Configuration

### 1. Update CORS Settings

Update Laravel CORS configuration for production:

```php
// config/cors.php
'allowed_origins' => [
    'https://your-netlify-app.netlify.app',
    'https://your-custom-domain.com', // if using custom domain
],
```

### 2. Test API Endpoints

```bash
# Test backend API
curl https://your-render-api.onrender.com/api/articles

# Test frontend
# Visit https://your-netlify-app.netlify.app
```

### 3. Configure Custom Domains (Optional)

#### Netlify Custom Domain
1. Go to Site Settings → Domain management
2. Add custom domain
3. Configure DNS records

#### Render Custom Domain
1. Go to Service Settings → Custom Domains
2. Add custom domain
3. Configure DNS records

## 📊 Monitoring & Maintenance

### 1. Health Checks

Set up monitoring for:
- API endpoint availability
- Database connectivity
- Enhancement service status

### 2. Logging

Monitor logs in:
- Render Dashboard → Service → Logs
- Netlify Dashboard → Site → Functions (if using)

### 3. Performance Monitoring

- Monitor API response times
- Check database query performance
- Monitor frontend loading times

## 🔄 CI/CD Setup (Optional)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        # Render auto-deploys on push to main
        run: echo "Render will auto-deploy"
        
      - name: Deploy to Netlify
        # Netlify auto-deploys on push to main
        run: echo "Netlify will auto-deploy"
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check Neon database status
   # Verify connection string format
   # Check IP whitelist settings
   ```

2. **CORS Errors**
   ```bash
   # Update Laravel CORS configuration
   # Verify frontend URL in allowed origins
   ```

3. **Build Failures**
   ```bash
   # Check Dockerfile syntax
   # Verify all dependencies are listed
   # Check environment variables
   ```

4. **API Not Responding**
   ```bash
   # Check Render service logs
   # Verify environment variables
   # Test database connectivity
   ```

### Debug Commands

```bash
# Check service status
curl -I https://your-render-api.onrender.com/api/health

# Test database connection
# Use Render shell access to run:
php artisan tinker
DB::connection()->getPdo();

# Check logs
# View in Render Dashboard or use CLI tools
```

## 📞 Support

If you encounter issues:

1. Check service logs in respective dashboards
2. Verify all environment variables are set correctly
3. Test individual components locally
4. Check external service status (Neon, Groq API)

## 🎉 Deployment Complete

After successful deployment, you should have:

- ✅ Laravel API running on Render
- ✅ React frontend on Netlify
- ✅ Enhancement service running as background worker
- ✅ Database connected and migrated
- ✅ All services communicating properly

Your live application URLs:
- **Frontend**: https://your-netlify-app.netlify.app
- **API**: https://your-render-api.onrender.com/api
- **API Documentation**: https://your-render-api.onrender.com/api/documentation