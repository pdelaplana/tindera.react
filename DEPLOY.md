# Deployment Guide: Tindera React

This document outlines the manual and automated deployment processes for the Tindera POS system.

## 1. Prerequisites

Ensure you have the following installed and configured:
- **Node.js**: v20 or higher
- **Supabase CLI**: Accessible via \
px supabase\`n- **Supabase Access Token**: Obtain from [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
- **Netlify Account**: Connected to the repository for CI/CD.

---

## 2. Supabase Deployment (Backend)

### Database Migrations
To push local migrations to the production database:

**Using Bash:**
\\\ash
export SUPABASE_ACCESS_TOKEN=your_token
./scripts/deploy-db.sh
\\\`n
**Using PowerShell:**
\\\powershell
$env:SUPABASE_ACCESS_TOKEN = 'your_token'
.\scripts\deploy-db.ps1
\\\`n
### Edge Functions
Deploy all functions:
\\\ash
npm run functions:deploy
\\\`n
Deploy a specific function:
\\\ash
npx supabase functions deploy <function-name>
\\\`n
**Important Notes:**
- Webhook functions (e.g., \xendit-webhook\) must be deployed with the \--no-verify-jwt\ flag or configured in \supabase/config.toml\.
- Secrets must be set manually via CLI: \
px supabase secrets set KEY=VALUE\.

### Type Generation
Update TypeScript types from the remote schema:
\\\ash
npm run db:types
\\\`n
---

## 3. Netlify Deployment (Frontend)

Netlify is configured via \
etlify.toml\ for automatic deployments on push to \main\.

### Manual Build
To verify the build locally:
\\\ash
npm run build
\\\`n
### Required Environment Variables
Configure these in the Netlify Dashboard (Site Settings > Environment variables):
- \VITE_SUPABASE_URL\`n- \VITE_SUPABASE_ANON_KEY\`n- \VITE_SENTRY_DSN\`n- \APP_URL\ (The base URL of the deployed application)

---

## 4. Pre-Deployment Checklist

Refer to \conductor/workflow.md\ for the full checklist:
- [ ] Run unit tests: \
pm run test.unit\`n- [ ] Run linting/formatting: \
pm run biome:check\`n- [ ] Verify environment variables are set in both Supabase and Netlify.
- [ ] Ensure database migrations are tested locally before pushing.
- [ ] Create a database backup via the Supabase Dashboard.

---

## 5. CI/CD Roadmap

This document serves as the foundation for a future GitHub Actions workflow that will:
1. Run tests and linting on every PR.
2. Automatically deploy Edge Functions on merge to \main\.
3. Trigger Netlify production builds upon successful backend deployment.
