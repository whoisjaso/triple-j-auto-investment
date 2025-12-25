# FORCE COMPLETE REBUILD IN DOKPLOY

## The deployment might be using cached/old code. Here's how to force a clean rebuild:

### Option 1: Force Rebuild via DokPloy UI

1. Go to DokPloy → Your Project
2. Click "Settings" tab
3. Scroll to "Advanced Settings"
4. Find "Build Options" or "Rebuild"
5. Click "Clean Build" or "Rebuild without cache"
6. Wait for deployment to complete (~5 min)

### Option 2: Force Rebuild via SSH

Run these commands:

```bash
# SSH into server
ssh root@178.156.146.106

# Remove the service completely
docker service rm triplejautoinvestment-triplejfrontend-gurbak

# Remove all images (force clean rebuild)
docker system prune -af

# Go back to DokPloy and click "Deploy" again
# This will rebuild everything from scratch
```

### Option 3: Manual Docker Build (Most Reliable)

```bash
# On your local machine, build and test locally first
cd D:\triple-j-auto-investment

# Build Docker image locally
docker build -t triple-j-test --build-arg VITE_SUPABASE_URL=https://scgmpliwlfabnpygvbsy.supabase.co --build-arg VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZ21wbGl3bGZhYm5weWd2YnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDg0NjQsImV4cCI6MjA4MDk4NDQ2NH0.o8jvtDPVJ6DGwDy6QPuG_3XzmHPuR_hZ82DZsdeDisM --build-arg VITE_ADMIN_EMAIL=jobawems@gmail.com --build-arg VITE_ADMIN_PASSWORD=adekunle12 .

# Run it locally to test
docker run -p 8080:80 triple-j-test

# Open http://localhost:8080 in browser
# If it works locally, the issue is DokPloy deployment
```

## VERIFICATION CHECKLIST

After rebuild, verify:

1. ✅ Deployment shows "SUCCESS" in DokPloy
2. ✅ Browser shows vehicles loading
3. ✅ No CSP errors in console
4. ✅ Mobile shows full UI
5. ✅ Login works and redirects

## If Still Broken After Clean Rebuild:

The issue is NOT the code - it's the DokPloy configuration.

Check:
1. Environment variables are EXACTLY correct (no extra spaces)
2. Domain DNS is pointing correctly
3. Traefik is routing properly
4. Firewall isn't blocking WebSocket connections
