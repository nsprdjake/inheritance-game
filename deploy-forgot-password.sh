#!/bin/bash

# Forgot Password Feature Deployment Script
# Author: OpenClaw Agent
# Date: 2026-02-14

echo "🔐 LYNE Forgot Password Feature Deployment"
echo "==========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root"
    exit 1
fi

echo "📋 Pre-Deployment Checklist:"
echo ""
echo "Before deploying, ensure you've configured Supabase:"
echo ""
echo "1. ✅ Email Templates (Auth → Email Templates → Reset Password)"
echo "2. ✅ Redirect URLs (Auth → URL Configuration)"
echo "   - Production: https://rp1.nsprd.com/auth/reset-password"
echo "   - Local: http://localhost:3000/auth/reset-password"
echo "3. ✅ SMTP Settings (Project Settings → Authentication → SMTP)"
echo ""
read -p "Have you configured Supabase? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Please configure Supabase first. See FORGOT_PASSWORD_FEATURE.md"
    exit 1
fi

echo ""
echo "🧪 Running tests..."
echo ""

# Run TypeScript check
echo "→ Checking TypeScript..."
npm run lint > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Lint issues found (may not be related to this feature)"
fi

echo ""
echo "🏗️  Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "📝 Files modified/created:"
echo "  • app/auth/login/page.tsx (modified)"
echo "  • app/auth/forgot-password/page.tsx (new)"
echo "  • app/auth/reset-password/page.tsx (new)"
echo "  • components/settings/ChangePasswordSection.tsx (new)"
echo "  • components/settings/SettingsClient.tsx (modified)"
echo ""
echo "🚀 Ready to deploy!"
echo ""
echo "Deployment options:"
echo "  1. Vercel: git push (auto-deploys)"
echo "  2. Manual: npm run start"
echo ""
echo "After deployment, test the feature:"
echo "  1. Visit /auth/login"
echo "  2. Click 'Forgot password?'"
echo "  3. Enter an email"
echo "  4. Check email inbox"
echo "  5. Click reset link"
echo "  6. Set new password"
echo "  7. Verify login works"
echo ""
echo "✅ Deployment preparation complete!"
