# REFRAG RAG System - Deployment Script (PowerShell)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  REFRAG RAG System - Deployment Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayInstalled) {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
    Write-Host "✅ Railway CLI installed" -ForegroundColor Green
} else {
    Write-Host "✅ Railway CLI already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Deployment Options:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. Deploy to Railway (App Only - Use ChromaDB Cloud)"
Write-Host "2. Deploy to Vercel (Frontend + External ChromaDB)"
Write-Host "3. Check deployment status"
Write-Host "4. Test Docker Compose locally"
Write-Host "5. Exit"
Write-Host ""
Write-Host "💡 TIP: For Railway, use ChromaDB Cloud (easiest)" -ForegroundColor Yellow
Write-Host "   Sign up at: https://www.trychroma.com/" -ForegroundColor Yellow
Write-Host ""

$choice = Read-Host "Choose option (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Deploying to Railway..." -ForegroundColor Green
        Write-Host ""
        Write-Host "Step 1: Login to Railway" -ForegroundColor Yellow
        railway login
        
        Write-Host ""
        Write-Host "Step 2: Initialize Railway project" -ForegroundColor Yellow
        railway init
        
        Write-Host ""
        Write-Host "Step 3: Deploying application..." -ForegroundColor Yellow
        railway up
        
        Write-Host ""
        Write-Host "✅ Deployment complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  Don't forget to set environment variables in Railway dashboard:" -ForegroundColor Yellow
        Write-Host "   - GOOGLE_API_KEY"
        Write-Host "   - NODE_ENV=production"
        Write-Host ""
        Write-Host "🌐 Your app will be available at: https://your-project.up.railway.app" -ForegroundColor Cyan
    }
    
    "2" {
        Write-Host ""
        Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green
        Write-Host ""
        
        # Check if Vercel CLI is installed
        $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
        if (-not $vercelInstalled) {
            Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
        }
        
        Write-Host "Step 1: Login to Vercel" -ForegroundColor Yellow
        vercel login
        
        Write-Host ""
        Write-Host "Step 2: Deploying..." -ForegroundColor Yellow
        vercel
        
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: You need to deploy ChromaDB separately!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Options for ChromaDB:"
        Write-Host "  1. Railway: railway init && railway up"
        Write-Host "  2. Render: https://render.com/"
        Write-Host "  3. ChromaDB Cloud: https://www.trychroma.com/"
        Write-Host ""
        Write-Host "After deploying ChromaDB, add these environment variables in Vercel:"
        Write-Host "  - GOOGLE_API_KEY"
        Write-Host "  - CHROMA_URL (your ChromaDB URL)"
        Write-Host "  - CHROMA_API_KEY (if needed)"
        Write-Host "  - NODE_ENV=production"
        Write-Host ""
        Write-Host "Then deploy to production:"
        Write-Host "  vercel --prod"
    }
    
    "3" {
        Write-Host ""
        Write-Host "📊 Checking deployment status..." -ForegroundColor Cyan
        Write-Host ""
        
        $railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
        if ($railwayInstalled) {
            Write-Host "Railway projects:" -ForegroundColor Yellow
            railway status
        }
        
        $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
        if ($vercelInstalled) {
            Write-Host ""
            Write-Host "Vercel deployments:" -ForegroundColor Yellow
            vercel ls
        }
    }
    
    "4" {
        Write-Host ""
        Write-Host "🐳 Testing Docker Compose locally..." -ForegroundColor Green
        Write-Host ""
        Write-Host "This will start both ChromaDB and your app locally" -ForegroundColor Yellow
        Write-Host ""
        
        # Check if Docker is installed
        $dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
        if (-not $dockerInstalled) {
            Write-Host "❌ Docker not installed. Please install Docker Desktop first." -ForegroundColor Red
            Write-Host "Download from: https://www.docker.com/products/docker-desktop"
            exit 1
        }
        
        Write-Host "Step 1: Building and starting containers..." -ForegroundColor Yellow
        docker-compose up -d --build
        
        Write-Host ""
        Write-Host "✅ Services started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "ChromaDB: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "Your App: http://localhost:3000" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To stop: docker-compose down" -ForegroundColor Yellow
    }
    
    "5" {
        Write-Host "Goodbye! 👋" -ForegroundColor Cyan
        exit 0
    }
    
    default {
        Write-Host "❌ Invalid option" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Deployment Tips:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Test your deployment thoroughly"
Write-Host "✅ Monitor logs for any errors"
Write-Host "✅ Set up custom domain (optional)"
Write-Host "✅ Enable HTTPS (automatic on most platforms)"
Write-Host ""
Write-Host "Need help? Check:"
Write-Host "  📖 DEPLOYMENT.md - Full deployment guide"
Write-Host "  📖 QUICK_DEPLOY.md - Quick reference"
Write-Host ""
