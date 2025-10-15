# Railway Setup - Manual Steps (No ChromaDB Cloud)

## 📋 Manual Deployment Steps

### Part 1: Deploy ChromaDB to Railway

1. **Go to Railway Dashboard**
   - URL: https://railway.app/dashboard
   - Login or create account (free tier available)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from Docker Image"

3. **Configure ChromaDB**
   - Docker Image: `chromadb/chroma:latest`
   - Service Name: `chromadb`
   - Click "Deploy"

4. **Generate Public URL for ChromaDB**
   - Click on the ChromaDB service
   - Go to "Settings" tab
   - Under "Networking" section
   - Click "Generate Domain"
   - Copy the URL (e.g., `chromadb-production-xxxx.up.railway.app`)
   - Save this URL - you'll need it!

5. **Add Environment Variables to ChromaDB**
   - In ChromaDB service settings
   - Go to "Variables" tab
   - Add:
     ```
     IS_PERSISTENT=TRUE
     ANONYMIZED_TELEMETRY=FALSE
     ```

### Part 2: Deploy Your App to Railway

1. **Open PowerShell/Terminal in your project folder**
   ```powershell
   cd d:\fetal_plane_detection-DL-project-\project
   ```

2. **Login to Railway**
   ```powershell
   railway login
   ```
   (This will open your browser - login and authorize)

3. **Link to Your Railway Project**
   - Option A: Create new project
     ```powershell
     railway init
     ```
   
   - Option B: Link to existing project
     ```powershell
     railway link
     ```

4. **Deploy Your App**
   ```powershell
   railway up
   ```

5. **Add Environment Variables to Your App**
   - Go to Railway Dashboard
   - Click on your app service
   - Go to "Variables" tab
   - Add these variables:

   ```
   GOOGLE_API_KEY=your_google_api_key_here
   CHROMA_URL=https://chromadb-production-xxxx.up.railway.app
   CHROMA_SSL=true
   NODE_ENV=production
   CHUNK_SIZE=512
   CHUNK_OVERLAP=100
   ```

   **Important:** Replace `chromadb-production-xxxx.up.railway.app` with the URL you copied in Part 1, Step 4!

6. **Generate Domain for Your App**
   - In your app service settings
   - Go to "Settings" tab
   - Under "Networking" section
   - Click "Generate Domain"
   - This is your public URL!

7. **Restart Your App**
   ```powershell
   railway up --service your-app-name
   ```

### Part 3: Verify Deployment

1. **Check ChromaDB is Running**
   - Visit: `https://your-chromadb-url/api/v1/heartbeat`
   - Should return: `{"nanosecond heartbeat":...}`

2. **Check Your App is Running**
   - Visit: `https://your-app-url.up.railway.app`
   - Should show your landing page

3. **Test Upload & Query**
   - Click "Demo" button
   - Upload a document
   - Run a query

### ✅ Done!

Your app is now live with:
- ✅ ChromaDB running on Railway
- ✅ Your Node.js app running on Railway
- ✅ Both connected via HTTPS

---

## 🔧 Troubleshooting

**Issue: "Cannot connect to ChromaDB"**
- Check CHROMA_URL is correct in environment variables
- Verify ChromaDB service is running in Railway dashboard
- Make sure ChromaDB has a public domain generated

**Issue: "Build failed"**
- Check Railway logs in dashboard
- Ensure package.json is correct
- Verify all dependencies are listed

**Issue: "App crashes after deployment"**
- Check logs in Railway dashboard
- Verify GOOGLE_API_KEY is set
- Check CHROMA_URL is accessible

---

## 💰 Cost

- Railway Free Tier: $5 of credits per month (enough for testing)
- After free credits: ~$10-15/month for both services
- No credit card required for free tier!

---

## 📞 Need Help?

- Railway Docs: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Create an issue in your repo
