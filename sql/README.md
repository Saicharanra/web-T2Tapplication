# 📁 SQL Scripts Directory

This folder contains SQL files for complete database setup and Clerk integration.

---

## ⭐ RECOMMENDED: Single All-in-One File

### [`complete-database-setup.sql`](complete-database-setup.sql) - EVERYTHING IN ONE FILE 🎯

**Your single source of truth!** (1013 lines)

**All commands consolidated:**
- ✅ Database schema creation (User, Submission, PointsHistory)
- ✅ Clerk webhook support (updatedAt trigger)
- ✅ Storage bucket policies (waste-images)
- ✅ Admin user setup
- ✅ Complete verification & diagnostics
- ✅ Submission operations (find, verify, reject)
- ✅ User management (promote, deactivate)
- ✅ Common fixes & troubleshooting
- ✅ Analytics & reporting
- ✅ Test data generation

**15 organized sections covering every database operation!**

---

## 📄 Specialized Files (Optional)

### [`master-setup.sql`](master-setup.sql) - DATABASE MANAGEMENT

**Full application database setup** (487 lines)

### [`clerk-webhook-setup.sql`](clerk-webhook-setup.sql) - CLERK AUTHENTICATION 🔐

**Dedicated Clerk webhook integration guide!** (499 lines)

**Contains:**
1. Initial database setup (tables, indexes)
2. Add yourself as admin
3. Storage bucket policies
4. Verify setup
5. Diagnostics & troubleshooting
6. Find submission IDs
7. Verify/reject submissions
8. Common fixes
9. Reporting & statistics
10. Cleanup operations

**Your Clerk ID already filled in:** `user_34H1mCWspyCEKACIsL8KdVnt30D` ✅

---

## 🚀 Quick Start

### **First Time Setup**

1. **Open Supabase SQL Editor**
2. **Copy Section 1** from `master-setup.sql` (Create tables)
3. **Run it**
4. **Copy Section 2** (Add yourself as admin)
5. **Run it**
6. **Done!** ✅

### **Create Storage Bucket**

1. Go to **Supabase Dashboard** → **Storage**
2. Click **New Bucket**
3. Name: `waste-images`
4. Public: **YES** ✅
5. Copy **Section 3** from `master-setup.sql` (Policies)
6. Run it in SQL Editor

### **Verify Everything Works**

Copy and run **Section 4** from `master-setup.sql`:
- Should show you as ADMIN ✅
- Tables should have data

---

## 📋 Common Tasks

### **Make Yourself Admin**
```sql
-- From Section 2
INSERT INTO "User" (id, name, email, role, level, points, status)
VALUES (
  'user_34H1mCWspyCEKACIsL8KdVnt30D',
  'Your Name',
  'your@email.com',
  'ADMIN',
  'PLATINUM',
  0,
  'ACTIVE'
);
```

### **Check Why Images Don't Show**
```sql
-- From Section 5
SELECT 
  s.id,
  s."wasteType",
  u.name as user_name
FROM "Submission" s
LEFT JOIN "User" u ON s."userId" = u.id
ORDER BY s."createdAt" DESC
LIMIT 10;
```

### **Get Submission IDs**
```sql
-- From Section 6
SELECT id, "wasteType", status 
FROM "Submission"
WHERE status = 'PENDING';
```

### **Verify a Submission**
```sql
-- From Section 7 (replace SUBMISSION_ID_HERE)
UPDATE "Submission"
SET 
  status = 'VERIFIED',
  "pointsAwarded" = 50,
  "verifiedAt" = NOW()
WHERE id = 'SUBMISSION_ID_HERE';
```

---

## 🎯 File Structure

```
sql/
├── README.md                          # This file
├── complete-database-setup.sql        # ⭐ ALL commands in one (1013 lines) - RECOMMENDED
├── master-setup.sql                   # Database management (487 lines)
├── clerk-webhook-setup.sql            # 🔐 Clerk integration (499 lines)
├── webhook-diagnostic.sql             # Webhook testing (150 lines)
└── alter-user-table-for-webhook.sql   # Legacy upgrade script (132 lines)
```

**Two specialized files for different purposes!**

---

## 📖 How to Use

### **Method 1: Copy Sections** (Recommended)
1. Open `master-setup.sql`
2. Find the section you need (1-10)
3. Copy just that section
4. Paste in Supabase SQL Editor
5. Run it!

### **Method 2: Search & Replace**
1. Open `master-setup.sql`
2. Use Ctrl+F to find what you need
3. Replace placeholders:
   - `SUBMISSION_ID_HERE` → actual submission ID
   - `clerk_user_id_here` → actual user ID
4. Run it!

---

## 📖 What's in complete-database-setup.sql

**PART A: INITIAL SETUP**
| Section | Purpose | Lines |
|---------|---------|-------|
| 1. Database Schema | Create all tables, indexes | Core |
| 2. Clerk Webhook Support | Auto-update trigger, columns | Core |
| 3. Storage Policies | Bucket security (waste-images) | Core |
| 4. Admin User Setup | Make yourself admin | Core |

**PART B: VERIFICATION & DIAGNOSTICS**
| Section | Purpose | Lines |
|---------|---------|-------|
| 5. Verify Complete Setup | Check tables, admin, policies | Verify |
| 6. Webhook Diagnostics | Clerk integration health | Debug |
| 7. Submission Diagnostics | Image & submission issues | Debug |

**PART C: OPERATIONS**
| Section | Purpose | Lines |
|---------|---------|-------|
| 8. Find Submission IDs | Get UUIDs for operations | Daily |
| 9. Verify/Reject Submissions | Approve/deny with points | Daily |
| 10. User Management | Promote, deactivate users | Admin |

**PART D: MAINTENANCE**
| Section | Purpose | Lines |
|---------|---------|-------|
| 11. Common Fixes | Solve frequent issues | Fixes |
| 12. Reporting & Statistics | Analytics, leaderboards | Insights |
| 13. Cleanup Operations | Database optimization | Maintenance |

**PART E: TESTING**
| Section | Purpose | Lines |
|---------|---------|-------|
| 14. Test Webhook | Simulate Clerk events | Testing |
| 15. Test Data Generation | Create sample users | Testing |

---

---

## ⚠️ Important Notes

- **Your Clerk ID** is already in the file: `user_34H1mCWspyCEKACIsL8KdVnt30D`
- **No need to edit** user ID in most queries
- **Replace placeholders** only where marked with 👈
- **Run sections in order** for first-time setup
- **Use Section 5** if images don't show on admin page

---

## 🆘 Troubleshooting

**Images uploaded but not showing on admin page?**
→ Run all queries in Section 5 (Diagnostics)

**Not admin?**
→ Run Section 2 (Add yourself as admin)

**No submissions?**
→ Upload test image from `/dashboard`

**Orphaned submissions?**
→ Run Fix 5 or Fix 6 in Section 8

---

## 📚 Related Documentation

- [`../docs/DYNAMIC_UPLOAD_SETUP.md`](../docs/DYNAMIC_UPLOAD_SETUP.md) - Image upload guide
- [`../docs/ADMIN_IMAGE_VIEWING.md`](../docs/ADMIN_IMAGE_VIEWING.md) - Admin interface guide
- [`../docs/TROUBLESHOOTING.md`](../docs/TROUBLESHOOTING.md) - Debug guide

---

## 🎯 Which File Should I Use?

### 🌟 **RECOMMENDED: Use `complete-database-setup.sql`**

**This is your single source of truth with EVERYTHING:**
- ✅ First time setup → Sections 1-4
- ✅ Verification → Sections 5-7
- ✅ Daily operations → Sections 8-10
- ✅ Maintenance → Sections 11-13
- ✅ Testing → Sections 14-15

**One file, 1013 lines, 15 sections, every command you'll ever need!**

---

### 📋 Or use specialized files:

**Use `clerk-webhook-setup.sql` if:**
- ✅ ONLY need Clerk authentication setup
- ✅ Webhook-specific troubleshooting
- ✅ Testing webhook functionality

**Use `master-setup.sql` if:**
- ✅ ONLY need database tables and storage
- ✅ Submission verification workflows
- ✅ Analytics and statistics

**Use `webhook-diagnostic.sql` if:**
- ✅ Quick webhook health check
- ✅ Verify table compatibility

---
