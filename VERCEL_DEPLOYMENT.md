# Vercel Deployment Guide

This guide will help you deploy the Knowledge-Base RAG Search Engine to Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): Install globally
   ```bash
   npm install -g vercel
   ```
3. **GitHub Repository**: Your code should be pushed to GitHub (already done ✓)
4. **API Keys Ready**: 
   - Qdrant API key (use Qdrant Cloud for production)
   - Google Gemini API key

## 🚀 Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository: `asneem1234/unthinkable-solutions`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: Leave empty or use `npm install`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   
   ```
   QDRANT_URL=https://your-cluster.qdrant.io:6333
   QDRANT_API_KEY=your_qdrant_api_key_here
   QDRANT_COLLECTION=knowledge_base
   GEMINI_API_KEY=your_gemini_api_key_here
   CHUNK_SIZE=1000
   CHUNK_OVERLAP=200
   PORT=3000
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (2-3 minutes)
   - Your app will be live at `https://your-app.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Directory**
   ```bash
   cd c:\Users\admin\OneDrive\Desktop\project
   vercel
   ```

4. **Follow CLI Prompts**
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N`
   - What's your project's name? `unthinkable-solutions`
   - In which directory is your code located? `./`

5. **Add Environment Variables**
   ```bash
   vercel env add QDRANT_URL
   vercel env add QDRANT_API_KEY
   vercel env add QDRANT_COLLECTION
   vercel env add GEMINI_API_KEY
   vercel env add CHUNK_SIZE
   vercel env add CHUNK_OVERLAP
   ```

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## ⚙️ Important Configuration Notes

### 1. Qdrant Setup for Production

**Use Qdrant Cloud** (Vercel doesn't support Docker):
- Sign up at [cloud.qdrant.io](https://cloud.qdrant.io/)
- Create a cluster
- Get your cluster URL and API key
- Use the cluster URL in `QDRANT_URL` environment variable

### 2. File Upload Considerations

Vercel has limitations for serverless functions:
- **Max file size**: 4.5MB for requests
- **Execution timeout**: 10 seconds (Hobby), 60 seconds (Pro)
- **Read-only filesystem** except `/tmp` directory

**Recommended Solutions**:
- Use external file storage (AWS S3, Cloudinary, etc.)
- Or modify the upload service to use `/tmp` directory
- Consider using Vercel Pro for larger timeouts

### 3. Serverless Function Optimization

The current setup might need adjustments:
- Move heavy computations to background jobs
- Use Vercel Edge Functions for faster responses
- Consider chunking large file processing

### 4. Environment Variables

Ensure all sensitive data is stored in Vercel's environment variables:
- Never commit `.env` file
- Add all variables in Vercel dashboard
- Variables are encrypted and secured

## 🔧 Vercel Configuration File

The `vercel.json` file is already configured:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server.js"
    },
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

## 🎯 Post-Deployment Steps

1. **Test the Deployment**
   - Visit your Vercel URL
   - Try uploading a small document
   - Test search functionality
   - Check console for errors

2. **Set Custom Domain** (Optional)
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS records

3. **Monitor Performance**
   - Check Vercel Analytics
   - Monitor function execution times
   - Review error logs

4. **Enable Auto-Deploy**
   - Vercel automatically deploys on git push
   - Main branch → Production
   - Other branches → Preview deployments

## 🐛 Common Issues & Solutions

### Issue 1: "Module not found" errors
**Solution**: Ensure all dependencies are in `package.json` dependencies (not devDependencies)

### Issue 2: Timeout errors on file upload
**Solution**: 
- Upgrade to Vercel Pro for 60s timeout
- Or use external file processing service

### Issue 3: Qdrant connection fails
**Solution**: 
- Verify Qdrant Cloud URL and API key
- Check if cluster is running
- Ensure firewall allows Vercel IPs

### Issue 4: Environment variables not working
**Solution**:
- Redeploy after adding env variables
- Check variable names (case-sensitive)
- Ensure no trailing spaces

## 📊 Vercel Limits (Hobby Plan)

- **Bandwidth**: 100GB/month
- **Serverless Function Execution**: 100GB-Hours
- **Builds**: Unlimited
- **Team members**: 1

For production use, consider **Vercel Pro**:
- Longer execution times
- More bandwidth
- Better performance

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Qdrant Cloud](https://cloud.qdrant.io/)
- [Environment Variables Guide](https://vercel.com/docs/environment-variables)

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review function logs in Vercel dashboard
3. Test locally first with `vercel dev`
4. Contact Vercel support

---

**Ready to deploy? Let's go! 🚀**
