# 🗑️ Trash2Treasure (T2T)

**A Smart Waste-to-Credit System for Telangana**

Transform waste into rewards! Users upload recyclable waste images, get verified by admins, and earn points redeemable for rewards.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
# Copy .env.example to .env.local and fill in your keys

# 3. Set up database
# Run SQL files in /sql folder (see SQL README)

# 4. Start development server
npm run dev
```

Visit: `http://localhost:3000`

---

## 📁 Project Structure

```
trash2treasure/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes (upload, submissions, users)
│   ├── admin/             # Admin dashboard pages
│   ├── dashboard/         # User dashboard
│   └── sign-in/           # Authentication pages
├── components/            # React components
│   └── ui/               # ShadCN UI components
├── lib/                   # Utilities
│   ├── supabase.ts       # Supabase client & upload
│   └── utils.ts          # Helper functions
├── sql/                   # 📂 All SQL scripts
│   ├── README.md         # SQL documentation
│   ├── database-setup.sql
│   ├── migration-add-image-metadata.sql
│   ├── storage-bucket-policies.sql
│   └── diagnostic-check.sql
├── docs/                  # 📚 All documentation
│   ├── README.md         # Documentation index
│   ├── COMPLETE_SETUP.md # Full setup guide
│   ├── DYNAMIC_UPLOAD_SETUP.md # Image upload guide
│   ├── TROUBLESHOOTING.md # Debug guide
│   ├── CLERK_SETUP.md    # Authentication
│   ├── SUPABASE_SETUP.md # Database & storage
│   └── ... (17 docs total)
└── public/               # Static assets
```

---

## 📚 Documentation

### **Essential Guides** (Start Here!)

1. **[Complete Setup Guide](docs/COMPLETE_SETUP.md)** - Full installation walkthrough
2. **[Image Upload Setup](docs/DYNAMIC_UPLOAD_SETUP.md)** - Configure dynamic uploads
3. **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Fix common issues

### **All Documentation**
See [`docs/README.md`](docs/README.md) for complete documentation index (17 guides).

### **SQL Scripts**
See [`sql/README.md`](sql/README.md) for database setup instructions.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, ShadCN UI
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Charts**: Recharts
- **Validation**: Zod, React Hook Form
- **Deployment**: Vercel

---

## ✨ Features

### **User Dashboard**
- 📸 Upload waste images with drag & drop
- 🎯 Earn points for verified submissions
- 🏆 Level system (Bronze → Silver → Gold → Platinum)
- 📊 Real-time statistics
- 🎖️ Achievement badges
- 📚 Educational content

### **Admin Dashboard**
- ✅ Verify/reject submissions
- 👥 User management
- 📈 Regional reports
- 📊 Analytics & charts
- 🗺️ Geographic insights

---

## 🚀 Getting Started

### **1. Clone & Install**
```bash
git clone <your-repo-url>
cd trash2treasure
npm install
```

### **2. Environment Setup**
Create `.env.local` with:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_secret
```

### **3. Database Setup**
```sql
-- In Supabase SQL Editor, run:
1. sql/database-setup.sql
2. sql/migration-add-image-metadata.sql
3. sql/storage-bucket-policies.sql (after creating bucket)
```

See [`sql/README.md`](sql/README.md) for detailed instructions.

### **4. Storage Setup**
1. Go to Supabase Dashboard → Storage
2. Create bucket: `waste-images` (public)
3. Run `sql/storage-bucket-policies.sql`

### **5. Run Development Server**
```bash
npm run dev
```

Open: `http://localhost:3000`

---

## 📖 Documentation Quick Links

| Topic | Guide | Description |
|-------|-------|-------------|
| **Setup** | [Complete Setup](docs/COMPLETE_SETUP.md) | Full installation |
| **Upload** | [Image Upload](docs/DYNAMIC_UPLOAD_SETUP.md) | Configure uploads |
| **Auth** | [Clerk Setup](docs/CLERK_SETUP.md) | Authentication |
| **Database** | [Supabase Setup](docs/SUPABASE_SETUP.md) | Database config |
| **Debug** | [Troubleshooting](docs/TROUBLESHOOTING.md) | Fix issues |
| **SQL** | [SQL Scripts](sql/README.md) | Database scripts |
| **Deploy** | [Deployment](docs/DEPLOYMENT.md) | Production setup |

---

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database (in Supabase SQL Editor)
sql/database-setup.sql       # Create tables
sql/diagnostic-check.sql     # Health check
```

---

## 🐛 Troubleshooting

**Image upload not working?**
1. Check browser console (F12)
2. Run `sql/diagnostic-check.sql`
3. Read [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)

**Sign-in issues?**
1. Check Clerk configuration
2. Read [`docs/SIGNIN_FIXED.md`](docs/SIGNIN_FIXED.md)

**Database errors?**
1. Verify tables exist
2. Check user exists in database
3. Read [`docs/SUPABASE_TROUBLESHOOTING.md`](docs/SUPABASE_TROUBLESHOOTING.md)

---

## 📂 Key Directories

- **[`/sql`](sql/)** - All database scripts (4 files)
- **[`/docs`](docs/)** - All documentation (17 guides)
- **`/app/api`** - Backend API routes
- **`/app/dashboard`** - User interface
- **`/app/admin`** - Admin interface
- **`/components/ui`** - Reusable components
- **`/lib`** - Utilities & clients

---

## 🎯 User Workflow

```
1. User signs up → Clerk authentication
2. User uploads waste image → Supabase Storage
3. Image stored + DB record created → PostgreSQL
4. Admin reviews → Verifies/Rejects
5. Points awarded → User level increases
6. Points redeemed → Digital wallet
```

---

## 👥 User Roles

- **USER**: Can upload waste, view stats, earn points
- **ADMIN**: Can verify submissions, manage users, view analytics

---

## 🔒 Security Features

- ✅ Clerk authentication (OAuth, Magic Links)
- ✅ Supabase Row Level Security (RLS)
- ✅ File validation (type, size)
- ✅ API route protection
- ✅ Admin-only endpoints
- ✅ Storage bucket policies

---

## 📊 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload image to Storage |
| `/api/submissions` | GET | Fetch user submissions |
| `/api/submissions` | POST | Create submission |
| `/api/submissions/all` | GET | Admin: all submissions |
| `/api/users/stats` | GET | User statistics |

---

## 🎨 UI Components

Built with **ShadCN UI** + **Tailwind CSS**:
- Button, Input, Card, Badge
- Toast notifications
- Loading states
- Responsive design
- Dark mode ready

---

## 📱 Responsive Design

- ✅ Mobile-first approach
- ✅ Tablet optimized
- ✅ Desktop experience
- ✅ Touch-friendly
- ✅ Accessible (ARIA labels)

---

## 🚢 Deployment

Deploy to Vercel:
```bash
vercel deploy
```

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for detailed instructions.

---

## 📄 License

This project is part of the Trash2Treasure initiative for Telangana.

---

## 🤝 Contributing

1. Follow TypeScript + ESLint rules
2. Use ShadCN UI components
3. Test before committing
4. Update docs when adding features

---

## 📞 Support

- **Documentation**: [`docs/README.md`](docs/README.md)
- **SQL Help**: [`sql/README.md`](sql/README.md)
- **Troubleshooting**: [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)

---

## ✅ Quick Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables set (`.env.local`)
- [ ] Database tables created (`sql/database-setup.sql`)
- [ ] Storage bucket created (`waste-images`)
- [ ] Storage policies applied (`sql/storage-bucket-policies.sql`)
- [ ] User added to database
- [ ] Development server running (`npm run dev`)
- [ ] Can sign in successfully
- [ ] Can upload images

---

**🎉 Ready to make Telangana greener! Start with [`docs/COMPLETE_SETUP.md`](docs/COMPLETE_SETUP.md)**

---

## 📚 Documentation Structure

```
docs/
├── README.md                      # 📖 Documentation index
├── COMPLETE_SETUP.md              # 🚀 Full setup guide
├── DYNAMIC_UPLOAD_SETUP.md        # 📸 Image upload (379 lines)
├── TROUBLESHOOTING.md             # 🔧 Debug guide (305 lines)
├── CLERK_SETUP.md                 # 🔐 Authentication
├── SUPABASE_SETUP.md              # 🗄️ Database & storage
└── ... (17 total)

sql/
├── README.md                      # 📖 SQL documentation
├── database-setup.sql             # 🏗️ Create tables
├── migration-add-image-metadata.sql  # ⬆️ Add columns
├── storage-bucket-policies.sql    # 🔒 Secure storage
└── diagnostic-check.sql           # 🩺 Health check
```

---

Made with 💚 for a sustainable Telangana
