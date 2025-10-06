# Hostinger VPS Deployment Guide - EntryLab.io

## Prerequisites
✅ VPS KVM 2 purchased ($9.99/month)  
✅ WordPress running at `admin.entrylab.io`  
✅ Domain `entrylab.io` ready to point to VPS

---

## Step 1: VPS Initial Setup (After Purchase)

### 1.1 Select Node.js Template
When setting up your VPS in Hostinger:
1. Choose **Ubuntu 22.04 or 24.04**
2. Select **Node.js** template (pre-installs Node.js + OpenLiteSpeed)
3. Choose server location: **United Kingdom** (best latency for your audience)

### 1.2 Access Your VPS
Hostinger will provide:
- **IP Address**: (e.g., 123.45.67.89)
- **Root Password**: (check your email)

**Access via SSH:**
```bash
ssh root@YOUR_VPS_IP
# Enter password when prompted
```

---

## Step 2: Prepare VPS Environment

### 2.1 Update System
```bash
apt update && apt upgrade -y
```

### 2.2 Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### 2.3 Create App Directory
```bash
mkdir -p /var/www/entrylab
cd /var/www/entrylab
```

---

## Step 3: Upload Application Files

### Option A: Using FileZilla (Easier)
1. Download FileZilla: https://filezilla-project.org/
2. Connect using:
   - Host: `sftp://YOUR_VPS_IP`
   - Username: `root`
   - Password: (your VPS password)
   - Port: `22`
3. Upload the entire `dist` folder to `/var/www/entrylab/`
4. Upload `package.json` to `/var/www/entrylab/`

### Option B: Using SCP (Command Line)
From your local machine (where this Replit project is):
```bash
scp -r dist package.json root@YOUR_VPS_IP:/var/www/entrylab/
```

---

## Step 4: Install Dependencies on VPS

```bash
cd /var/www/entrylab
npm install --production
```

**This installs only production dependencies** (no dev tools).

---

## Step 5: Configure Environment Variables

Create `.env` file on VPS:
```bash
nano /var/www/entrylab/.env
```

Add these variables:
```
NODE_ENV=production
PORT=3000
FOREX_API_KEY=your_forex_api_key_here
SESSION_SECRET=your_session_secret_here
```

**Press `CTRL+X`, then `Y`, then `ENTER` to save.**

**IMPORTANT:** Get API keys from Replit Secrets:
- FOREX_API_KEY: (Your Finnhub API key)
- SESSION_SECRET: (Your session secret)

---

## Step 6: Configure OpenLiteSpeed

### 6.1 Access OpenLiteSpeed Admin
Open browser: `https://YOUR_VPS_IP:7080`
- Username: `admin`
- Password: (check `/usr/local/lsws/adminpasswd` on VPS)

### 6.2 Create Proxy to Node.js App
1. Go to **Virtual Hosts** → Add new virtual host
2. Name: `entrylab`
3. Document Root: `/var/www/entrylab/dist/public`
4. Go to **Context** → Add **Proxy** context:
   - URI: `/`
   - Web Server Address: `http://localhost:3000`
5. **Graceful Restart** OpenLiteSpeed

---

## Step 7: Start Application with PM2

```bash
cd /var/www/entrylab
pm2 start dist/index.js --name entrylab
pm2 save
pm2 startup
```

**Check if running:**
```bash
pm2 status
```

You should see:
```
┌─────┬──────────┬─────────┬──────┬────────┐
│ id  │ name     │ status  │ cpu  │ memory │
├─────┼──────────┼─────────┼──────┼────────┤
│ 0   │ entrylab │ online  │ 0%   │ 50 MB  │
└─────┴──────────┴─────────┴──────┴────────┘
```

**Test locally on VPS:**
```bash
curl http://localhost:3000
# Should return HTML
```

---

## Step 8: Point Domain to VPS

### 8.1 Update DNS Records
In your domain registrar (or Hostinger DNS):

1. **Update A Record:**
   - Type: `A`
   - Name: `@` (or `entrylab.io`)
   - Value: `YOUR_VPS_IP`
   - TTL: `3600`

2. **Wait for DNS propagation** (5-30 minutes)

### 8.2 Test Domain
```bash
ping entrylab.io
# Should show your VPS IP
```

---

## Step 9: Configure SSL Certificate (HTTPS)

### 9.1 Install Certbot
```bash
apt install certbot python3-certbot-nginx -y
```

### 9.2 Get SSL Certificate
```bash
certbot --nginx -d entrylab.io -d www.entrylab.io
```

Follow prompts:
- Email: your@email.com
- Agree to terms: Yes
- Redirect HTTP to HTTPS: Yes

**Auto-renewal is configured automatically!**

---

## Step 10: Verify Everything Works

### Test Checklist:
- [ ] Visit `https://entrylab.io` → Should show React homepage
- [ ] Check articles load from WordPress
- [ ] Test navigation, archive page
- [ ] Verify Forex ticker updates (wait 60 seconds)
- [ ] Test newsletter subscription
- [ ] Check mobile responsiveness

---

## Maintenance Commands

### View App Logs:
```bash
pm2 logs entrylab
```

### Restart App:
```bash
pm2 restart entrylab
```

### Update App (after changes):
```bash
cd /var/www/entrylab
# Upload new dist folder
pm2 restart entrylab
```

### Monitor Performance:
```bash
pm2 monit
```

---

## Troubleshooting

### App not starting?
```bash
pm2 logs entrylab --lines 50
# Check for errors
```

### Can't access website?
```bash
# Check if app is running
pm2 status

# Check if port 3000 is listening
netstat -tulpn | grep 3000

# Check OpenLiteSpeed status
systemctl status lsws
```

### WordPress data not loading?
```bash
# Test WordPress API from VPS
curl https://admin.entrylab.io/wp-json/wp/v2/posts?per_page=1
```

---

## Security Checklist

- [ ] Change default SSH port (optional but recommended)
- [ ] Set up UFW firewall
- [ ] Regular security updates: `apt update && apt upgrade`
- [ ] Keep Node.js updated: `npm install -g n && n lts`

---

## Need Help?
- Hostinger AI Assistant (24/7 in VPS panel)
- PM2 Docs: https://pm2.keymetrics.io/docs/usage/quick-start/
- OpenLiteSpeed Docs: https://openlitespeed.org/kb/

---

**You're all set! Your React frontend will be live at `entrylab.io` pulling content from `admin.entrylab.io`** 🚀
