# 🚀 Vercel Deployment Guide (with Render ChromaDB)

## ✅ Prerequisites
- ✅ ChromaDB deployed on Render: https://chroma-latest-e2qo.onrender.com
- ✅ GitHub repository: https://github.com/asneem1234/fetal_plane_detection-DL-project-
- ✅ Google Gemini API key

---

## 📋 Step-by-Step Deployment

### **Step 1: Install Vercel CLI**

```powershell
npm install -g vercel
```

### **Step 2: Login to Vercel**

```powershell
vercel login
```

This will open your browser - login with GitHub.

### **Step 3: Navigate to Project**

```powershell
cd d:\fetal_plane_detection-DL-project-\project
```

### **Step 4: Deploy**

```powershell
vercel
```

**Answer the prompts:**
- Set up and deploy? **Y**
- Which scope? **Select your account**
- Link to existing project? **N**
- What's your project's name? **rag-system** (or any name)
- In which directory is your code located? **./** (current directory)

### **Step 5: Add Environment Variables**

After first deployment, add environment variables:

```powershell
vercel env add GOOGLE_API_KEY
# Paste: AIzaSyD1D8LsGpmaUKs8qdnEAkSCma2o3gNaUfo

vercel env add CHROMA_URL
# Paste: https://chroma-latest-e2qo.onrender.com

vercel env add CHROMA_SSL
# Paste: true

vercel env add NODE_ENV
# Paste: production

vercel env add CHUNK_SIZE
# Paste: 512

vercel env add CHUNK_OVERLAP
# Paste: 100
```

**OR** add them via Vercel Dashboard:
1. Go to: https://vercel.com/dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Add all the variables listed above

### **Step 6: Deploy to Production**

```powershell
vercel --prod
```

### **Step 7: Test Your Deployment**

Your app will be live at: `https://your-project-name.vercel.app`

Test these URLs:
- Landing: `https://your-project-name.vercel.app/`
- Demo: `https://your-project-name.vercel.app/index.html`
- Health: `https://your-project-name.vercel.app/api/health`

---

## 🎯 Architecture

Your deployed system:
```
┌─────────────────────────────────────────┐
│  Frontend + Backend (Vercel)            │
│  https://your-app.vercel.app            │
│  - Landing page                         │
│  - Demo interface                       │
│  - API endpoints                        │
└──────────────┬──────────────────────────┘
               │
               │ HTTPS
               │
               ▼
┌─────────────────────────────────────────┐
│  ChromaDB (Render)                      │
│  https://chroma-latest-e2qo.onrender.com│
│  - Vector storage                       │
│  - Document embeddings                  │
└─────────────────────────────────────────┘
```

---

## ⚠️ Important Notes

### **Vercel Limitations:**
- Free tier has 10-second function timeout
- If queries take longer, consider upgrading or using Render for both

### **Render Free Tier:**
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- This is normal and expected

### **Solutions:**
1. Keep services warm with periodic pings
2. Show loading message to users
3. Or upgrade to paid tier ($7/month) for always-on service

---

## 🔧 Troubleshooting

**Issue: "Cannot connect to ChromaDB"**
- Wait 30 seconds and try again (Render spinning up)
- Check CHROMA_URL is correct in Vercel env vars
- Verify ChromaDB service is running on Render

**Issue: "Function timeout"**
- Queries taking too long for Vercel free tier
- Solution: Upgrade to Vercel Pro OR deploy backend on Render too

**Issue: "Build failed"**
- Check all dependencies in package.json
- Verify vercel.json configuration
- Check build logs in Vercel dashboard

---

## 💰 Cost

**Current Setup (Free):**
- Vercel: Free (100GB bandwidth/month)
- Render ChromaDB: Free (with spin-down)
- Google Gemini: Free tier (limited requests)

**Total: $0/month** ✅

**Production Setup (Recommended):**
- Vercel Pro: $20/month
- Render Starter: $7/month (ChromaDB always-on)
- Google Gemini: Pay as you go

**Total: ~$27/month**

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Live demo URL to share
- ✅ Professional deployment
- ✅ Automatic HTTPS
- ✅ CDN for fast loading
- ✅ GitHub integration for auto-deploy

Share your live URL with recruiters! 🚀

---

## 📞 Need Help?

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Your GitHub: https://github.com/asneem1234/fetal_plane_detection-DL-project-
