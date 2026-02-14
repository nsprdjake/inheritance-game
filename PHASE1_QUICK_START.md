# Phase 1 Quick Start

## 🚀 Deploy in 5 Minutes

### Step 1: Apply Database Migration (2 min)

1. **Go to Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/kxqrsdicrayblwpczxsy/sql/new
   ```

2. **Copy & Paste:**
   - Open: `supabase/migrations/20260213_phase1_legacy_quest.sql`
   - Copy ALL (23KB)
   - Paste into SQL Editor
   - Click **RUN**
   - Wait for "Success"

### Step 2: Push to GitHub (1 min)

```bash
cd /Users/jack/.openclaw/workspace/inheritance-game
git add .
git commit -m "Phase 1: Legacy Quest - Age tiers, skills, tasks, modules"
git push origin main
```

### Step 3: Verify Deployment (2 min)

1. **Check Vercel:** https://vercel.com/dashboard
2. **Wait for build:** ~2 minutes
3. **Visit app:** https://rp1.nsprd.com
4. **Test login:** Parent dashboard should show new features

---

## ✅ Quick Verification

### Parent Dashboard
- [ ] See "Quick Award by Skill" buttons
- [ ] Award skill points (💰 🐷 📈 📊)
- [ ] See confetti 🎊

### Kid Dashboard  
- [ ] See 6 tabs instead of 3
- [ ] Click "Skills" - see skill tree
- [ ] Click "Learn" - see 17 modules

---

## 🎯 What Changed

### Database
- ✅ 5 new tables
- ✅ 17 educational modules seeded
- ✅ Kids table has skill fields

### UI
- ✅ Parent: Skill-based awards
- ✅ Kid: 6 tabs (Activity, Skills, Tasks, Learn, Badges, Rewards)
- ✅ Age tier system ready

---

## 🔥 Optional: Add Test Data

### Create a Task Template

```sql
-- Replace YOUR_FAMILY_ID with your actual family ID
INSERT INTO task_templates (
  family_id, 
  title, 
  description, 
  points, 
  skill_type,
  is_active
)
VALUES (
  'YOUR_FAMILY_ID',
  'Clean Your Room',
  'Tidy up and make your bed',
  25,
  'earning',
  true
);
```

### Set a Kid's Birthdate

```sql
-- Replace KID_ID with your kid's ID
UPDATE kids 
SET 
  birthdate = '2015-06-15',  -- Adjust to actual birthdate
  age_tier = calculate_age_tier('2015-06-15'::DATE)
WHERE id = 'KID_ID';
```

---

## 🐛 Troubleshooting

**Migration fails?**
- Check if you copied the ENTIRE file
- Make sure you're in the right Supabase project

**Build fails?**
- Run: `npm install`
- Run: `npm run build`
- Check for errors

**Can't see new features?**
- Clear browser cache
- Try incognito mode
- Check that migration was applied

---

**That's it!** Phase 1 is live! 🎉
