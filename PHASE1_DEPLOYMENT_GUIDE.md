# Legacy Quest Phase 1: Deployment Guide

## 🎯 What's New in Phase 1

### Core Features
1. **Age-Tier System** (4 tiers: ages 4-8, 9-12, 13-16, 17+)
2. **Skill Trees** (Earning, Saving, Investing, Budgeting)
3. **Self-Service Task System** (Kids claim tasks, parents approve)
4. **Educational Modules** (17 pre-seeded learning modules)
5. **Enhanced Dashboards** (Parent & Kid dashboards with new features)
6. **Module Progress Tracking** (Track learning completion)
7. **Savings Goals** (Kids can set and track goals)

---

## 📋 Pre-Deployment Checklist

- [ ] Code built successfully (`npm run build` ✓)
- [ ] Database migration SQL ready
- [ ] Supabase project accessible
- [ ] Environment variables configured
- [ ] GitHub repo up to date

---

## 🗄️ Database Migration

### Step 1: Access Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
2. Replace `YOUR_PROJECT_ID` with your actual Supabase project ID

### Step 2: Run Migration

1. Open the migration file: `supabase/migrations/20260213_phase1_legacy_quest.sql`
2. Copy **ALL** contents (23,768 bytes)
3. Paste into Supabase SQL Editor
4. Click **"RUN"**
5. Wait for success message: "Success. No rows returned"

### Step 3: Verify Migration

Run this query to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'task_templates',
    'claimed_tasks',
    'educational_modules',
    'module_progress',
    'savings_goals'
  )
ORDER BY table_name;
```

You should see all 5 new tables.

### Step 4: Verify Default Data

Check that educational modules were seeded:

```sql
SELECT COUNT(*) FROM educational_modules WHERE is_active = true;
```

Should return: **17 modules**

---

## 🚀 Deployment Steps

### Option A: Vercel Auto-Deploy (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Phase 1: Legacy Quest - Age tiers, skills, tasks, modules"
   git push origin main
   ```

2. **Vercel Auto-Deploys:**
   - Vercel detects the push
   - Builds automatically
   - Deploys to production
   - Check deployment status at vercel.com/dashboard

3. **Verify Deployment:**
   - Visit your production URL
   - Test parent dashboard (should see skill award buttons)
   - Test kid dashboard (should see skills tab)

### Option B: Manual Deploy

```bash
# Build locally
npm run build

# Deploy to Vercel
vercel --prod
```

---

## 🧪 Testing Checklist

### Parent Dashboard Tests

- [ ] Log in as parent/admin
- [ ] See kid cards with age tier badges (if birthdate set)
- [ ] See skill levels for kids (if any skill points)
- [ ] Click "Quick Award by Skill" buttons
- [ ] Award points for earning/saving/investing/budgeting
- [ ] See confetti animation 🎊
- [ ] Refresh page - see skill points updated
- [ ] Check pending task approval queue (if any tasks claimed)

### Kid Dashboard Tests

- [ ] Log in as kid (if kid login enabled)
- [ ] See 6 tabs: Activity, Skills, Tasks, Learn, Badges, Rewards
- [ ] Click "Skills" tab - see skill tree
- [ ] Click "Learn" tab - see educational modules
- [ ] Start a module (placeholder for now)
- [ ] Click "Tasks" tab (Tier 2+ only)
- [ ] Claim a task (if available)

### Admin Tests

- [ ] Create a task template (via settings or API)
- [ ] Set age tier requirements (min/max)
- [ ] Assign skill type to task
- [ ] Make task recurring (daily/weekly/monthly)
- [ ] Test kid claiming task
- [ ] Approve/reject claimed task
- [ ] Verify points awarded + skill points awarded

---

## 🎨 New UI Components

### Components Added

1. **SkillBadge** - Displays skill level with progress bar
2. **AgeTierBadge** - Shows kid's age tier
3. **SkillAwardButtons** - Parent dashboard skill-based awards
4. **TaskApprovalQueue** - Pending task approvals for parents
5. **AvailableTasks** - Kid view of claimable tasks
6. **SkillTreeView** - Kid skill tree visualization
7. **EducationalModules** - Learning module browser

---

## 📊 Database Schema Changes

### New Tables

1. **task_templates** - Task pool (parent-created tasks)
2. **claimed_tasks** - Kid-claimed tasks with status
3. **educational_modules** - Learning content
4. **module_progress** - Kid progress tracking
5. **savings_goals** - Kid savings goals

### Updated Tables

**kids table** - Added fields:
- `birthdate` (DATE) - For age tier calculation
- `age_tier` (INTEGER 1-4) - Auto-calculated
- `skill_earning` (INTEGER) - Earning skill points
- `skill_saving` (INTEGER) - Saving skill points
- `skill_investing` (INTEGER) - Investing skill points
- `skill_budgeting` (INTEGER) - Budgeting skill points

---

## 🔐 Security (RLS Policies)

All new tables have Row Level Security enabled:

- **task_templates**: Family-isolated (parents can CRUD)
- **claimed_tasks**: Kids can insert/update own, parents can manage all
- **educational_modules**: Global read access, admin-only write
- **module_progress**: Kids can manage own, parents can view
- **savings_goals**: Kids (Tier 2+) can manage own, parents can view

---

## 🎓 Seeded Educational Modules

17 modules pre-loaded across all age tiers:

### Tier 1 (Ages 4-8)
- Counting Coins
- Saving is Fun!
- Needs vs Wants

### Tier 2 (Ages 9-12)
- Making Money
- Setting Savings Goals
- Budgeting Basics
- What is Investing?

### Tier 3 (Ages 13-16)
- Earning Power
- Smart Saving Strategies
- Investment 101
- Credit & Debt
- Budget Like a Pro

### Tier 4 (Ages 17+)
- Career Planning
- Building Wealth
- Real Estate Basics
- Tax Fundamentals
- Retirement Planning

---

## 🔄 Upgrade Path for Existing Users

### If Kids Already Exist

1. **Set Birthdates:**
   - Go to Settings
   - Edit each kid
   - Add birthdate (optional but recommended)
   - Age tier will auto-calculate

2. **Skills Start at Zero:**
   - All kids start with 0 skill points
   - Award skill points via "Quick Award by Skill" buttons
   - Or create skill-based tasks

3. **Create Task Templates:**
   - Settings > Tasks (TODO: Add UI)
   - Or use API/database directly for now

### Migration Notes

- Existing features work unchanged ✓
- New features are opt-in (kids don't need birthdates)
- Skills can be ignored (works without them)
- Tasks are optional (not required for points)

---

## 🐛 Known Issues & Workarounds

### Issue 1: No Task Template UI Yet

**Workaround:** Create tasks via SQL:

```sql
INSERT INTO task_templates (
  family_id, 
  title, 
  description, 
  points, 
  skill_type, 
  min_age_tier, 
  max_age_tier,
  is_recurring,
  recurrence_pattern,
  is_active,
  created_by
)
VALUES (
  'YOUR_FAMILY_ID',
  'Clean Your Room',
  'Tidy up and organize',
  25,
  'earning',
  1,
  4,
  true,
  'daily',
  true,
  'YOUR_USER_ID'
);
```

### Issue 2: Educational Module Content Placeholder

**Status:** Module framework exists, but content is placeholder.

**Workaround:** Full lesson content coming in Phase 2. For now, modules show:
- Title, description, difficulty
- Point rewards
- Progress tracking works
- "Start Learning" button shows alert (placeholder)

### Issue 3: Kid Login Not Fully Enabled

**Status:** Kid dashboards work but require manual login setup.

**Workaround:** Phase 2 will add proper kid account creation flow.

---

## 📈 Performance Impact

### Bundle Size Changes

- **Dashboard route:** +11.2 KB → 202 KB total
- **Kid route:** +7.13 KB → 190 KB total
- **Middleware:** 74.5 KB (unchanged)

### Database Queries

- Parent dashboard: +1 query (pending tasks)
- Kid dashboard: +4 queries (tasks, modules, progress, goals)
- All queries use indexes ✓
- RLS policies non-recursive ✓

---

## 🎉 Success Metrics

After deployment, you should see:

- ✅ Parent dashboard shows skill award buttons
- ✅ Kid dashboard has 6 tabs
- ✅ Educational modules display in "Learn" tab
- ✅ Skill tree shows in "Skills" tab
- ✅ Tasks appear in "Tasks" tab (Tier 2+)
- ✅ Age tier badges visible (if birthdate set)
- ✅ Skill progression works (bronze → silver → gold)

---

## 🚨 Rollback Plan

If something breaks:

### Option 1: Revert Code

```bash
git revert HEAD
git push origin main
```

Vercel will auto-deploy the previous version.

### Option 2: Revert Database

```sql
-- Drop new tables (nuclear option)
DROP TABLE IF EXISTS module_progress CASCADE;
DROP TABLE IF EXISTS claimed_tasks CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS educational_modules CASCADE;
DROP TABLE IF EXISTS savings_goals CASCADE;

-- Remove new columns from kids table
ALTER TABLE kids 
  DROP COLUMN IF EXISTS birthdate,
  DROP COLUMN IF EXISTS age_tier,
  DROP COLUMN IF EXISTS skill_earning,
  DROP COLUMN IF EXISTS skill_saving,
  DROP COLUMN IF EXISTS skill_investing,
  DROP COLUMN IF EXISTS skill_budgeting;
```

**Warning:** This will delete all Phase 1 data!

---

## 🎯 Next Steps (Phase 2)

Planned for next iteration:

1. **Task Template UI** - Admin interface to create/edit tasks
2. **Full Educational Content** - Interactive lessons with quizzes
3. **Savings Goal UI** - Kids can create/track goals
4. **Reward Redemption System** - Actually "purchase" rewards
5. **Parent Approval Workflow** - Better task approval UX
6. **Kid Login Flow** - Proper account creation for kids
7. **Mobile Responsive Improvements** - Better touch targets
8. **Analytics Dashboard** - Family financial health metrics

---

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Check Supabase logs for database errors
3. Verify migration was applied successfully
4. Check that RLS policies allow access
5. Test with a fresh incognito session

---

**Phase 1 Deployment:** Ready to Ship! 🚀

Built with ❤️ for families teaching kids about money.
