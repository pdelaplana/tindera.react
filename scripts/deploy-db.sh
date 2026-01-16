#!/bin/bash
# Database Deployment Script for Tindera
# Usage: ./scripts/deploy-db.sh

set -e

echo "🚀 Deploying database migrations..."

# Check if Supabase CLI is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

# Check for required environment variables
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ SUPABASE_ACCESS_TOKEN not set"
    echo "   Get your token from: https://supabase.com/dashboard/account/tokens"
    echo "   Then run: export SUPABASE_ACCESS_TOKEN=your_token"
    exit 1
fi

if [ -z "$SUPABASE_PROJECT_ID" ]; then
    # Default to the project ID from config
    export SUPABASE_PROJECT_ID="bwcrsmbmkmoigzwtuhjn"
fi

echo "📦 Project ID: $SUPABASE_PROJECT_ID"

# Link to the project (if not already linked)
echo "🔗 Linking to Supabase project..."
npx supabase link --project-ref $SUPABASE_PROJECT_ID

# Push migrations to remote
echo "📤 Pushing migrations..."
npx supabase db push

echo "✅ Database deployment complete!"
