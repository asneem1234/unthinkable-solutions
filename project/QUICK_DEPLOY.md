# Quick Deployment Guide

## 🚀 **RECOMMENDED: Deploy on Railway (Easiest Full-Stack Solution)**

Railway supports both your Node.js app AND ChromaDB together!

### Step-by-Step Railway Deployment:

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Navigate to your project
cd d:\fetal_plane_detection-DL-project-\project

# 4. Initialize Railway project
railway init

# 5. Deploy!
railway up
```

### Then in Railway Dashboard:
1. Go to https://railway.app/dashboard
2. Click your project
3. Add **Environment Variables**:
   - `GOOGLE_API_KEY` = your-google-api-key
   - `NODE_ENV` = production
   - `CHROMA_HOST` = localhost
   - `CHROMA_PORT` = 8000
4. Your app will be live at: `https://your-project.up.railway.app`

---

## 🎯 **Alternative: Vercel (Frontend Only)**

If you want to use Vercel, you need to deploy ChromaDB separately.

### Option A: ChromaDB on Railway + Frontend on Vercel

**1. Deploy ChromaDB on Railway:**
```bash
railway init
railway add
# Select "Database" > "ChromaDB"
```

**2. Deploy App on Vercel:**
```bash
cd project
vercel

# Add environment variables:
vercel env add GOOGLE_API_KEY
vercel env add CHROMA_URL
vercel env add NODE_ENV production

vercel --prod
```

---

## 📋 Files Created for Deployment:

✅ **`vercel.json`** - Vercel configuration
✅ **`DEPLOYMENT.md`** - Complete deployment guide
✅ **`vectorDB.js`** - Updated for remote ChromaDB

---

## 💡 Cost Comparison:

| Platform | ChromaDB | App | Total |
|----------|----------|-----|-------|
| **Railway** | ✅ Included | ✅ Included | **$5/month** (after free credits) |
| **Vercel + Railway** | $5/month | Free | **$5/month** |
| **Render** | Free tier | Free tier | **$0/month** (limited) |

---

## 🆘 Need Help?

1. **Railway Issues**: Check https://docs.railway.app/
2. **Vercel Issues**: Check https://vercel.com/docs
3. **ChromaDB**: Check https://docs.trychroma.com/

---

**Recommendation**: Use **Railway** for the easiest deployment! 🎯
