#!/bin/bash

# Frontend Setup Script
# Quick setup for Memory Care Companion frontend

echo "🚀 Memory Care Companion - Frontend Setup"
echo "=========================================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    echo ""
    echo "Please install Node.js via Homebrew:"
    echo "  brew install node"
    echo ""
    exit 1
fi

# Check npm version
NPM_VERSION=$(npm --version)
echo "✅ npm version: $NPM_VERSION"

# Check Node.js version
NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in frontend directory"
    echo "Please run this script from: windsurf-project-3/frontend/"
    exit 1
fi

echo "📦 Installing dependencies..."
echo "This may take 2-3 minutes..."
echo ""

npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "To start the development server:"
    echo "  npm run dev"
    echo ""
    echo "Then visit:"
    echo "  - Home: http://localhost:3000"
    echo "  - Elder Interface (MVP): http://localhost:3000/elder"
    echo "  - Patient Interface: http://localhost:3000/patient"
    echo "  - Caregiver Dashboard: http://localhost:3000/caregiver"
    echo ""
else
    echo ""
    echo "❌ Installation failed"
    echo ""
    echo "Try manually:"
    echo "  npm install"
    echo ""
    exit 1
fi
