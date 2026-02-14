# 🚀 Quick Start - Apply Migration & Test

## Step 1: Apply Database Migration (REQUIRED)

The app is deployed but gamification won't work until you apply this migration:

### Copy This SQL:

```bash
# From your terminal:
cat /Users/jack/.openclaw/workspace/inheritance-game/supabase/migrations/20260213_gamification.sql | pbcopy
```

This copies the migration to your clipboard.

### Paste & Run:

1. Open: https://supabase.com/dashboard/project/kxqrsdicrayblwpczxsy/sql/new
2. Paste the SQL (Cmd+V)
3. Click "RUN" button
4. Wait for "Success. No rows returned"

✅ Done! Gamification is now active.

---

## Step 2: Test It Out

### Test as Parent:

1. Go to: https://rp1.nsprd.com/auth/login
2. Log in with your parent account
3. On dashboard, find a kid card
4. Click one of the quick-award buttons (Small/Medium/Large)
5. **Watch the confetti! 🎊**
6. Check the activity feed - new transaction should appear

### Test as Kid:

1. Open https://rp1.nsprd.com/auth/login in incognito
2. Log in as a kid account
3. Check the giant balance display
4. Click "Achievements" tab - see if "Getting Started" unlocked
5. Click "Rewards" tab - see what you can afford
6. Click "Activity" tab - see your transaction history

---

## Step 3: Verify Security (Multi-Tenant Isolation)

### Create Test Family:

1. Open incognito window
2. Go to: https://rp1.nsprd.com/auth/signup
3. Create a new account (test email)
4. Complete onboarding (create a test family)
5. Try to access your real family's data
   - You shouldn't see it (RLS blocks it)
   - Only your test family should be visible

✅ If isolation works, security is solid.

---

## Step 4: Mobile Test (Optional)

1. Open https://rp1.nsprd.com on your phone
2. Log in as kid
3. Test responsive design
4. Try quick-award buttons (should be touch-friendly)
5. Swipe through tabs

---

## Troubleshooting

### "No achievements showing"
- Migration not applied yet
- Run the SQL migration from Step 1

### "Confetti not working"
- JavaScript disabled?
- Try hard refresh (Cmd+Shift+R)

### "Can see other family's data"
- RLS not working
- Check migration was applied correctly
- Verify in Supabase dashboard

### "Build failed on Vercel"
- Check Vercel dashboard: https://vercel.com
- Look for error logs
- Might need to re-deploy

---

## What's Next?

Read `PHASE1_SUMMARY.md` for full details on:
- All new features
- Visual polish
- Gamification system
- Phase 2 roadmap

---

**Need help?** Check the full docs or ping your agent!
