# Testing Guide - AI Governance Platform

Complete step-by-step testing guide with real example credentials.

## Prerequisites

1. **MongoDB Atlas**: Ensure your cluster is running and accessible
2. **Environment**: `.env.local` is configured with:
   - `MONGODB_URI` (required)
   - `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (required)
   - `SMTP_*` variables (optional - for email delivery, see below)
3. **Dev Server**: Run `npm run dev` in a terminal (keep it visible for temp password backups)
4. **Browser**: Use Chrome/Edge in normal + incognito windows for testing multiple users

### Email Configuration (Optional)

Temporary passwords are sent via email when configured. To enable:

1. Add SMTP settings to `.env.local` (see README for Gmail setup)
2. If SMTP is not configured:
   - Passwords will only appear in the terminal
   - Check terminal output after creating users
   - Email sending will be skipped (with warning logged)

---

## Part 1: Organization Registration & First CISO

### Step 1: Visit Home Page

**URL**: http://localhost:3000

**What you see**:
- Dark landing page with "AI Governance Platform" title
- Two buttons: "התחברות" (Sign In) and "רישום ארגון" (Register Organization)
- Footer link "כניסת מנהל מערכת" (Admin Login)

### Step 2: Register New Organization

**Action**: Click "רישום ארגון" button

**URL**: http://localhost:3000/register-org

**Fill in the form**:
```
Organization Name: Test Company
CISO Name:        Test CISO
CISO Email:       ciso@testcompany.com
```

**Submit**: Click "רישום ארגון"

**Expected Result**:
- Success message: "הארגון נרשם בהצלחה..."
- **Temporary Password Delivery**:
  - **Email** (if SMTP configured): Check `sarah.chen@techflow.io` inbox
  - **Terminal** (always printed as backup): Check `npm run dev` output
- You'll see a boxed message in terminal with the temporary password, e.g.:

```
┌─────────────────────────────────────────────┐
│ NEW USER CREATED                            │
│ Email: ciso@testcompany.com                 │
│ Temporary Password: aB3$xY9#mK2!           │
│ Organization: Test Company                  │
│ Role: CISO                                  │
│ User must change password on first login.   │
└─────────────────────────────────────────────┘
```

**Copy the temporary password** (e.g., `aB3$xY9#mK2!`)

**Verify in MongoDB Atlas**:
- Database: `agentRequestDB`
- Collection: `organizations` → 1 new document with `name: "Test Company"`, `slug: "test-company"`
- Collection: `users` → 1 new document with `email: "ciso@testcompany.com"`, `role: "CISO"`, `mustChangePassword: true`

### Step 3: First Login & Force Password Change

**Action**: Click "עבור להתחברות" or navigate to http://localhost:3000/login

**URL**: http://localhost:3000/login

**Credentials**:
```
Organization Name: Test Company
Email:            ciso@testcompany.com
Password:         aB3$xY9#mK2!    (from terminal)
```

**Submit**: Click "התחברות"

**Expected Redirect**: http://localhost:3000/change-password

**What you see**:
- "שינוי סיסמה" form
- Fields for current password, new password, confirm new password

**Change Password**:
```
Current Password: aB3$xY9#mK2!
New Password:     CisoPass123!
Confirm:          CisoPass123!
```

**Submit**: Click "שמור סיסמה חדשה"

**Expected Result**:
- Success message: "הסיסמה עודכנה בהצלחה. מעבירים ללוח הבקרה…"
- Auto-redirect to http://localhost:3000/dashboard after ~2 seconds

### Step 4: CISO Dashboard View

**URL**: http://localhost:3000/dashboard

**What you see**:
- **NO purple "Admin Testing Mode" banner** (you're a regular org user)
- Top bar: "Test CISO · Test Company" (name in bold, larger font)
- Buttons: [הגדרות נתיב ירוק (green)] [ניהול משתמשים] [התנתקות (red)]
- Three tabs: **ממתין לטיפולי** | **בקשות פעילות** | **היסטוריית אישורים**
- Tab content: empty state (no requests yet)

**Verify Green Path Link**:
- Click "הגדרות נתיב ירוק" → goes to http://localhost:3000/green-path
- You can adjust auto-approval criteria (optional)
- Back to dashboard

---

## Part 2: User Management (CISO Creates Users)

### Step 5: Navigate to User Management

**Action**: Click "ניהול משתמשים" button

**URL**: http://localhost:3000/users

**What you see**:
- Header: "ניהול משתמשים"
- Your info: "Test CISO · Test Company"
- Button: "+ הוספת משתמש"
- Table: "משתמשים בארגון (1)" - shows yourself

### Step 6: Create a Manager

**Action**: Click "+ הוספת משתמש"

**Fill form**:
```
Email:     manager@testcompany.com
Full Name: Test Manager
Role:      מנהל (MANAGER)
```

**Submit**: Click "צור משתמש"

**Expected Result**:
- Success banner: "המשתמש Test Manager נוצר בהצלחה..."
- **Temporary Password**:
  - Check email: `james.kim@techflow.io` (if SMTP configured)
  - Check terminal: printed as backup, e.g.: `mN7&qP4#dK8!`
- Table now shows 2 users

**Copy the Manager's temp password** (from email or terminal)

### Step 7: Create an Employee

**Repeat Step 6 with**:
```
Email:     employee@testcompany.com
Full Name: Test Employee
Role:      עובד (EMPLOYEE)
```

**Copy the Employee's temp password** (from email or terminal)

**Verify**: User table now shows 3 users (CISO, Manager, Employee)

---

## Part 3: Test Employee Login & Submit Request

### Step 8: Logout and Login as Employee

**Action**: Click "התנתקות" (red button)

**URL**: http://localhost:3000/login

**Credentials**:
```
Organization Name: Test Company
Email:            employee@testcompany.com
Password:         [temp password from Step 7]
```

**Expected**: Forced to change password at http://localhost:3000/change-password

**New Password**: `EmployeePass123!`

**Redirected to**: http://localhost:3000/dashboard

### Step 9: Employee Dashboard View

**What you see**:
- **NO purple admin banner**
- Top bar: "Test Employee · Test Company"
- Only 2 buttons: [התנתקות (red)] (NO green path, NO user management)
- Two tabs: **הגשת בקשה** | **הבקשות שלי**
- Default tab: "הגשת בקשה" - shows the questionnaire form

### Step 10: Submit a Non-Green-Path Request

**Action**: Fill out the form with answers that will **NOT** auto-approve:

```
Agent Name: Test Agent
Purpose: Testing approval workflow

Autonomy: A2 (Autonomous - requires action)
Architecture: B1 (Public/SaaS LLM)
Capabilities: C2 (Write/Modify)
Management: M1 (Isolated System)

Governance fields: Fill in any text
```

**Submit**: Click "שמור בקשה"

**Expected Result**:
- Success message: "הבקשה נשלחה לאישור CISO"
- **NOT** "אושרה אוטומטית" (because C2 Write/Modify breaks green path)

### Step 11: View Employee's Requests

**Action**: Click "הבקשות שלי" tab

**What you see**:
- Your submitted request with status badge "ממתין ל-CISO"
- No action buttons (read-only for employee)

---

## Part 4: CISO Approval Workflow

### Step 12: Logout and Login as CISO

**Action**: Logout → Login

**Credentials**:
```
Organization Name: Test Company
Email:            ciso@testcompany.com
Password:         CisoPass123!
```

**URL**: http://localhost:3000/dashboard

### Step 13: CISO Views Pending Requests

**Default tab**: "ממתין לטיפולי"

**What you see**:
- 1 request card from Test Employee
- Agent name: "Test Agent"
- Expand: Click the card to see full details
- Action buttons: **אשר** | **דחה** | **העבר להתייעצות**

### Step 14: Route to Manager (Optional Hub & Spoke)

**Action**: Click "העבר להתייעצות"

**What you see**:
- Dropdown to select manager
- Optional note field
- Choose "Test Manager"
- Add note (optional): "נא לבדוק את הסיכון העסקי"

**Submit**: Confirm

**Expected Result**:
- Request disappears from "ממתין לטיפולי"
- Still visible in "בקשות פעילות" (because it's not terminal)

---

## Part 5: Manager Recommendation

### Step 15: Login as Manager

**Action**: Logout → Login

**Credentials**:
```
Organization Name: Test Company
Email:            manager@testcompany.com
Password:         [set during first login]
```

**URL**: http://localhost:3000/dashboard

### Step 16: Manager Dashboard View

**What you see**:
- Top bar: "Test Manager · Test Company"
- Buttons: [ניהול משתמשים] [התנתקות]
- Three tabs: **הגשת בקשה** | **הבקשות שלי** | **ממתין להמלצתי**

**Action**: Click "ממתין להמלצתי" tab

**What you see**:
- The request routed from CISO
- CISO's note visible
- Action buttons: **המלץ לאישור** | **המלץ לדחייה**

### Step 17: Manager Recommends Approval

**Action**: Click "המלץ לאישור"

**Optional**: Add your own note: "הסיכון מקובל, ממליץ לאשר"

**Submit**: Confirm

**Expected Result**:
- Request disappears from "ממתין להמלצתי"
- Returns to CISO's inbox

---

## Part 6: Final CISO Decision

### Step 18: Login as CISO Again

**Credentials**: Same as Step 12

**Action**: Go to "ממתין לטיפולי" tab

**What you see**:
- Request is back with manager's recommendation visible
- Manager's note: "הסיכון מקובל, ממליץ לאשר"
- Action buttons: **אשר** | **דחה**

### Step 19: Final Approval

**Action**: Click "אשר"

**Expected Result**:
- Request disappears from "ממתין לטיפולי"
- Moves to "היסטוריית אישורים" tab

**Action**: Click "היסטוריית אישורים"

**What you see**:
- Request with status "מאושר"
- **NO action buttons** (view-only)
- Full routing history visible

---

## Part 7: System Admin Access

### Step 20: Create SYSTEM_ADMIN

**Method 1 - CLI** (Recommended for testing):

Open a **new terminal** (keep `npm run dev` running):

**PowerShell**:
```powershell
$env:MONGODB_URI = "mongodb+srv://username:password@cluster.mongodb.net/agentRequestDB?retryWrites=true&w=majority"
npm run seed:admin
```

**Follow prompts**:
```
Admin email: admin@system.com
Admin password: AdminPass123!
Confirm password: AdminPass123!
Admin name (default: System Admin): System Admin
```

**Note**: Password prompts are hidden (show asterisks). Type the **same** password twice.

**Or use auto-seed** (add to `.env.local` and restart dev server):
```env
SEED_ADMIN_EMAIL=admin@system.com
SEED_ADMIN_PASSWORD=AdminPass123!
SEED_ADMIN_NAME=System Admin
```

### Step 21: Admin Login

**URL**: http://localhost:3000/admin/login (or http://localhost:3000/login with empty org field)

**Credentials**:
```
Email:    admin@system.com
Password: AdminPass123!
```

**Submit**: Click "התחברות"

**Expected Redirect**: http://localhost:3000/admin

### Step 22: Admin Panel View

**URL**: http://localhost:3000/admin

**What you see**:
- Header: "לוח בקרה - מנהל מערכת"
- Your info: "System Admin · admin@system.com"
- Navigation buttons: [לוח הבקרה] [התנתקות (red)]
- Section: "ארגונים"
- Table showing all organizations (Test Company + any others)
- Column: "פעולות" with "משתמשים" button

**Action**: Click "משתמשים" for Test Company

**What you see**:
- List of all users in Test Company (CISO, Manager, Employee)
- Back button: "← חזרה לרשימה"

### Step 23: Admin Dashboard with Impersonation

**Action**: Click "לוח הבקרה" button

**URL**: http://localhost:3000/dashboard

**What you see**:
- **Purple banner**: "Admin Testing Mode (Impersonating role)"
- Dropdown: "View as: Test Employee (EMPLOYEE)"
- Try switching: EMPLOYEE → MANAGER → CISO
- Tabs change based on selected role
- Actual user shown in top bar

**Test**:
- Select CISO → See CISO tabs
- Select Employee → See Employee tabs (form + my requests)

---

## Part 8: Multi-Org Isolation Test

### Step 24: Register Second Organization

**Action**: Logout → Home → "רישום ארגון"

**Credentials**:
```
Organization Name: Second Corp
CISO Name:        Second CISO
CISO Email:       ciso@secondcorp.com
```

**Copy temp password** from terminal

### Step 25: Verify Isolation

**Login as Second CISO** (after changing password)

**Expected**:
- Dashboard shows **zero requests** (not Test Company's requests)
- User management shows only 1 user (yourself)

**Try cross-org login** (should fail):
```
Organization Name: Test Company
Email:            ciso@secondcorp.com
Password:         [second CISO password]
```

**Expected**: Login error "אימייל או סיסמה שגויים"

**As Admin**:
- Admin panel shows **both organizations**
- Can drill into users for each separately
- Each org has isolated data

---

## Quick Test Checklist

Use these to verify everything works:

**Authentication & Navigation**:
- [ ] Logged-out `/dashboard` redirects to login
- [ ] CISO/Manager/Employee see **NO purple banner**
- [ ] SYSTEM_ADMIN sees **purple impersonation banner**
- [ ] Admin can navigate `/admin` ↔ `/dashboard`
- [ ] Admin can logout from `/admin` page
- [ ] Logout works and returns to login

**UI Polish**:
- [ ] User name + org are **bold, 16px** (prominent)
- [ ] Green path button has **green border + text**
- [ ] Logout button is **red and separated**
- [ ] Button order makes sense (actions left, logout right)
- [ ] No visual clutter or weird spacing

**Role Permissions**:
- [ ] Employee cannot access `/users` or `/admin`
- [ ] Manager can access `/users`, cannot access `/admin`
- [ ] CISO can access `/users` and green path
- [ ] Admin can access everything

**Multi-Tenancy**:
- [ ] Each org sees only its own users
- [ ] Each org sees only its own requests
- [ ] Cross-org login fails

---

## Troubleshooting

**Issue**: Didn't receive temporary password email
- **Check 1**: SMTP configured in `.env.local`? (if not, check terminal only)
- **Check 2**: Check spam/junk folder
- **Check 3**: Look for warning in terminal: "SMTP not configured"
- **Fallback**: Password is always printed to terminal as backup

**Issue**: Temp password not visible in terminal
- **Fix**: Make sure `npm run dev` is running in a visible terminal window
- Password appears immediately after user creation (even if email fails)

**Issue**: Login fails after registering org
- **Fix**: Check MongoDB connection, verify user was created
- Copy password exactly (case-sensitive, special chars)

**Issue**: Dashboard shows "not authorized"
- **Fix**: Clear cookies, logout/login again
- Check session is valid

**Issue**: Admin panel empty
- **Fix**: Register at least one organization first
- Refresh the page

**Issue**: Cannot see purple admin banner
- **Fix**: Login at `/admin/login`, not `/login`
- Verify user role is `SYSTEM_ADMIN` in MongoDB

---

## Next Steps

After completing these tests:

1. **Try Green Path**: Submit a request with all A1-B1-C1-M1 → should auto-approve
2. **Test Edge Cases**: Empty fields, wrong credentials, expired sessions
3. **Performance**: Create 10+ orgs, 20+ users, 50+ requests
4. **Mobile**: Test on phone/tablet (responsive layout)
5. **Production**: Deploy to Render, test with real MongoDB Atlas

---

**Last Updated**: August 19, 2026
**Version**: 1.0 (User Management MVP Complete)
