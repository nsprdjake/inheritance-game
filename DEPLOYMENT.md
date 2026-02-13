# Deployment Guide

## Pre-Deployment Checklist

- [x] Git repository initialized
- [x] Environment variables documented
- [x] Database migration ready
- [x] README complete
- [ ] Supabase project created
- [ ] Database migration run
- [ ] Environment variables set
- [ ] Production deployment

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and project name
4. Set a strong database password
5. Select region closest to your users
6. Wait for project to be ready (~2 minutes)

### 2. Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/20260212_initial_schema.sql`
4. Paste into the editor
5. Click **Run** or press `Cmd/Ctrl + Enter`
6. Verify tables were created:
   - Go to **Table Editor**
   - You should see: families, users, kids, transactions, family_settings

### 3. Get API Credentials

1. In Supabase dashboard, go to **Settings > API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbG...` (long string)
3. Save these for deployment

### 4. Test RLS Policies (Optional but Recommended)

1. Create a test user via the Auth UI
2. Try inserting data - should work only with proper permissions
3. Verify users can't access other families' data

## Vercel Deployment

### Option 1: Via Vercel Dashboard

1. Push your code to GitHub:
```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click **Add New Project**
4. Import your GitHub repository
5. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon key
6. Click **Deploy**
7. Wait ~2 minutes for build and deployment

### Option 2: Via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
cd inheritance-game
vercel
```

4. Follow prompts to:
   - Link to existing project or create new one
   - Set environment variables when prompted
   - Deploy to production

## Post-Deployment

### 1. Test the Application

1. Visit your deployed URL
2. Sign up for a new account
3. Complete the onboarding flow
4. Test admin dashboard features:
   - Award points to kids
   - View transactions
   - Access settings
5. Test settings modifications
6. Sign out and sign back in

### 2. Set Up Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings > Domains**
2. Add your custom domain
3. Configure DNS according to Vercel's instructions
4. Update Supabase Auth settings:
   - Go to **Authentication > URL Configuration**
   - Add your custom domain to allowed redirect URLs

### 3. Configure Email (Optional)

By default, Supabase uses their SMTP server for auth emails.

To use your own:
1. In Supabase dashboard, go to **Settings > Auth**
2. Scroll to **SMTP Settings**
3. Configure your email provider
4. Customize email templates

## Environment Variables Reference

### Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### Production Considerations

- Never commit `.env.local` to git
- Use Vercel environment variables for production
- Keep your database password secure
- Rotate keys if compromised

## Monitoring & Maintenance

### Supabase

- Monitor database usage in Supabase dashboard
- Check Auth logs for failed logins
- Review RLS policies if you see permission errors

### Vercel

- Monitor deployments in Vercel dashboard
- Check function logs for errors
- Set up error tracking (Sentry, etc.)

### Regular Tasks

- Review user feedback
- Monitor database size (free tier: 500MB)
- Check for Supabase/Next.js updates
- Backup important data periodically

## Troubleshooting

### "User not authenticated" errors
- Check middleware.ts is running correctly
- Verify Supabase cookies are being set
- Check browser console for errors

### RLS Policy errors
- Review SQL migration was run completely
- Check user's family_id is set correctly
- Verify policies match your use case

### Styling issues
- Clear browser cache
- Check Tailwind CSS is building correctly
- Verify custom CSS in globals.css

### Build errors on Vercel
- Check all dependencies are in package.json
- Verify TypeScript types are correct
- Review build logs for specific errors

## Scaling Considerations

### When to upgrade Supabase plan:
- Database > 500MB (Pro plan: 8GB)
- Need more than 50,000 monthly active users
- Require custom domains on auth emails
- Need daily backups

### When to upgrade Vercel plan:
- Exceed 100GB bandwidth (Pro plan: 1TB)
- Need more than 100 deployments per day
- Require password protection
- Need advanced analytics

---

## Quick Deploy Checklist

```
□ Create Supabase project
□ Run database migration
□ Copy API credentials
□ Push code to GitHub
□ Deploy to Vercel
□ Set environment variables
□ Test signup/login
□ Test onboarding flow
□ Test dashboard
□ Test settings
□ Celebrate! 🎉
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase docs: https://supabase.com/docs
3. Review Next.js docs: https://nextjs.org/docs
4. Contact project owner
