#!/bin/bash

# Script for setting up npm install on Linux server
# Run this script on the server: bash server-setup.sh

echo "🔍 Checking project structure..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in current directory"
    echo "📂 Current directory: $(pwd)"
    echo ""
    echo "🔍 Searching for package.json..."
    FOUND=$(find /var/www -name "package.json" -type f 2>/dev/null | head -1)
    
    if [ -n "$FOUND" ]; then
        echo "✅ Found package.json at: $FOUND"
        PROJECT_ROOT=$(dirname "$FOUND")
        echo "📁 Project root: $PROJECT_ROOT"
        echo ""
        echo "🚀 Changing to project root and running npm install..."
        cd "$PROJECT_ROOT"
    else
        echo "❌ package.json not found anywhere in /var/www"
        echo ""
        echo "💡 Solutions:"
        echo "1. Make sure the project files are uploaded to the server"
        echo "2. Check if the project is in a different location"
        echo "3. If you're in /var/www/WhiteShop/web, go to parent directory:"
        echo "   cd /var/www/WhiteShop"
        exit 1
    fi
fi

# Verify we're in the right place
if [ ! -f "package.json" ]; then
    echo "❌ Still cannot find package.json"
    exit 1
fi

echo "✅ Found package.json at: $(pwd)/package.json"
echo ""

# Check if workspaces are configured
if grep -q "workspaces" package.json; then
    echo "✅ Workspaces detected in package.json"
    echo "📦 This is a monorepo - installing from root will link local packages"
else
    echo "⚠️  No workspaces found - this might be a single package"
fi

echo ""
echo "🚀 Running npm install..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ npm install completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Verify installation: npm list @shop/design-tokens"
    echo "2. Start development: npm run dev"
else
    echo ""
    echo "❌ npm install failed"
    exit 1
fi

