# 🚀 DEPLOYMENT - QUICK START

## TL;DR - Fastest Way to Deploy

### **Option 1: Railway (EASIEST - All-in-One)**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Run the deployment script
cd project
.\deploy.ps1   # Windows
# OR
./deploy.sh    # Mac/Linux

# 3. Choose option 1 (Railway)
# 4. Add environment variables in Railway dashboard:
#    - GOOGLE_API_KEY = your-google-api-key
#    - NODE_ENV = production
```

**✅ Done! Your app is live at: `https://your-project.up.railway.app`**

---

### **Option 2: Vercel (Frontend Only)**

You need TWO deployments:

**A. Deploy ChromaDB First:**
```bash
# Option A1: Railway for ChromaDB
railway init
railway up

# Option A2: Or use ChromaDB Cloud
# Sign up at: https://www.trychroma.com/
```

**B. Deploy Your App:**
```bash
npm install -g vercel
cd project
vercel

# Add environment variables in Vercel dashboard:
# - GOOGLE_API_KEY
# - CHROMA_URL (your ChromaDB URL)
# - NODE_ENV=production

# Deploy to production
vercel --prod
```

---

## 📁 Files Created for You

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel configuration |
| `DEPLOYMENT.md` | Complete deployment guide (all options) |
| `QUICK_DEPLOY.md` | Quick reference |
| `deploy.ps1` | PowerShell deployment script |
| `deploy.sh` | Bash deployment script |

---

## 🎯 Which Platform to Choose?

| Platform | Best For | Setup Time | Cost |
|----------|----------|------------|------|
| **Railway** | Everything in one place | 5 minutes | $5/month |
| **Vercel** | If you love Vercel | 10 minutes | $0-5/month |
| **Render** | Free tier needed | 15 minutes | Free (limited) |

**Recommendation: Use Railway** 🎯

---

## ⚡ Ultra-Quick Railway Deployment

```bash
# 1. Install & login
npm install -g @railway/cli
railway login

# 2. Deploy
cd d:\fetal_plane_detection-DL-project-\project
railway init
railway up

# 3. Set environment variables in dashboard
# Go to: https://railway.app/dashboard
# Add: GOOGLE_API_KEY, NODE_ENV=production

# ✅ DONE!
```

---

## 🔧 What Was Updated for Deployment?

1. **`vectorDB.js`** - Now supports remote ChromaDB connections
2. **`vercel.json`** - Vercel routing configuration
3. **Environment support** - Production-ready env variables

---

## 🆘 Troubleshooting

**Issue: "railway: command not found"**
```bash
npm install -g @railway/cli
```

**Issue: "ChromaDB connection failed"**
- Check CHROMA_URL is correct
- Verify ChromaDB service is running
- Check firewall/security settings

**Issue: "Vercel function timeout"**
- Queries take too long for free tier
- Upgrade to Pro OR use Railway instead

---

## 📞 Support

- **Railway Docs**: https://docs.railway.app/
- **Vercel Docs**: https://vercel.com/docs
- **ChromaDB Docs**: https://docs.trychroma.com/

---

## ✅ Post-Deployment Checklist

- [ ] App is accessible via URL
- [ ] Can upload documents
- [ ] Can run queries
- [ ] Environment variables set
- [ ] Logs show no errors
- [ ] Custom domain configured (optional)

---

**Ready to deploy? Run the script!**

Windows:
```powershell
.\deploy.ps1
```

Mac/Linux:
```bash
chmod +x deploy.sh
./deploy.sh
```

Good luck! 🚀
