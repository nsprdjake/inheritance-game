# 👦 👧 Kid Authentication System

LYNE now has a complete kid login system! Kids can have their own accounts and access their personal dashboard.

## Overview

**Two Types of Users:**
1. **Parents** - Use email/password, manage family, award points
2. **Kids** - Use username/password, view balance, achievements, track progress

**Security:**
- Kids can only see their own data
- Parents control account creation
- Separate login pages for clarity
- Username-based (kid-friendly, no email needed)

---

## How It Works

### For Parents

#### 1. Create a Kid Profile
1. Go to Settings → Manage Kids
2. Add kid's name and age
3. Click "Add"

#### 2. Create Login Account for Kid
1. In Settings, find the kid
2. Click "Create Login Account for [name]"
3. Choose a username (e.g., `maverick2024`)
4. Set a password (at least 6 characters)
5. Give credentials to kid

**Username Tips:**
- Use kid's name + year: `sophia2024`
- Make it memorable: `captain_max`
- Lowercase, no spaces: `coolkid123`

**Password Tips:**
- Make it easy for kid to remember
- At least 6 characters
- Consider: favorite animal + age (e.g., `tiger10`)

### For Kids

#### 1. Access Kid Login
Go to: https://rp1.nsprd.com/auth/kid-login

Or from main login page, click "Kid Login 🎮"

#### 2. Sign In
- Enter username (given by parent)
- Enter password
- Click "Sign In 🚀"

#### 3. View Dashboard
- See total points balance
- Check level (bronze/silver/gold)
- View achievements unlocked
- Track activity streak
- See recent transactions
- View rewards they can afford

---

## Technical Details

### Database Schema

**users table:**
```sql
- id (UUID, auth.users reference)
- family_id (UUID)
- role (text: 'admin', 'parent', 'kid')
- kid_id (UUID, nullable, references kids table)
- email (text)
```

**kids table:**
```sql
- id (UUID)
- family_id (UUID)
- name (text)
- age (integer)
- user_id (UUID, nullable) -- links to auth user
- level (text: 'bronze', 'silver', 'gold')
- total_earned (integer)
-- ...other fields
```

### Authentication Flow

**Kid Account Creation:**
1. Parent creates kid profile in database
2. Parent initiates account creation
3. System generates email-like identifier: `{username}@family.lyne`
4. Auth user created with this email
5. User record created with `role: 'kid'`
6. Kid record linked via `user_id`

**Kid Login:**
1. Kid enters username
2. System converts to email: `{username}@family.lyne`
3. Supabase auth with email/password
4. Verify user role is 'kid'
5. Redirect to `/kid` dashboard

**Why `@family.lyne` domain?**
- Kids don't need real email addresses
- Avoids email delivery issues
- Keeps it simple and kid-friendly
- Internal identifier that works with Supabase auth

---

## Files Added/Modified

### New Components
- `components/settings/CreateKidAccount.tsx` - Account creation UI
- `app/auth/kid-login/page.tsx` - Kid login page

### Modified Files
- `app/auth/login/page.tsx` - Added link to kid login
- `components/settings/SettingsClient.tsx` - Integrated CreateKidAccount

### Existing (Already Working)
- `app/kid/page.tsx` - Kid dashboard (server component)
- `components/dashboard/KidDashboardClient.tsx` - Kid UI

---

## Features

### Kid Dashboard Includes:
- ✅ Big prominent balance display
- ✅ Level badge (bronze/silver/gold) with progress bar
- ✅ Achievements grid
- ✅ Activity streak tracker
- ✅ Recent transactions feed
- ✅ Rewards calculator (what they can afford)
- ✅ Available tasks (Phase 1)
- ✅ Educational modules (Phase 1)
- ✅ Skills tree view (Phase 1)

### Security Features:
- ✅ Row Level Security (RLS) - kids can only see their data
- ✅ Role verification on login
- ✅ Separate auth flows (parent vs kid)
- ✅ Parent-controlled account creation
- ✅ No PII required for kids (no real email)

---

## User Experience

### Parent Flow
```
Settings → Add Kid → Create Login → Share Credentials
                                              ↓
                                    Kid can now log in!
```

### Kid Flow
```
rp1.nsprd.com → Kid Login → Enter username/password → Dashboard
                                                             ↓
                                                    View points, achievements, etc.
```

### First-Time Setup (Full Family)
1. Parent signs up (email/password)
2. Parent completes onboarding (family name, settings)
3. Parent adds kids (names, ages)
4. Parent creates login accounts for each kid
5. Parent shares credentials with kids
6. Kids can log in on their own devices
7. Parent awards points via dashboard
8. Kids see updates in real-time

---

## Best Practices

### For Parents
1. **Write down credentials** - Kids forget passwords!
2. **Use simple usernames** - Easy to remember and type
3. **Age-appropriate passwords** - Not too complex for younger kids
4. **Test the login** - Try it yourself first
5. **Share the link** - Bookmark https://rp1.nsprd.com/auth/kid-login

### For Deployment
1. **Mobile-friendly** - Kids will use phones/tablets
2. **Clear error messages** - Help kids troubleshoot
3. **Logout button visible** - In case of shared devices
4. **Parent link** - Easy way back to parent login

### Security Considerations
1. **No email confirmation** - Auto-confirm is enabled (kids don't have email)
2. **RLS policies** - Enforce family/kid boundaries
3. **Password reset** - Currently parent-initiated (no email recovery)
4. **Session duration** - Standard Supabase (1 hour, refreshable)

---

## Common Issues & Solutions

### "Wrong username or password"
- Check for typos (usernames are case-insensitive)
- Verify password was typed correctly
- Parent should check Settings to confirm account was created

### "This login is for kids only"
- Parent trying to use kid login page
- Redirect to main login: https://rp1.nsprd.com/auth/login

### Kid account not showing as "Active"
- Refresh Settings page
- Check kid record has `user_id` set
- Verify auth user was created (check Supabase dashboard)

### Can't create account (error)
- Username might already exist (try different username)
- Check for special characters in username
- Verify family_id is set correctly

---

## Future Enhancements

### Possible Additions:
- **Password reset** - Parent-initiated password change
- **Profile customization** - Kid picks avatar, theme
- **Kid-to-kid messaging** - Within family (moderated)
- **Parental controls** - Screen time, content filters
- **Multi-device** - Sync across phone/tablet/computer
- **Offline mode** - View data without connection
- **Notifications** - When points are awarded
- **QR code login** - Scan to log in (no typing)

---

## Testing Checklist

### As Parent:
- [ ] Add a kid profile
- [ ] Create login account for kid
- [ ] Verify account shows as "Active"
- [ ] Award points to kid
- [ ] Check kid can see points in database

### As Kid:
- [ ] Access kid login page
- [ ] Sign in with username/password
- [ ] View dashboard with balance
- [ ] See achievements
- [ ] View transactions
- [ ] Sign out

### Edge Cases:
- [ ] Try logging in with wrong password
- [ ] Try using parent login as kid (should fail)
- [ ] Try using kid login as parent (should fail)
- [ ] Create multiple kids, verify isolation
- [ ] Delete kid account (verify auth user cleanup)

---

## Support

**For Parents:**
- Settings → Manage Kids → Create accounts
- Main login: https://rp1.nsprd.com/auth/login

**For Kids:**
- Kid login: https://rp1.nsprd.com/auth/kid-login
- Ask parent for username/password

**Questions?**
Check the dashboard or contact support!

---

## Summary

🎉 **Kids can now log in and track their own progress!**

- ✅ Simple username/password login
- ✅ Parent-controlled account creation
- ✅ Secure, isolated data access
- ✅ Kid-friendly dashboard
- ✅ Real-time point tracking

**This is a huge part of making LYNE a family-focused platform!**
