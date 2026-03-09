#!/bin/bash

# Multi-Chain Setup Script for Adam Protocol
# This script helps set up the multi-chain environment

set -e

echo "🚀 Setting up Multi-Chain Support for Adam Protocol"
echo "=================================================="
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your contract addresses and API keys"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "🎉 Multi-Chain setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your Starknet and Stacks contract addresses"
echo "2. Run 'pnpm dev' to start the development server"
echo "3. Test wallet connections on both Starknet and Stacks"
echo ""
echo "📚 Documentation:"
echo "   - MULTI_CHAIN_GUIDE.md - Architecture and usage guide"
echo "   - MIGRATION_GUIDE.md - Migration from single-chain"
echo ""
echo "🔗 Useful links:"
echo "   - Stacks Connect: https://docs.stacks.co/stacks-connect"
echo "   - Starknet React: https://starknet-react.com"
echo ""
