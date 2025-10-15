# REFRAG RAG System - Setup Script (Windows)
# This script helps you set up the project quickly

Write-Host "🚀 REFRAG RAG System - Setup Script" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "📦 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js v18 or higher." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check Python installation
Write-Host "🐍 Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ $pythonVersion found" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Python is not installed. Please install Python 3.8 or higher." -ForegroundColor Red
    Write-Host "   Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Install Node.js dependencies
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Node.js dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js dependencies installed" -ForegroundColor Green
Write-Host ""

# Install ChromaDB
Write-Host "📊 Installing ChromaDB..." -ForegroundColor Yellow
python -m pip install chromadb --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Failed to install ChromaDB automatically" -ForegroundColor Yellow
    Write-Host "   Please run manually: python -m pip install chromadb" -ForegroundColor Yellow
} else {
    Write-Host "✓ ChromaDB installed" -ForegroundColor Green
}
Write-Host ""

# Create .env file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "⚙️  Creating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit .env and add your Gemini API key!" -ForegroundColor Yellow
    Write-Host "   Get your API key from: https://makersuite.google.com/app/apikey" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
    Write-Host ""
}

# Create uploads directory
if (-not (Test-Path uploads)) {
    New-Item -ItemType Directory -Path uploads | Out-Null
    Write-Host "✓ Created uploads directory" -ForegroundColor Green
} else {
    Write-Host "✓ uploads directory exists" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Edit .env file and add your Gemini API key:" -ForegroundColor White
Write-Host "   GEMINI_API_KEY=your_actual_api_key_here" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Start ChromaDB server (in a new terminal):" -ForegroundColor White
Write-Host "   chroma run --host localhost --port 8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Start the application:" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Open your browser:" -ForegroundColor White
Write-Host "   http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 For more information, see README.md" -ForegroundColor Yellow
Write-Host ""
