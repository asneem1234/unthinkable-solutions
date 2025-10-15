# Vercel Deployment Guide for REFRAG RAG System

## 🌐 Deployment Options

### Option 1: Vercel Frontend + External ChromaDB (Recommended)

#### Prerequisites
- Vercel account (free tier available)
- Hosted ChromaDB instance (ChromaDB Cloud, Railway, or Render)
- GitHub account

#### Step 1: Set Up ChromaDB Hosting

**Option A: ChromaDB Cloud (Easiest)**
1. Go to https://www.trychroma.com/
2. Sign up and create a collection
3. Note your API endpoint and token

**Option B: Railway (Free Tier)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init

# Deploy ChromaDB
railway up
```

**Option C: Render (Free Tier)**
1. Create account at https://render.com/
2. Create new "Web Service"
3. Use Docker image: `chromadb/chroma:latest`
4. Set port: 8000
5. Deploy

#### Step 2: Update Environment Variables

Create `.env.production` file:
```env
# ChromaDB Configuration
CHROMA_HOST=your-chromadb-host.railway.app
CHROMA_PORT=443
CHROMA_SSL=true

# Or for ChromaDB Cloud
CHROMA_URL=https://api.trychroma.com
CHROMA_API_KEY=your-api-key

# Google Gemini
GOOGLE_API_KEY=your-google-api-key

# Other configs
NODE_ENV=production
PORT=3000
CHUNK_SIZE=512
CHUNK_OVERLAP=100
```

#### Step 3: Modify vectorDB.js for Remote ChromaDB

Update `utils/vectorDB.js` to support remote connection:
```javascript
// Update the initialization
async init() {
  try {
    const chromaUrl = process.env.CHROMA_URL || 
                     `${process.env.CHROMA_SSL ? 'https' : 'http'}://${process.env.CHROMA_HOST}:${process.env.CHROMA_PORT}`;
    
    this.client = new ChromaClient({
      path: chromaUrl,
      auth: process.env.CHROMA_API_KEY ? {
        provider: "token",
        credentials: process.env.CHROMA_API_KEY
      } : undefined
    });
    
    // Rest of initialization...
  } catch (error) {
    console.error('ChromaDB initialization error:', error);
    throw error;
  }
}
```

#### Step 4: Deploy to Vercel

**Via Vercel CLI:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd project
vercel

# Add environment variables
vercel env add GOOGLE_API_KEY
vercel env add CHROMA_URL
vercel env add CHROMA_API_KEY

# Deploy to production
vercel --prod
```

**Via GitHub:**
1. Push code to GitHub:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

2. Import to Vercel:
   - Go to https://vercel.com/
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - Framework Preset: `Other`
     - Root Directory: `project`
     - Build Command: `npm install`
     - Output Directory: Leave empty
   - Add Environment Variables:
     - `GOOGLE_API_KEY`
     - `CHROMA_URL`
     - `CHROMA_API_KEY`
     - `NODE_ENV=production`
   - Deploy!

#### Step 5: Post-Deployment

1. Your app will be live at `https://your-project.vercel.app`
2. Test document upload and queries
3. Monitor logs in Vercel dashboard

---

### Option 2: Full Stack Deployment (Railway/Render)

For a simpler all-in-one deployment:

#### Railway (Recommended for Full Stack)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd project
railway init

# Create services
railway service create chromadb
railway service create webapp

# Deploy ChromaDB
railway up --service chromadb

# Link services and deploy app
railway link
railway up --service webapp

# Add environment variables
railway variables set GOOGLE_API_KEY=your-key
railway variables set CHROMA_HOST=chromadb.railway.internal
railway variables set CHROMA_PORT=8000
```

#### Render

1. **Deploy ChromaDB:**
   - New Web Service
   - Docker image: `chromadb/chroma:latest`
   - Port: 8000

2. **Deploy Node.js App:**
   - New Web Service
   - Connect GitHub repo
   - Build command: `cd project && npm install`
   - Start command: `cd project && node server.js`
   - Add environment variables

---

## 🔧 Important Modifications for Production

### 1. Update CORS Settings (server.js)
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.vercel.app' 
    : '*',
  credentials: true
}));
```

### 2. Update API Base URL (public/js/app.js)
```javascript
const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://your-domain.vercel.app'
  : 'http://localhost:3000';
```

### 3. Add Error Handling for ChromaDB Connection
```javascript
// In utils/vectorDB.js
async init() {
  let retries = 3;
  while (retries > 0) {
    try {
      // Connection logic
      return;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
```

---

## 📝 Deployment Checklist

- [ ] ChromaDB hosted and accessible
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] API endpoints tested
- [ ] File upload size limits configured
- [ ] Error handling added
- [ ] GitHub repository ready
- [ ] Vercel/Railway account created
- [ ] Domain configured (optional)
- [ ] SSL certificate verified

---

## 🎯 Recommended: Railway Full Stack

**Why Railway?**
- ✅ Supports both Node.js and ChromaDB
- ✅ Free tier available ($5 credit/month)
- ✅ Persistent storage
- ✅ Easy environment variable management
- ✅ Built-in logging and monitoring
- ✅ Automatic HTTPS

**Quick Railway Deployment:**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Then add environment variables in Railway dashboard.

---

## 🆘 Troubleshooting

**Issue: ChromaDB connection timeout**
- Check ChromaDB service is running
- Verify firewall/security group settings
- Ensure correct URL and port

**Issue: File uploads failing**
- Check upload size limits
- Verify disk space on server
- Check file permissions

**Issue: Vercel function timeout**
- Queries might exceed 10s limit on free tier
- Consider upgrading to Pro plan
- Or use Railway/Render instead

---

## 💡 Cost Estimate

**Free Tier (Hobby Project):**
- Vercel: Free (100GB bandwidth/month)
- ChromaDB on Railway: $5/month (after free credit)
- Google Gemini: Free tier available

**Total: ~$5/month**

**Production (Scalable):**
- Vercel Pro: $20/month
- ChromaDB Cloud: ~$50/month
- Google Gemini: Pay as you go

---

## 📚 Next Steps

1. Choose deployment platform
2. Set up ChromaDB hosting
3. Configure environment variables
4. Deploy application
5. Test thoroughly
6. Monitor logs and performance

Good luck with your deployment! 🚀
