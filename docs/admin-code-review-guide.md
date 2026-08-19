# Admin System - Code Review Guide

**Quick reference for reviewers: How to create and test SYSTEM_ADMIN functionality**

---

## What is a SYSTEM_ADMIN?

A super-user that can view ALL organizations, users, and requests across the entire system. Not bound to any organization.

---

## 🚀 Quick Start: Create Your First Admin

### Method 1: CLI Script (Easiest for Testing)

```powershell
# Windows PowerShell
$env:MONGODB_URI = "mongodb+srv://mashiahnoya_db_user:fAkMbc97ed0mruqU@agentapprovaldb.nfakgtz.mongodb.net/agentRequestDB?retryWrites=true&w=majority"
npm run seed:admin
```

**Prompts you'll see:**
1. `Admin email:` → Enter: `reviewer@test.com`
2. `Admin password:` → Enter: `TestAdmin123!` (hidden with *)
3. `Confirm password:` → Enter: `TestAdmin123!` (hidden with *)
4. `Admin name:` → Enter: `Code Reviewer` (or press Enter for default)

**Result:** Admin created instantly, ready to login.

---

### Method 2: Auto-Seed (Already Configured)

If you just run `npm run dev`, an admin is automatically created on first connection:

- **Email**: `auto-admin@system.com`
- **Password**: `AutoSeedPass123!`

(See lines 24-26 in `.env.local`)

---

### Method 3: Use Existing Test Admins

Three admins are already set up in this codebase:

| Email | Password | Notes |
|-------|----------|-------|
| `admin@system.com` | `t=pSxbrR+5n^d-!B9DdV` | Pre-inserted in DB |
| `ad@sys.com` | `admin123` | Created via CLI |
| `auto-admin@system.com` | `AutoSeedPass123!` | Auto-created on startup |

---

## 🔐 How to Login as Admin

### Option A: Admin-specific login page
1. Go to: `http://localhost:3000/admin/login`
2. Enter email and password
3. Click "כניסה" (Login)

### Option B: Regular login page
1. Go to: `http://localhost:3000/login`
2. **Leave "שם ארגון" (Organization Name) field EMPTY**
3. Enter admin email and password
4. Click "כניסה" (Login)

**Important:** If you enter an organization name, you'll be logged in as a regular user, not admin!

---

## 🎯 What Can You Test as Admin?

After logging in, you'll see a **purple banner** at the top: `🛡️ SYSTEM ADMIN`

### 1. View All Organizations (`/admin`)

**What you see:**
- Table of ALL organizations in the system
- User count for each org
- Creation dates
- Pagination (10 orgs per page)

**Test it:**
```
1. Go to: http://localhost:3000/admin
2. You should see: TechFlow Solutions, TestOrg, etc.
3. Total shown at bottom
4. Click next/previous to test pagination (if >10 orgs)
```

---

### 2. View Users by Organization

**What you see:**
- Click "צפייה במשתמשים" (View Users) button
- See all users in that organization
- Name, email, role, status, creation date
- Read-only (admin cannot edit/delete users)

**Test it:**
```
1. On /admin page, click blue "צפייה במשתמשים" button on any org
2. You see a table of users (CISO, Managers, Employees)
3. Click "חזרה לרשימה" (Back to List) to return
```

---

### 3. View Requests by Organization (NEW FEATURE)

**What you see:**
- Click "צפייה בבקשות" (View Requests) button
- See all agent requests for that organization
- Agent name, submitter, status, agent level, date
- Pagination (5 requests per page)

**Test it:**
```
1. On /admin page, click green "צפייה בבקשות" button on any org
2. You see up to 5 requests
3. Use arrow buttons to navigate pages (if >5 requests)
4. Click "חזרה לרשימה" to return
5. Try an org with 0 requests → shows "אין בקשות בארגון זה"
```

---

### 4. Impersonate Roles (For Testing)

**What you see:**
- Green "Switch Org View" button in top-right
- Allows testing different user roles without re-logging

**Test it:**
```
1. Click "Switch Org View" button
2. Select an organization and role (CISO, Manager, Employee)
3. Dashboard now shows data as if you were that role
4. Click "Exit Test Mode" to return to admin view
```

---

## 📊 Test Scenario: Full Admin Workflow

### Step-by-Step Test (5 minutes)

```
1. CREATE ADMIN
   → Run: npm run seed:admin
   → Email: mytest@admin.com
   → Password: Admin123!
   
2. LOGIN
   → Go to: /admin/login
   → Enter email/password
   → Should redirect to /admin
   
3. CHECK PURPLE BANNER
   → Top of page shows: 🛡️ SYSTEM ADMIN
   → If missing, you're not logged in as admin
   
4. VIEW ORGS
   → Should see table with at least 1 org (TechFlow Solutions)
   → Check total count at bottom
   
5. VIEW USERS
   → Click blue "צפייה במשתמשים" on first org
   → Should see users (Sarah, James, Maria, etc.)
   → Click back button
   
6. VIEW REQUESTS (NEW)
   → Click green "צפייה בבקשות" on first org
   → Should see requests (or empty state if 0)
   → Test pagination if >5 requests
   → Click back button
   
7. TEST ROLE SWITCHING
   → Click "Switch Org View" (green button top-right)
   → Select TechFlow Solutions → CISO
   → Dashboard changes to CISO view
   → Click "Exit Test Mode"
   
8. LOGOUT
   → Click "התנתקות" (Logout)
   → Redirected to login page
```

---

## 🔍 What to Look For (Code Review Checklist)

### Security
- [ ] Admin has `organizationId: null` in database
- [ ] Admin cannot be created through regular user registration
- [ ] Admin login requires exact role match (`SYSTEM_ADMIN`)
- [ ] Admin cannot access `/users` or `/dashboard` (org-specific pages)
- [ ] Passwords are bcrypt hashed (cost 12)

### Data Isolation
- [ ] Admin can view ALL organizations
- [ ] Admin can view users from ANY organization
- [ ] Admin can view requests from ANY organization
- [ ] Regular users CANNOT see other orgs' data
- [ ] API `/api/requests?organizationId=X` filters correctly

### UI/UX
- [ ] Purple banner visible when logged in as admin
- [ ] Two buttons per org: blue (users) + green (requests)
- [ ] Pagination works (10 orgs, 5 requests per page)
- [ ] Back buttons navigate correctly
- [ ] Empty states show appropriate messages
- [ ] Hebrew RTL text displays correctly

### Email System (NEW)
- [ ] Temporary passwords sent via email (if SMTP configured)
- [ ] Temporary passwords printed to terminal (always, as backup)
- [ ] User creation succeeds even if email fails
- [ ] Email template is bilingual (Hebrew + English)

---

## 🐛 Common Issues & Solutions

### "Cannot read organizationId" error
**Cause:** User has no organizationId in database  
**Fix:** Check MongoDB - admin must have `organizationId: null`, regular users must have valid `organizationId`

### Admin can't see any orgs
**Cause:** No organizations registered yet  
**Fix:** Register an org at `/register` first

### Purple banner not showing
**Cause:** Not logged in as SYSTEM_ADMIN  
**Fix:** 
1. Check you're at `/admin/login` not `/login`
2. Verify organization field is EMPTY on `/login`
3. Check MongoDB: user role must be exactly `"SYSTEM_ADMIN"`

### Requests view shows 404
**Cause:** API route missing organizationId filter  
**Fix:** Already implemented - `GET /api/requests?organizationId=X`

---

## 📁 Key Files to Review

```
Authentication & Authorization:
├── app/api/auth/[...nextauth]/route.ts    # NextAuth handler
├── lib/auth/auth-options.ts               # Session config
├── lib/auth/permissions.ts                # Role checks
└── lib/auth/session.ts                    # Session helpers

Admin System:
├── scripts/seed-admin.ts                  # CLI seed tool
├── lib/db/seed-admin.ts                   # Auto-seed on startup
├── app/admin/login/page.tsx               # Admin login page
├── app/admin/page.tsx                     # Admin dashboard wrapper
└── components/admin/AdminDashboard.tsx    # Admin UI (orgs/users/requests)

API Routes:
├── app/api/organizations/route.ts         # List all orgs (admin only)
├── app/api/users/route.ts                 # Users API (org-scoped)
└── app/api/requests/route.ts              # Requests API (org-scoped)

Email System (NEW):
├── lib/email/send.ts                      # Email sending utility
├── lib/email/templates/temp-password.ts   # HTML template
└── .env.local (lines 28-49)               # SMTP configuration
```

---

## 🎓 Summary for Reviewers

**What was added:**
1. ✅ SYSTEM_ADMIN role with system-wide access
2. ✅ Three ways to create admin (CLI, auto-seed, manual)
3. ✅ Admin panel at `/admin` with org list
4. ✅ Drill-down views: users and requests per org
5. ✅ Multi-tenancy with complete data isolation
6. ✅ Email system for temporary passwords
7. ✅ Pagination throughout (10 orgs, 5 requests)

**How to test:**
1. Create admin: `npm run seed:admin`
2. Login: `/admin/login` with admin credentials
3. View: Organizations → Users → Requests
4. Verify: Purple banner, two buttons per org, pagination works

**Security notes:**
- Admins are isolated from orgs (`organizationId: null`)
- Passwords bcrypt-hashed
- Multi-tenant data completely isolated
- Email sending is fire-and-forget (doesn't block user creation)

---

**Questions? Check:**
- Full guide: `docs/admin-setup.md`
- Testing scenarios: `docs/testing-guide.md` (Part 7)
- README: Lines 480-607 (Admin Access section)
