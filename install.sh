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

echo "📦 Creating package..."
if ! npm pack; then
    echo "❌ Error: Failed to create package"
    exit 1
fi

echo "🌍 Installing globally..."
PACKAGE_FILE=$(ls source-code-search-*.tgz | head -n1)
if ! npm install -g "$PACKAGE_FILE"; then
    echo "❌ Error: Failed to install globally"
    echo "You may need to run with sudo or check npm permissions"
    exit 1
fi

# Cleanup
cd /
rm -rf "$TEMP_DIR"

echo "✅ Installation complete!"

# Check if binaries are accessible
NPM_BIN_PATH=$(npm config get prefix)/bin
if ! echo "$PATH" | grep -q "$NPM_BIN_PATH"; then
    echo ""
    echo "⚠️  WARNING: npm global bin directory is not in your PATH"
    echo "   Add this to your shell configuration (.bashrc, .zshrc, etc.):"
    echo "   export PATH=\"$NPM_BIN_PATH:\$PATH\""
    echo ""
    echo "   Or run commands with full path:"
    echo "   $NPM_BIN_PATH/codesearch 'pattern' [directory]"
    echo "   $NPM_BIN_PATH/cs 'pattern' [directory]"
else
    echo ""
    echo "You can now use:"
    echo "  codesearch 'pattern' [directory]"
    echo "  cs 'pattern' [directory]"
fi

echo ""
echo "Example:"
echo "  cs 'function' ./src"
echo "  codesearch --help"
echo ""
echo "To uninstall: npm uninstall -g source-code-search"
