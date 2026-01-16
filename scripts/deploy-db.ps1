# Database Deployment Script for Tindera (Windows PowerShell)
# Usage: .\scripts\deploy-db.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying database migrations..." -ForegroundColor Cyan

# Check for required environment variables
if (-not $env:SUPABASE_ACCESS_TOKEN) {
    Write-Host "❌ SUPABASE_ACCESS_TOKEN not set" -ForegroundColor Red
    Write-Host "   Get your token from: https://supabase.com/dashboard/account/tokens"
    Write-Host "   Then run: `$env:SUPABASE_ACCESS_TOKEN = 'your_token'"
    exit 1
}

$projectId = if ($env:SUPABASE_PROJECT_ID) { $env:SUPABASE_PROJECT_ID } else { "bwcrsmbmkmoigzwtuhjn" }

Write-Host "📦 Project ID: $projectId" -ForegroundColor Yellow

# Link to the project
Write-Host "🔗 Linking to Supabase project..." -ForegroundColor Cyan
npx supabase link --project-ref $projectId

# Push migrations
Write-Host "📤 Pushing migrations..." -ForegroundColor Cyan
npx supabase db push

Write-Host "✅ Database deployment complete!" -ForegroundColor Green
