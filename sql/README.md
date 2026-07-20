# 📁 SQL Scripts Directory

This folder contains the complete SQL database setup script for the Trash2Treasure application.

---

## 🌟 Single Source of Truth: `complete-database-setup.sql`

All database tables, indexes, triggers, storage policies, and RLS configurations are consolidated into a single file:

### 📄 [`complete-database-setup.sql`](complete-database-setup.sql)

**Features consolidated in this file:**
- ✅ **Database Schema**: Full schema definition including `User` (with role enum), `Submission`, `PointsHistory`, `OTP`, `Bin`, `Notification`, `Reward`, `RewardCode`, and `RewardRedemption`.
- ✅ **Clerk Webhook Support**: Auto-updating `updatedAt` trigger.
- ✅ **Storage Bucket Policies & RLS**: Policies for `waste-images` and `bin-images` storage buckets, and RLS configurations for security.
- ✅ **Admin User Setup**: Templates to easily promote users to administrative levels.
- ✅ **Diagnostics**: Queries to verify webhook integration, images, and user points health.
- ✅ **Daily Operations**: Scripts to handle, verify, or reject submissions, and manage user statuses.
- ✅ **Maintenance**: Fixes for common PostgreSQL casting / data issues.
- ✅ **Testing & Verification**: Scripts to simulate Clerk events and generate test data.

---

## 🚀 Quick Start (First Time Setup)

1. **Open Supabase SQL Editor**
2. **Copy and Run Part A** from `complete-database-setup.sql` to initialize all database types, tables, triggers, indexes, and bucket policies.
3. **Configure Storage**: Make sure to create the `waste-images` and `bin-images` public buckets in your Supabase Dashboard before running the bucket policies.
4. **Make Yourself Admin**: Replace the placeholder `user_YOUR_CLERK_ID_HERE` with your actual Clerk user ID in Section 4 and run it.
5. **Verify**: Run the diagnostics queries in Part B to verify everything works.
