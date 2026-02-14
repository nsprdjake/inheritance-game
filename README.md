# 🎮 Inheritance Game - Gamified Point System for Families

A modern, gamified point system that helps families manage chores, rewards, and allowances.

## 🌟 Features

### For Parents
- ⚡ **Quick-Award Buttons** - Award points with one click (small/medium/large tasks)
- 🔴 **Point Deduction** - Remove points for broken rules
- 📊 **Activity Dashboard** - Track all family transactions in real-time
- 👨‍👩‍👧‍👦 **Multi-Kid Management** - Manage all your kids from one dashboard
- 🏆 **Level System** - Watch your kids progress through bronze, silver, and gold tiers

### For Kids
- 💰 **Big Balance Display** - See your points at a glance
- 🏆 **Achievements** - Unlock badges as you earn points
- 🔥 **Streak Tracking** - Build consecutive days of earning
- 🎁 **Reward Calculator** - See what you can afford right now
- 📊 **Transaction History** - Track all your earnings and spendings

### Gamification
- 🥉 **Bronze Level** - Starting level (0-199 points earned)
- 🥈 **Silver Level** - Intermediate (200-499 points earned)
- 🏆 **Gold Level** - Expert (500+ points earned)
- 🎯 **Achievement System** - Auto-unlock badges at milestones
- 🔥 **Daily Streaks** - Earn consecutively to build streaks
- 🎊 **Confetti Celebrations** - Visual feedback on awards

## 🚀 Live Demo

**Production URL**: https://rp1.nsprd.com

## 📋 Quick Start

### For First-Time Setup:

1. **Apply Database Migration** (Required - one time only)
   - See: `QUICK_START.md` for detailed instructions
   - Or: `MIGRATION_INSTRUCTIONS.md` for step-by-step guide

2. **Sign Up**
   - Create parent/admin account
   - Complete onboarding (family name, kids)

3. **Start Awarding Points**
   - Log in to parent dashboard
   - Click quick-award buttons on kid cards
   - Watch the confetti! 🎊

### For Development:

```bash
# Clone the repo
git clone https://github.com/nsprdjake/inheritance-game.git
cd inheritance-game

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run dev server
npm run dev

# Open browser
open http://localhost:3000
```

## 🗄️ Database

Using **Supabase** (PostgreSQL) with Row Level Security (RLS) for multi-tenant isolation.

### Tables:
- `families` - Tenant isolation
- `users` - Parent/kid accounts
- `kids` - Kid profiles with levels
- `transactions` - Point awards/deductions
- `achievements` - Unlocked badges
- `streaks` - Consecutive day tracking
- `family_settings` - Theme and point values

### Apply Migration:
```bash
# Copy SQL to clipboard
cat supabase/migrations/20260213_gamification.sql | pbcopy

# Paste into Supabase SQL Editor and run
# URL: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Deployment**: Vercel
- **Language**: TypeScript

## 📦 Dependencies

```json
{
  "next": "14.2.35",
  "react": "^18",
  "react-dom": "^18",
  "@supabase/supabase-js": "^2.95.3",
  "@supabase/ssr": "^0.8.0",
  "framer-motion": "latest",
  "canvas-confetti": "latest",
  "tailwindcss": "^3.4.1",
  "typescript": "^5"
}
```

## 🎨 Design System

- **Glass-card aesthetic** - Frosted glass effect with blur
- **Dark theme** - Modern gradient backgrounds
- **Responsive** - Mobile-first design
- **Animations** - Smooth transitions throughout

### Color Palette:
- Primary: Indigo 500 (#6366f1)
- Secondary: Purple 500 (#a855f7)
- Accent: Pink 400 (#f472b6)
- Success: Green 400 (#4ade80)
- Error: Red 400 (#f87171)

## 🔒 Security

### Multi-Tenant Isolation
- **Row Level Security (RLS)** on all tables
- **Non-recursive policies** for performance
- **Family-scoped queries** - No cross-family data leaks

### Authentication
- Email/password via Supabase Auth
- Email confirmation on signup
- Secure session management

## 📱 Mobile Support

Fully responsive design tested on:
- iPhone (Safari)
- Android (Chrome)
- Tablets (iPad)

## 🧪 Testing

See `DEPLOYMENT_CHECKLIST.md` for full testing guide.

### Quick Test:
```bash
# Build for production
npm run build

# Run production server
npm start
```

## 📚 Documentation

- `PHASE1_SUMMARY.md` - What's new in Phase 1
- `QUICK_START.md` - Fast setup guide
- `MIGRATION_INSTRUCTIONS.md` - Database migration guide
- `DEPLOYMENT_CHECKLIST.md` - Full deployment checklist

## 🗺️ Roadmap

### Phase 1 (✅ SHIPPED)
- Gamification system (achievements, streaks, levels)
- Parent dashboard (quick-awards, deductions, activity feed)
- Kid dashboard (balance, achievements, reward calculator)
- Visual polish (animations, loading states, empty states)
- Security (non-recursive RLS policies)

### Phase 2 (Coming Soon)
- 🎁 Rewards Store (redeemable items)
- 📋 Chore assignment system
- 📊 Advanced analytics & charts
- 🎮 Quests & challenges
- 👨‍👩‍👧‍👦 Family leaderboard
- 📧 Email notifications
- 🔔 Push notifications

### Phase 3 (Future)
- 💳 Payment integration (Stripe)
- 📱 Native mobile app
- 🎨 Theme customization
- 🌍 Multi-language support
- 📈 Export & reporting

## 🐛 Known Issues

- Migration must be applied manually (no automated migration runner)
- Achievement updates are server-side only (no real-time sync)

## 🤝 Contributing

This is a private project. Contact owner for access.

## 📄 License

Private - All rights reserved

## 🙏 Credits

Built with ❤️ by an autonomous AI agent for Jake's family.

## 📞 Support

- Check documentation in repo
- Review `QUICK_START.md` for common issues
- See `DEPLOYMENT_CHECKLIST.md` for troubleshooting

---

**Last Updated**: February 13, 2026
**Version**: 1.0.0 (Phase 1)
**Status**: ✅ Production Ready (after migration)
