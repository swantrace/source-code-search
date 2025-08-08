#!/bin/bash

# Quick install script for source-code-search CLI
# This script installs the tool from GitHub with minimal user interaction

set -e

echo "🔍 Installing Source Code Search CLI from GitHub..."

# Check if Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Error: Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)

if [ "$MAJOR_VERSION" -lt 16 ]; then
    echo "❌ Error: Node.js 16+ is required. You have version $NODE_VERSION"
    echo "Please upgrade Node.js from https://nodejs.org/"
    exit 1
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "📥 Downloading source code..."
# Clone or download the repository
if [ -n "$1" ]; then
    # If GitHub URL is provided as argument
    git clone "$1" source-code-search
else
    echo "Usage: $0 https://github.com/swantrace/source-code-search.git"
    echo "Example: $0 https://github.com/username/source-code-search.git"
    exit 1
fi

cd source-code-search

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building project..."
npm run build

echo "🌍 Installing globally..."
npm link

# Cleanup
cd /
rm -rf "$TEMP_DIR"

echo "✅ Installation complete!"
echo ""
echo "You can now use:"
echo "  codesearch 'pattern' [directory]"
echo "  cs 'pattern' [directory]"
echo ""
echo "Example:"
echo "  cs 'function' ./src"
echo "  codesearch --help"
echo ""
echo "To uninstall: npm unlink -g source-code-search"
