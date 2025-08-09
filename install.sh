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

# Check if Git is installed
if ! command -v git >/dev/null 2>&1; then
    echo "❌ Error: Git is required but not installed."
    echo "Please install Git or use: npm install -g source-code-search"
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
# Clone the repository (use provided URL or default)
REPO_URL="${1:-https://github.com/swantrace/source-code-search.git}"
echo "Cloning from: $REPO_URL"

if ! git clone "$REPO_URL" source-code-search; then
    echo "❌ Error: Failed to clone repository"
    echo "Please check your internet connection or try: npm install -g source-code-search"
    exit 1
fi

cd source-code-search

echo "📦 Installing dependencies..."
if ! npm install; then
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

echo "🔨 Building project..."
if ! npm run build; then
    echo "❌ Error: Failed to build project"
    exit 1
fi

echo "🌍 Installing globally..."
if ! npm link; then
    echo "❌ Error: Failed to link globally"
    echo "You may need to run with sudo or check npm permissions"
    exit 1
fi

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
