# DokPloy Deployment Guide - Triple J Auto Investment

## Prerequisites
- DokPloy instance running on your server
- GitHub repository connected to DokPloy
- Domain name (optional)

## Quick Deployment Steps

### 1. Access DokPloy Dashboard
Navigate to your DokPloy instance (e.g., `https://your-dokploy-instance.com`)

### 2. Create New Application
1. Click **"Create Application"**
2. Select **"Docker"** as deployment type
3. Choose **"GitHub"** as source

### 3. Configure Application
```json
Name: triple-j-auto-investment
Repository: whoisjaso/triple-j-auto-investment
Branch: main
Build Type: Dockerfile
Port: 80
```

### 4. Set Environment Variables
**CRITICAL:** Add these environment variables in DokPloy:

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://scgmpliwlfabnpygvbsy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZ21wbGl3bGZhYm5weWd2YnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDg0NjQsImV4cCI6MjA4MDk4NDQ2NH0.o8jvtDPVJ6DGwDy6QPuG_3XzmHPuR_hZ82DZsdeDisM

# Admin Authentication (REQUIRED)
VITE_ADMIN_EMAIL=jobawems@gmail.com
VITE_ADMIN_PASSWORD=adekunle12

# EmailJS (Optional - for contact form)
VITE_EMAILJS_SERVICE_ID=YOUR_SERVICE_ID
VITE_EMAILJS_TEMPLATE_ID=YOUR_TEMPLATE_ID
VITE_EMAILJS_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

**Important:** Environment variables must be set BEFORE building, as Vite embeds them during build time.

### 5. Configure Domain (Optional)
1. In DokPloy, go to **Domains** section
2. Add your custom domain (e.g., `triplejautoinvestment.com`)
3. Configure DNS records as shown in DokPloy
4. Enable SSL/TLS (automatic with Let's Encrypt)

### 6. Deploy
Click **"Deploy"** button in DokPloy

DokPloy will:
- Clone the repository
- Build Docker image
- Start container
- Configure health checks
- Set up reverse proxy

### 7. Verify Deployment
1. Check deployment logs in DokPloy
2. Access your app at the provided URL
3. Test admin login: `/login`
4. Verify Supabase connection
5. Check inventory sync

## Local Testing (Before Deployment)

Test the Docker build locally:

```bash
# Build the image
docker build -t triple-j-auto-investment .

# Run container
docker run -p 8080:80 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  triple-j-auto-investment

# Access at http://localhost:8080
```

Or use docker-compose:

```bash
docker-compose up --build
```

## Auto-Deploy on Git Push

DokPloy is configured for auto-deployment:
- Any push to `main` branch triggers automatic rebuild
- Check `dokploy.json` for configuration

## Monitoring

DokPloy provides:
- Real-time logs
- Container stats (CPU, Memory, Network)
- Health check status
- Restart policies

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify GitHub connection
- Review build logs in DokPloy

### App Not Loading
- Check container is running
- Verify port 80 is exposed
- Check health endpoint: `/health`

### Database Connection Issues
- Verify Supabase URL and key
- Check Supabase dashboard for connection limits
- Review browser console for errors

## SEO Features Included

✅ **Meta Tags**: Title, description, keywords  
✅ **Open Graph**: Social media optimization  
✅ **Schema.org**: AutoDealer, FAQ, Breadcrumbs  
✅ **GEO Tags**: Local Houston SEO  
✅ **AEO**: Answer Engine Optimization  

## Security Features

✅ Security headers (XSS, CSRF, Clickjacking)  
✅ HTTPS (via DokPloy/Let's Encrypt)  
✅ Gzip compression  
✅ Asset caching  
✅ Health checks  

## Support

- **DokPloy Docs**: https://docs.dokploy.com
- **GitHub Repo**: https://github.com/whoisjaso/triple-j-auto-investment
- **Supabase Dashboard**: https://supabase.com/dashboard

---

**Deployment Status**: Ready for production 🚀
