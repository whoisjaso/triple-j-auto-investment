# Triple J Auto Investment - Setup Guide

## 🚀 IMMEDIATE ACTIONS REQUIRED BEFORE LAUNCH

### 1. **Configure Gemini AI (CRITICAL)**
Your AI-powered vehicle descriptions and financial analysis won't work without this.

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open `.env.local`
3. Replace `PLACEHOLDER_API_KEY` with your real key:
   ```
   VITE_GEMINI_API_KEY=AIzaSy...your_actual_key
   ```

---

### 2. **Configure Email Notifications (CRITICAL)**
You won't receive customer inquiries without this.

#### Steps:
1. Go to [EmailJS.com](https://www.emailjs.com/) and create a free account
2. Click "Add New Service" → Choose Gmail (or your email provider)
3. Follow the prompts to connect your email
4. Click "Email Templates" → "Create New Template"
5. Paste this template:

**Subject:**
```
🚨 NEW LEAD - Triple J Auto Investment
```

**Body:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NEW CUSTOMER INQUIRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CUSTOMER DETAILS:
   Name: {{customer_name}}
   Email: {{customer_email}}
   Phone: {{customer_phone}}

🚗 VEHICLE INTEREST:
   {{vehicle_interest}}

⏰ TIMESTAMP:
   {{timestamp}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This lead was captured via TripleJAutoInvestment.com

⚡ Action Required: Contact within 60 minutes for maximum conversion.
```

6. Copy your **Service ID**, **Template ID**, and **Public Key**
7. Paste into `.env.local`:
   ```
   VITE_EMAILJS_SERVICE_ID=service_abc123
   VITE_EMAILJS_TEMPLATE_ID=template_xyz789
   VITE_EMAILJS_PUBLIC_KEY=xWq9K...your_key
   ```

---

### 3. **Verify Phone Number**
Check if `+1 (832) 777-7580` is correct. If not, update in:
- `index.html` (line 10)
- All page components (Contact, About, etc.)

---

### 4. **Change Admin Credentials (SECURITY)**
Default credentials are in `.env.local`:
```
VITE_ADMIN_EMAIL=jobawems@gmail.com
VITE_ADMIN_PASSWORD=adekunle12
```

**⚠️ CHANGE THE PASSWORD IMMEDIATELY**

---

## 📱 OPTIONAL ENHANCEMENTS

### Add Google Analytics (Recommended)
1. Get tracking ID from [Google Analytics](https://analytics.google.com/)
2. Add to `index.html` before `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Add Facebook Pixel (Optional)
1. Get Pixel ID from Meta Business Suite
2. Add to `index.html` before `</head>`:
```html
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
```

---

## 🌐 DEPLOYMENT

### Option 1: Netlify (Recommended - Free)
1. Push code to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Click "New site from Git" → Connect GitHub
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Environment Variables: Copy all from `.env.local`
6. Deploy!

Your site will be live at `https://your-site.netlify.app`

### Option 2: Vercel (Also Free)
Same process as Netlify, just use [Vercel](https://vercel.com/)

### Option 3: GitHub Pages
```bash
npm run build
npm run deploy
```

---

## 🔧 LOCAL DEVELOPMENT

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📋 CHECKLIST BEFORE GOING LIVE

- [ ] Gemini API key configured
- [ ] EmailJS configured and tested
- [ ] Admin password changed
- [ ] Phone number verified
- [ ] Google Analytics added (optional)
- [ ] Test email notifications (submit a test lead)
- [ ] Test on mobile device
- [ ] Test admin login
- [ ] Add at least 3 vehicles to inventory
- [ ] Update Google Sheets if using sync feature

---

## 🆘 TROUBLESHOOTING

### "AI descriptions not generating"
- Check Gemini API key in `.env.local`
- Check browser console for errors
- Verify API key is valid at [Google AI Studio](https://makersuite.google.com/)

### "Not receiving lead emails"
- Check EmailJS dashboard for failed sends
- Verify all 3 keys are correct in `.env.local`
- Check spam folder
- Test with EmailJS dashboard's test feature

### "Can't login to admin"
- Email: Value in `VITE_ADMIN_EMAIL`
- Password: Value in `VITE_ADMIN_PASSWORD`
- Clear browser cache and try again

---

## 🎯 NEXT STEPS AFTER LAUNCH

1. **Add Real Vehicles**: Go to `/admin/inventory` and add your inventory
2. **Monitor Leads**: Check `/admin/dashboard` daily
3. **Backup Data**: Periodically export inventory from admin panel
4. **Update Content**: Refine vehicle descriptions for SEO
5. **Social Media**: Share individual vehicle pages on Instagram/Facebook

---

## 📞 SUPPORT

If you encounter issues:
1. Check browser console (F12) for error messages
2. Verify all environment variables are set
3. Clear browser cache and hard reload (Ctrl+Shift+R)

---

**Built with sovereign precision. Deploy with dominion.**
