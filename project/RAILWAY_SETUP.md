# 🚂 Railway Deployment Guide - Simplified

## The Problem with ChromaDB on Railway

Railway doesn't have a built-in ChromaDB service. You have **3 options**:

---

## ✅ **OPTION 1: Use ChromaDB Cloud (EASIEST)**

**This is the simplest solution!**

### Steps:

1. **Sign up for ChromaDB Cloud** (Free tier available)
   - Go to: https://www.trychroma.com/
   - Create an account
   - Create a new collection
   - Get your API endpoint and token

2. **Deploy your app to Railway:**
   ```powershell
   cd d:\fetal_plane_detection-DL-project-\project
   
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize
   railway init
   
   # Deploy
   railway up
   ```

3. **Add Environment Variables in Railway:**
   - Go to: https://railway.app/dashboard
   - Click your project
   - Go to "Variables" tab
   - Add:
     ```
     GOOGLE_API_KEY=your-google-api-key
     CHROMA_URL=https://api.trychroma.com
     CHROMA_API_KEY=your-chromadb-api-key
     CHROMA_SSL=true
     NODE_ENV=production
     ```

4. **Redeploy:**
   ```powershell
   railway up
   ```

**✅ DONE! Your app is live!**

---

## ✅ **OPTION 2: Deploy ChromaDB in Separate Railway Service**

Run ChromaDB as a Docker container in Railway.

### Steps:

1. **Deploy ChromaDB Service:**
   - Go to Railway dashboard: https://railway.app/dashboard
   - Click "New Project"
   - Select "Empty Project"
   - Click "New Service" → "Docker Image"
   - Image: `chromadb/chroma:latest`
   - Port: `8000`
   - Name it: "chromadb"

2. **Deploy Your App:**
   ```powershell
   cd d:\fetal_plane_detection-DL-project-\project
   railway init
   railway up
   ```

3. **Link the Services:**
   - In Railway dashboard, get the ChromaDB internal URL
   - It will be something like: `chromadb.railway.internal:8000`
   - Add environment variables to your app:
     ```
     GOOGLE_API_KEY=your-google-api-key
     CHROMA_HOST=chromadb.railway.internal
     CHROMA_PORT=8000
     CHROMA_SSL=false
     NODE_ENV=production
     ```

**✅ DONE!**

---

## ✅ **OPTION 3: All-in-One with Docker Compose (Advanced)**

Use Railway's support for Docker Compose to run both services.

### Steps:

1. **Create `docker-compose.yml`** in your project folder:
   ```yaml
   version: '3.8'
   
   services:
     chromadb:
       image: chromadb/chroma:latest
       ports:
         - "8000:8000"
       volumes:
         - chroma_data:/chroma/chroma
       environment:
         - IS_PERSISTENT=TRUE
     
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - CHROMA_HOST=chromadb
         - CHROMA_PORT=8000
         - NODE_ENV=production
       depends_on:
         - chromadb
   
   volumes:
     chroma_data:
   ```

2. **Create `Dockerfile`:**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm install --production
   
   COPY . .
   
   EXPOSE 3000
   
   CMD ["node", "server.js"]
   ```

3. **Deploy to Railway:**
   ```powershell
   railway init
   railway up
   ```

---

## 🎯 **RECOMMENDATION**

**Use Option 1 (ChromaDB Cloud)** if:
- ✅ You want the simplest setup
- ✅ You don't want to manage infrastructure
- ✅ You're okay with ~$20/month for production (free tier available)

**Use Option 2 (Separate Services)** if:
- ✅ You want everything on Railway
- ✅ You're comfortable with Docker
- ✅ Cost: ~$10-15/month

---

## 📋 Quick Start (Option 1 - ChromaDB Cloud)

```powershell
# 1. Sign up at ChromaDB Cloud
# Go to: https://www.trychroma.com/

# 2. Deploy to Railway
cd d:\fetal_plane_detection-DL-project-\project
npm install -g @railway/cli
railway login
railway init
railway up

# 3. Add environment variables in Railway dashboard:
#    - GOOGLE_API_KEY
#    - CHROMA_URL (from ChromaDB Cloud)
#    - CHROMA_API_KEY (from ChromaDB Cloud)
#    - CHROMA_SSL=true
#    - NODE_ENV=production

# ✅ Done!
```

---

## 🆘 Troubleshooting

**Issue: ChromaDB connection failed**
- Check CHROMA_URL is correct
- Verify CHROMA_API_KEY is set
- Ensure ChromaDB service is running

**Issue: Railway build failed**
- Check logs in Railway dashboard
- Verify all dependencies in package.json
- Ensure Node.js version is compatible

---

## 💰 Cost Estimate

| Option | Cost |
|--------|------|
| Option 1 (ChromaDB Cloud) | Free tier, then ~$20/month |
| Option 2 (Railway Docker) | ~$10-15/month |
| Option 3 (Docker Compose) | ~$15-20/month |

---

**Need help?** Check Railway docs: https://docs.railway.app/
