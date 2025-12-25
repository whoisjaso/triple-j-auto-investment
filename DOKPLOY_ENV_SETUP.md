# DokPloy Environment Variables Setup

## CRITICAL: These environment variables MUST be set in DokPloy

Go to your DokPloy project → Settings → Environment Variables

Add the following variables:

```bash
VITE_SUPABASE_URL=https://scgmpliwlfabnpygvbsy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZ21wbGl3bGZhYm5weWd2YnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDg0NjQsImV4cCI6MjA4MDk4NDQ2NH0.o8jvtDPVJ6DGwDy6QPuG_3XzmHPuR_hZ82DZsdeDisM
VITE_ADMIN_EMAIL=jobawems@gmail.com
VITE_ADMIN_PASSWORD=adekunle12
VITE_GEMINI_API_KEY=PLACEHOLDER_API_KEY
VITE_EMAILJS_SERVICE_ID=YOUR_SERVICE_ID
VITE_EMAILJS_TEMPLATE_ID=YOUR_TEMPLATE_ID
VITE_EMAILJS_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

## How to Set Them:

1. Log in to DokPloy
2. Navigate to your Triple J Auto project
3. Click "Settings" tab
4. Scroll to "Environment Variables" section
5. Add each variable above with its corresponding value
6. Click "Save"
7. **IMPORTANT:** Trigger a new deployment after saving

## Verification:

After deployment, open the browser console on your deployed site.
You should see logs like:
```
✅ Loaded X vehicles from Supabase
✅ Login successful: youremail@example.com
```

If you see:
```
❌ CRITICAL: Missing Supabase environment variables!
```

Then the environment variables are NOT set correctly in DokPloy.

## Troubleshooting:

- Make sure there are no extra spaces before/after the values
- Variables must start with `VITE_` prefix for Vite to expose them
- After changing env vars, ALWAYS redeploy (don't just restart)
- Check DokPloy build logs to ensure variables are being passed
