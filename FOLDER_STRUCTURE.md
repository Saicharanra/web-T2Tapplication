# Trash2Treasure (T2T) - Folder Structure & Purpose

This document provides a comprehensive overview of the project's folder structure and the purpose of each directory and key file.

---

## 📁 Root Directory

### Configuration Files
- **`package.json`** - Project dependencies, scripts, and metadata
- **`package-lock.json`** - Locked versions of dependencies for consistent installs
- **`tsconfig.json`** - TypeScript compiler configuration with path aliases (`@/*`)
- **`next.config.js`** - Next.js configuration (image domains, build settings)
- **`tailwind.config.ts`** - Tailwind CSS customization and theme configuration
- **`postcss.config.js`** - PostCSS configuration for CSS processing
- **`components.json`** - ShadCN UI components configuration
- **`middleware.ts`** - Next.js middleware for authentication and routing protection

### Documentation Files
- **`README.md`** - Main project documentation and overview
- **`PROJECT_STRUCTURE.md`** - Project structure and architecture details
- **`TROUBLESHOOTING.md`** - Common issues and their solutions
- **`NEXTJS15_API_MIGRATION.md`** - Guide for Next.js 15 API migration
- **`DYNAMIC_RENDERING_FIX.md`** - Solutions for dynamic rendering issues
- **`FIX_UPLOAD_ERROR.md`** - File upload error fixes
- **`LEADERBOARD_DYNAMIC.md`** - Leaderboard dynamic rendering documentation
- **`WEBHOOK_QUICK_FIX.md`** - Quick fixes for webhook issues

### Utility Files
- **`browser-diagnostic.html`** - Browser-based diagnostic tool for testing
- **`check-webhook-setup.js`** - Script to verify webhook configuration

---

## 📁 `/app` - Next.js App Router Directory

Main application directory using Next.js 15 App Router architecture.

### `/app/admin` - Admin Dashboard
Admin-only pages for managing the T2T platform.

- **`page.tsx`** - Admin dashboard home with overview statistics
- **`layout.tsx`** - Admin layout wrapper with navigation and role protection

#### `/app/admin/submissions`
- **`page.tsx`** - Review and verify/reject user waste submissions

#### `/app/admin/users`
- **`page.tsx`** - Manage users, view profiles, and user statistics

#### `/app/admin/points`
- **`page.tsx`** - Manage points system, adjust user points

#### `/app/admin/reports`
- **`page.tsx`** - Generate analytics reports and geographic insights

#### `/app/admin/settings`
- **`page.tsx`** - Admin settings and configuration

---

### `/app/dashboard` - User Dashboard
User-facing dashboard for waste submission and tracking.

- **`page.tsx`** - User dashboard home with stats, recent submissions, and quick actions
- **`layout.tsx`** - Dashboard layout with navigation sidebar

#### `/app/dashboard/leaderboard`
- **`page.tsx`** - Public leaderboard showing top contributors

#### `/app/dashboard/profile`
- **`page.tsx`** - User profile with statistics, achievements, and level progression

#### `/app/dashboard/wallet`
- **`page.tsx`** - Digital wallet for redeeming earned points

#### `/app/dashboard/learn`
- **`page.tsx`** - Educational content about recycling and waste management

---

### `/app/api` - API Routes
Backend API endpoints for the application.

#### `/app/api/upload`
- **`route.ts`** - Handle waste image uploads to Supabase Storage

#### `/app/api/submissions`
- **`route.ts`** - Create and fetch user submissions (GET, POST)
- **`all/route.ts`** - Fetch all submissions (admin)
- **`[id]/verify/route.ts`** - Verify or reject a submission (admin)

#### `/app/api/users`
- **`route.ts`** - User CRUD operations
- **`stats/route.ts`** - Get user statistics
- **`profile/route.ts`** - Get user profile data
- **`profile/stats/route.ts`** - Get detailed profile statistics

#### `/app/api/admin/users`
- **`route.ts`** - Admin-specific user management endpoints

#### `/app/api/points`
- **`route.ts`** - Points management and redemption

#### `/app/api/wallet`
- **`route.ts`** - Wallet operations and transactions

#### `/app/api/leaderboard`
- **`route.ts`** - Leaderboard data endpoint

#### `/app/api/webhooks/clerk`
- **`route.ts`** - Clerk authentication webhook handler for user sync

---

### `/app/sign-in` & `/app/sign-up` - Authentication
- **`sign-in/[[...sign-in]]/page.tsx`** - Clerk sign-in page
- **`sign-up/[[...sign-up]]/page.tsx`** - Clerk sign-up page

---

### Root App Files
- **`page.tsx`** - Landing page / home page
- **`layout.tsx`** - Root layout with providers and global setup
- **`globals.css`** - Global CSS styles and Tailwind directives

---

## 📁 `/components` - Reusable Components

### `/components/ui` - ShadCN UI Components
Pre-built, customizable UI components following ShadCN design system.

- **`avatar.tsx`** - User avatar component
- **`badge.tsx`** - Badge component for tags and labels
- **`button.tsx`** - Button component with variants
- **`card.tsx`** - Card container component
- **`input.tsx`** - Form input component
- **`label.tsx`** - Form label component
- **`toast.tsx`** - Toast notification component
- **`toaster.tsx`** - Toast container/provider
- **`use-toast.ts`** - Toast hook for triggering notifications

---

## 📁 `/lib` - Utility Libraries

Shared utility functions and client configurations.

- **`prisma.ts`** - Prisma client singleton instance for database access
- **`supabase.ts`** - Supabase client configuration and upload utilities
- **`utils.ts`** - General helper functions (cn, formatters, validators)

---

## 📁 `/sql` - Database Scripts

SQL scripts for database setup and management.

- **`README.md`** - SQL scripts documentation
- **`master-setup.sql`** - Complete database schema setup
- **`complete-database-setup.sql`** - Full database initialization
- **`clerk-webhook-setup.sql`** - Clerk webhook integration setup
- **`alter-user-table-for-webhook.sql`** - User table modifications for webhooks
- **`webhook-diagnostic.sql`** - Diagnostic queries for webhook debugging

---

## 🎯 Key Architecture Patterns

### Authentication Flow
1. Users sign up/in via **Clerk** (OAuth, Magic Links)
2. Webhook syncs user data to **PostgreSQL** via `/api/webhooks/clerk`
3. Middleware protects routes based on role (USER/ADMIN)

### Data Flow
1. **User uploads waste image** → `/api/upload` → **Supabase Storage**
2. **Submission created** → `/api/submissions` → **PostgreSQL (Prisma)**
3. **Admin verifies** → `/api/submissions/[id]/verify` → **Points awarded**
4. **Level progression** → Bronze → Silver → Gold → Platinum

### Technology Stack
- **Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS
- **UI:** ShadCN UI, Radix UI, Lucide Icons
- **Auth:** Clerk
- **Database:** Supabase (PostgreSQL), Prisma ORM
- **Storage:** Supabase Storage
- **Charts:** Recharts, Chart.js
- **Deployment:** Vercel

---

## 📊 User Roles

### USER Role
- Upload waste images
- View dashboard and statistics
- Track level progression
- Redeem points via wallet
- Access leaderboard and educational content

### ADMIN Role
- All USER permissions
- Verify/reject submissions
- Manage users
- View analytics and reports
- Adjust points manually
- Access admin dashboard

---

## 🔧 Development Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 📝 Environment Variables

Required in `.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=
```

---

## 🎨 Styling Conventions

- **Tailwind CSS** for utility-first styling
- **ShadCN UI** for consistent component design
- **CSS Variables** for theming (defined in `globals.css`)
- **Responsive Design** with mobile-first approach

---

## 🚀 Deployment

- Hosted on **Vercel**
- Automatic deployments from Git
- Environment variables configured in Vercel dashboard
- Database hosted on **Supabase**

---

**Last Updated:** 2025-10-21  
**Project:** Trash2Treasure (T2T) - Smart Waste-to-Credit System
