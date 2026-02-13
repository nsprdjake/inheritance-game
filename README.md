# Inheritance Game 🎮

A beautiful, multi-tenant SaaS platform for gamifying allowance and inheritance for kids. Built with Next.js 14, Supabase, and Tailwind CSS.

## Features

### MVP Features
- **Multi-tenant Architecture**: Complete family isolation with Row Level Security
- **Authentication**: Secure signup/login with Supabase Auth
- **Onboarding Wizard**: Beautiful 4-step setup process
  - Family information
  - Add kids
  - Configure settings (themes, point values)
  - Review and launch
- **Admin Dashboard**: 
  - View all kids and balances
  - Award points with quick presets
  - Recent activity feed
  - Family statistics
- **Kid Dashboard**: 
  - See current point balance
  - Dollar value conversion
  - Transaction history
  - Placeholders for future quests & rewards
- **Settings Panel**:
  - Edit family name
  - Choose themes (Modern, Pirates, Space, Medieval)
  - Configure point values (small/medium/large tasks)
  - Set points-to-dollars conversion rate
  - Manage kids (add/edit/remove)

### Design
- **Dark glass-card aesthetic** inspired by Memory Palace
- **Gradient accents** and smooth animations
- **Mobile-first responsive** design
- **Beautiful UI** with polished interactions

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS with custom glass-morphism components
- **Multi-tenancy**: Row Level Security policies in Supabase

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd inheritance-game
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Set up the database:
   - Go to your Supabase project
   - Navigate to the SQL Editor
   - Run the migration file: `supabase/migrations/20260212_initial_schema.sql`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

### Tables

- **families**: Tenant isolation (each family is a separate tenant)
- **users**: Links to Supabase auth, references family, stores role
- **kids**: Kid profiles (name, age, avatar, family_id)
- **transactions**: Point awards/redemptions with full audit trail
- **family_settings**: Customizable settings (theme, point values, conversion rate)

### Security

All tables are protected with Row Level Security (RLS) policies:
- Users can only access data from their own family
- Admins have full control over their family
- Kids can only view their own data

## Project Structure

```
inheritance-game/
├── app/
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Admin dashboard
│   ├── kid/            # Kid dashboard
│   ├── onboarding/     # Multi-step onboarding
│   ├── settings/       # Settings management
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home redirect
│   └── globals.css     # Global styles
├── components/
│   ├── dashboard/      # Dashboard components
│   ├── onboarding/     # Onboarding step components
│   ├── settings/       # Settings components
│   └── ui/             # Reusable UI components
├── lib/
│   ├── supabase/       # Supabase client utilities
│   └── types/          # TypeScript types
├── supabase/
│   └── migrations/     # Database migrations
└── middleware.ts       # Auth & routing middleware
```

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Deployment

This project is ready to deploy to:
- Vercel (recommended for Next.js)
- Netlify
- Any platform supporting Next.js 14+

### Vercel Deployment

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Future Features

- **Quests System**: Daily/weekly tasks kids can complete
- **Rewards Store**: Kids can redeem points for real rewards
- **Parent Role**: Multiple adults managing the family
- **Avatars**: Custom kid avatars
- **Notifications**: Email/push notifications for awards
- **Analytics**: Charts and insights on earning patterns
- **Mobile App**: Native iOS/Android apps

## Contributing

This is a private project. For questions or suggestions, contact the project owner.

## License

Private - All rights reserved

---

Built with ❤️ using Next.js and Supabase
