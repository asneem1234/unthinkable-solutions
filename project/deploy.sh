#!/bin/bash

# REFRAG RAG System - Deployment Script

echo "=========================================="
echo "  REFRAG RAG System - Deployment Setup"
echo "=========================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null
then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
else
    echo "✅ Railway CLI already installed"
fi

echo ""
echo "=========================================="
echo "  Deployment Options:"
echo "=========================================="
echo "1. Deploy to Railway (Full Stack - Recommended)"
echo "2. Deploy to Vercel (Frontend + External ChromaDB)"
echo "3. Check deployment status"
echo "4. Exit"
echo ""

read -p "Choose option (1-4): " choice

case $choice in
  1)
    echo ""
    echo "🚀 Deploying to Railway..."
    echo ""
    echo "Step 1: Login to Railway"
    railway login
    
    echo ""
    echo "Step 2: Initialize Railway project"
    railway init
    
    echo ""
    echo "Step 3: Deploying application..."
    railway up
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "⚠️  Don't forget to set environment variables in Railway dashboard:"
    echo "   - GOOGLE_API_KEY"
    echo "   - NODE_ENV=production"
    echo ""
    echo "🌐 Your app will be available at: https://your-project.up.railway.app"
    ;;
    
  2)
    echo ""
    echo "🚀 Deploying to Vercel..."
    echo ""
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null
    then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    echo "Step 1: Login to Vercel"
    vercel login
    
    echo ""
    echo "Step 2: Deploying..."
    vercel
    
    echo ""
    echo "⚠️  IMPORTANT: You need to deploy ChromaDB separately!"
    echo ""
    echo "Options for ChromaDB:"
    echo "  1. Railway: railway init && railway up"
    echo "  2. Render: https://render.com/"
    echo "  3. ChromaDB Cloud: https://www.trychroma.com/"
    echo ""
    echo "After deploying ChromaDB, add these environment variables in Vercel:"
    echo "  - GOOGLE_API_KEY"
    echo "  - CHROMA_URL (your ChromaDB URL)"
    echo "  - CHROMA_API_KEY (if needed)"
    echo "  - NODE_ENV=production"
    echo ""
    echo "Then deploy to production:"
    echo "  vercel --prod"
    ;;
    
  3)
    echo ""
    echo "📊 Checking deployment status..."
    echo ""
    
    if command -v railway &> /dev/null; then
        echo "Railway projects:"
        railway status
    fi
    
    if command -v vercel &> /dev/null; then
        echo ""
        echo "Vercel deployments:"
        vercel ls
    fi
    ;;
    
  4)
    echo "Goodbye! 👋"
    exit 0
    ;;
    
  *)
    echo "❌ Invalid option"
    exit 1
    ;;
esac

echo ""
echo "=========================================="
echo "  Deployment Tips:"
echo "=========================================="
echo "✅ Test your deployment thoroughly"
echo "✅ Monitor logs for any errors"
echo "✅ Set up custom domain (optional)"
echo "✅ Enable HTTPS (automatic on most platforms)"
echo ""
echo "Need help? Check:"
echo "  📖 DEPLOYMENT.md - Full deployment guide"
echo "  📖 QUICK_DEPLOY.md - Quick reference"
echo ""
