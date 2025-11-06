# ⚡ Webhook Failing - Quick Fix (2 Minutes)

## 🚨 Your webhook shows FAIL - 2 in Clerk Dashboard

---

## ✅ Quick Fix (Do These In Order)

### **1. Run Diagnostic** (30 seconds)
```bash
node check-webhook-setup.js
```

This will tell you exactly what's wrong!

---

### **2. Fix Missing Webhook Secret** (Most Common!)

**Create/Update `.env.local` file:**

Location: `c:\Users\saich\Desktop\film\web\.env.local`

```bash
# Copy your secret from Clerk Dashboard → Webhooks → Your endpoint
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Copy from Supabase Dashboard → Settings → API → service_role
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxxxxxxxxxxxxx
```

**Get secrets:**
- Clerk: https://dashboard.clerk.com → Webhooks → Your endpoint → Copy **Signing Secret**
- Supabase: https://supabase.com/dashboard → Project → Settings → API → Copy **service_role** key

---

### **3. Restart Server**
```bash
# Press Ctrl+C to stop
npm run dev
```

---

### **4. Update Webhook URL** (If using ngrok)

**Terminal 1: Start ngrok**
```bash
ngrok http 3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

**In Clerk Dashboard:**
1. Go to: Webhooks → Your endpoint → Edit
2. Update URL: `https://YOUR_NGROK_URL.ngrok-free.app/api/webhooks/clerk`
3. Save

---

### **5. Test It**

**Option A: From Clerk Dashboard**
- Webhooks → Your endpoint → Testing → Send Example
- Should see: 200 OK

**Option B: Sign up a test user**
```
1. Go to: http://localhost:3000/sign-up
2. Sign up
3. Check terminal for: ✅ User created successfully
```

---

## 🔍 Check Terminal Logs

**Success looks like:**
```
🔔 WEBHOOK RECEIVED!
Webhook event type: user.created
🆕 Creating user in Supabase: { id: 'user_2xxx', email: 'test@example.com', name: 'Test User' }
✅ User created successfully in Supabase: user_2xxx
```

**Errors to watch for:**

| Error | Fix |
|-------|-----|
| `CLERK_WEBHOOK_SECRET is not set` | Add to `.env.local` |
| `Cannot find module 'svix'` | Run: `npm install svix` |
| `relation 'User' does not exist` | Run SQL setup: `/sql/complete-database-setup.sql` Section 1 |
| No logs at all | Check ngrok URL in Clerk Dashboard |

---

## 📋 Checklist

- [ ] `.env.local` file exists
- [ ] `CLERK_WEBHOOK_SECRET=whsec_xxx` is in `.env.local`
- [ ] `SUPABASE_SERVICE_ROLE_KEY=eyJxxx` is in `.env.local`
- [ ] Dev server restarted after adding env variables
- [ ] ngrok running (`ngrok http 3000`)
- [ ] Clerk webhook URL matches ngrok URL
- [ ] URL ends with `/api/webhooks/clerk`

---

## 🆘 Still Failing?

1. **Run diagnostic:** `node check-webhook-setup.js`
2. **Check Clerk logs:** Dashboard → Webhooks → Logs → Click failed attempt
3. **Read full guide:** [`docs/WEBHOOK_FAILING_FIX.md`](docs/WEBHOOK_FAILING_FIX.md)

---

**Most common issue:** Wrong or missing webhook secret! Check `.env.local` first! 🎯
