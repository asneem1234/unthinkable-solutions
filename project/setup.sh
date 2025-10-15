#!/bin/bash

# REFRAG RAG System - Setup Script
# This script helps you set up the project quickly

echo "🚀 REFRAG RAG System - Setup Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Node.js installation
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION found"
echo ""

# Check Python installation
echo "🐍 Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "❌ Python is not installed. Please install Python 3.8 or higher."
        echo "   Download from: https://www.python.org/downloads/"
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

PYTHON_VERSION=$($PYTHON_CMD --version)
echo "✓ $PYTHON_VERSION found"
echo ""

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Node.js dependencies"
    exit 1
fi
echo "✓ Node.js dependencies installed"
echo ""

# Install ChromaDB
echo "📊 Installing ChromaDB..."
$PYTHON_CMD -m pip install chromadb --quiet
if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Failed to install ChromaDB automatically"
    echo "   Please run manually: $PYTHON_CMD -m pip install chromadb"
else
    echo "✓ ChromaDB installed"
fi
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your Gemini API key!"
    echo "   Get your API key from: https://makersuite.google.com/app/apikey"
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

# Create uploads directory
if [ ! -d uploads ]; then
    mkdir uploads
    echo "✓ Created uploads directory"
else
    echo "✓ uploads directory exists"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Edit .env file and add your Gemini API key:"
echo "   GEMINI_API_KEY=your_actual_api_key_here"
echo ""
echo "2. Start ChromaDB server (in a new terminal):"
echo "   chroma run --host localhost --port 8000"
echo ""
echo "3. Start the application:"
echo "   npm start"
echo ""
echo "4. Open your browser:"
echo "   http://localhost:3000"
echo ""
echo "📖 For more information, see README.md"
echo ""
