# EntryLab.io Deployment Checklist

## 📦 What You Have Ready:

✅ **Production Build** - Located in `dist/` folder
✅ **WordPress Backend** - Running at `admin.entrylab.io`
✅ **Deployment Guide** - See `HOSTINGER-VPS-DEPLOYMENT.md`

---

## 🔑 Environment Variables Needed:

Copy these from Replit Secrets to your VPS:

1. **FOREX_API_KEY**: `(Your Finnhub API key for live forex prices)`
2. **SESSION_SECRET**: `(Your session secret for security)`

---

## 📋 Quick Start Steps:

### 1. **Setup VPS** (15 min)
   - [x] Purchase KVM 2 from Hostinger
   - [ ] Select Ubuntu + Node.js template
   - [ ] Note your VPS IP address
   - [ ] SSH into VPS: `ssh root@YOUR_VPS_IP`

### 2. **Prepare Server** (10 min)
   - [ ] Update system: `apt update && apt upgrade -y`
   - [ ] Install PM2: `npm install -g pm2`
   - [ ] Create directory: `mkdir -p /var/www/entrylab`

### 3. **Upload Files** (5 min)
   - [ ] Upload `dist/` folder to VPS
   - [ ] Upload `package.json` to VPS
   - [ ] Install dependencies: `npm install --production`

### 4. **Configure Environment** (5 min)
   - [ ] Create `.env` file with API keys
   - [ ] Set NODE_ENV=production

### 5. **Start Application** (5 min)
   - [ ] Start with PM2: `pm2 start dist/index.js --name entrylab`
   - [ ] Save process: `pm2 save && pm2 startup`
   - [ ] Test: Visit `http://YOUR_VPS_IP:3000`

### 6. **Setup Domain** (20 min - DNS propagation)
   - [ ] Point entrylab.io A record to VPS IP
   - [ ] Configure OpenLiteSpeed proxy
   - [ ] Install SSL: `certbot --nginx -d entrylab.io`

### 7. **Final Verification** (5 min)
   - [ ] Visit `https://entrylab.io`
   - [ ] Test article pages
   - [ ] Check Forex ticker updates
   - [ ] Test newsletter subscription
   - [ ] Check on mobile

---

## 📁 Files to Upload to VPS:

```
/var/www/entrylab/
├── dist/
│   ├── index.js          (Express server)
│   └── public/
│       ├── index.html    (React app)
│       └── assets/       (CSS + JS bundles)
├── package.json          (Dependencies list)
└── .env                  (Environment variables - create on VPS)
```

---

## 🚀 After Deployment:

Your workflow will be:
1. **Manage content** → Login to `admin.entrylab.io/wp-admin`
2. **Publish articles** → Click publish in WordPress
3. **See changes live** → Automatically appears on `entrylab.io`

**No manual deployments needed for content updates!**

---

## 📞 Support Resources:

- **Deployment Guide**: `HOSTINGER-VPS-DEPLOYMENT.md` (detailed instructions)
- **Hostinger AI Assistant**: Available 24/7 in VPS panel
- **PM2 Docs**: https://pm2.keymetrics.io/docs/usage/quick-start/

---

**Total Setup Time: ~60 minutes** ⏱️
