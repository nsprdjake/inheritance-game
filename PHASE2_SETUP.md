# Phase 2: Legacy Mode Setup Guide

## Quick Start (3 steps)

### 1. Run the Database Migration

```bash
cd inheritance-game

# Option A: Using direct PostgreSQL connection (recommended)
node scripts/run-phase2-migration.mjs

# Option B: Manual via Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT]/sql
# Copy/paste: supabase/migrations/20260214_phase2_legacy_system.sql
# Click "Run"
```

**Note:** You need `DATABASE_URL` in your `.env.local`:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-ID].supabase.co:5432/postgres
```

Get it from: Supabase Dashboard → Settings → Database → Connection String (URI)

### 2. Start the Dev Server

```bash
npm run dev
```

### 3. Test the Features

**As a Benefactor:**
1. Go to `/legacy/create`
2. Create a quest for a beneficiary
3. Add milestones using the drag-and-drop builder
4. Publish the quest

**As a Beneficiary:**
1. Go to `/kid/legacy`
2. View your legacy quest
3. Start working on milestones
4. Submit for verification

**As a Trustee:**
1. Go to `/trustee/dashboard`
2. Review pending milestones
3. Approve or reject achievements

## What Was Built

### Database (9 new tables)
- ✅ `legacy_accounts` - Benefactor estate management
- ✅ `beneficiaries` - Heirs + invitation system
- ✅ `legacy_quests` - Quest chains per beneficiary
- ✅ `legacy_milestones` - Individual achievements
- ✅ `legacy_media` - Videos, letters, photos (locked until unlocked)
- ✅ `legacy_trustees` - Oversight & verification
- ✅ `milestone_evidence` - Proof uploads
- ✅ `legacy_audit_log` - Full audit trail
- ✅ `legacy_achievement_templates` - 23 pre-built templates

### UI Components
- ✅ **QuestBuilder** - Visual drag-and-drop quest creator
- ✅ **Beneficiary Quest View** - Kid-side legacy journey
- ✅ **Trustee Dashboard** - Verification interface
- ✅ **Legacy Dashboard** - Benefactor overview

### Routes
- `/legacy/create` - Quest builder
- `/legacy/dashboard` - Benefactor dashboard
- `/kid/legacy` - Beneficiary quest view
- `/trustee/dashboard` - Trustee verification

### Features
- ✅ Drag-and-drop milestone ordering
- ✅ Achievement template library (23 templates)
- ✅ Custom milestone creation
- ✅ $ value assignment per milestone
- ✅ Prerequisite chains (milestone 2 unlocks after milestone 1)
- ✅ Manual verification workflow
- ✅ Progress tracking
- ✅ Invitation system (beneficiaries & trustees)
- ✅ RLS security policies
- ✅ Audit logging

## Testing Flow

### Create Your First Quest

1. **Visit** `/legacy/create`
2. **Fill out:**
   - Quest Title: "Path to Financial Freedom"
   - Description: "A journey to build wealth wisdom"
   - Beneficiary: Create new or select existing
3. **Click** "Create Quest & Start Building"

### Add Milestones

1. **Click** "+ Add from Template" (or create custom)
2. **Select** templates:
   - "Complete High School" ($5,000)
   - "Build Emergency Fund" ($3,000)
   - "Start Retirement Account" ($5,000)
3. **Drag** to reorder
4. **Click** each milestone to edit details
5. **Set** verification instructions
6. **Save Draft**
7. **Publish Quest** when ready

### Test as Beneficiary

1. **Accept** invitation (if testing, manually set `invitation_status` to 'accepted' and `user_id`)
2. **Visit** `/kid/legacy`
3. **View** quest timeline
4. **Click** "Start Working" on first milestone
5. **Click** "Submit for Verification" with notes

### Test as Trustee

1. **Assign** yourself as trustee (or manually insert record)
2. **Visit** `/trustee/dashboard`
3. **Click** pending milestone
4. **Review** evidence
5. **Approve** to unlock funds
6. **Or Reject** with feedback

## What's NOT in Phase 2 MVP

These are intentionally punted to Phase 3:

- ❌ Video recording/upload (media table exists, UI not built)
- ❌ Letter writing interface (content field exists, UI not built)
- ❌ Email invitations (invitation_token exists, not sent yet)
- ❌ File uploads for evidence (storage path exists, no uploader)
- ❌ Automatic verification (all manual for now)
- ❌ Financial account integration (Plaid)
- ❌ Preview mode (see quest as beneficiary would)
- ❌ Quest analytics/reports
- ❌ Multi-beneficiary bulk operations
- ❌ Mobile responsiveness polish

## Deployment

```bash
npm run build
vercel --prod
```

The migration will need to be run on production database:
1. Get production DATABASE_URL from Vercel/Supabase
2. Run migration script with production connection string
3. Or use Supabase Dashboard SQL editor

## Known Limitations

1. **Manual verification only** - All milestone verification requires trustee approval (no automation)
2. **No media uploads yet** - Media table exists, but upload UI not built
3. **Invitation flow incomplete** - Can create beneficiaries/trustees, but email invites not sent
4. **Basic error handling** - Some edge cases may not have user-friendly errors
5. **No undo** - Deleting milestones is permanent (no soft delete yet)

## Success Criteria ✅

You can now:
- [x] Create a legacy account
- [x] Build a quest with 3+ milestones
- [x] Invite a beneficiary (manual testing)
- [x] Assign $ values to milestones
- [x] See it from beneficiary perspective
- [x] Verify achievements as trustee

## Next Steps (Phase 3)

1. **Video Message System** - Full upload/playback UI
2. **Letter Writing** - Rich text editor for legacy letters
3. **Email Invitations** - Send invite emails to beneficiaries/trustees
4. **File Uploads** - Evidence upload with Supabase Storage
5. **Automatic Verification** - Plaid integration for financial goals
6. **Preview Mode** - Benefactor can preview what beneficiary sees
7. **Mobile Polish** - Responsive design pass
8. **Analytics** - Quest completion rates, time estimates

## Questions?

Check:
- `lib/types/legacy.ts` - All TypeScript types
- `components/legacy/QuestBuilder.tsx` - Quest builder UI
- `supabase/migrations/20260214_phase2_legacy_system.sql` - Full schema

---

**Built in ~3 hours. Ship the MVP. Iterate fast. 🚀**
