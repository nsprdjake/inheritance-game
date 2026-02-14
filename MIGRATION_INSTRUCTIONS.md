# Migration Instructions

## Apply Gamification Migration

The gamification migration file is located at:
`supabase/migrations/20260213_gamification.sql`

### Steps to Apply:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/kxqrsdicrayblwpczxsy
2. Navigate to SQL Editor
3. Copy the entire contents of `supabase/migrations/20260213_gamification.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute

### What This Migration Does:

1. **Drops old recursive RLS policies** and replaces them with non-recursive versions
2. **Creates achievements table** - tracks kid milestones (first points, century club, etc.)
3. **Creates streaks table** - tracks consecutive days of earning points
4. **Adds gamification columns to kids table** - level (bronze/silver/gold) and total_earned
5. **Creates helper functions**:
   - `update_kid_level()` - Calculates and updates kid's level
   - `check_achievements()` - Awards achievements based on progress
   - `update_streak()` - Updates daily streak tracking
6. **Creates trigger** - Automatically updates gamification when points are awarded

### Testing After Migration:

1. Award points to a kid through the parent dashboard
2. Check that achievements unlock automatically
3. Verify RLS is working - test that families can't see each other's data
4. Check kid dashboard to see achievements, streaks, and levels

### Rollback (if needed):

If something goes wrong, you can disable RLS temporarily:
```sql
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE kids DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE streaks DISABLE ROW LEVEL SECURITY;
```

But remember to re-enable it before going to production!
