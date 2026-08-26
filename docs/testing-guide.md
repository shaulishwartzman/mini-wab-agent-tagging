# AI Governance Platform - Complete Testing Guide

**Fresh walkthrough with clear examples - perfect for code review demonstrations**

---

## Prerequisites

✅ **Required**:
- MongoDB Atlas connected
- `npm run dev` running (keep terminal visible for passwords)
- Browser at http://localhost:3000

✅ **Optional (for email testing)**:
- SMTP configured in `.env.local`
- If not configured, passwords print to terminal only

---

## 🚀 Complete Testing Walkthrough (Start to Finish)

### What You'll Test
1. ✅ Organization registration + First CISO
2. ✅ Password change on first login
3. ✅ CISO creates Manager & Employee  
4. ✅ Manager creates users
5. ✅ Employee submits request
6. ✅ CISO routes to Manager
7. ✅ Manager recommends
8. ✅ CISO final approval
9. ✅ Admin system access
10. ✅ Email delivery (if configured)

**Total time**: ~15 minutes

---

## Part 1: Create Your Organization & First CISO

### Step 1: Register Organization + First CISO

**Go to**: http://localhost:3000

**Click**: "רישום ארגון" button

**Fill in**:
```
Organization Name: TechFlow Solutions
CISO Name:        Rachel Martinez
CISO Email:       rachel.martinez@techflow.io
```

**Click**: "רישום ארגון"

**✅ Expected Result**:
- Success message: "הארגון נרשם בהצלחה..."
- **Temporary Password Delivery**:
  - **Email** (if SMTP configured): Check `rachel.martinez@techflow.io` inbox
  - **Terminal** (always printed as backup): Check `npm run dev` output

**Terminal output**:
```
======================================================================
🏢 NEW ORGANIZATION REGISTERED - CISO TEMPORARY PASSWORD
======================================================================
Organization: TechFlow Solutions
Slug:         techflow-solutions
CISO Email:   rachel.martinez@techflow.io
----------------------------------------------------------------------
📋 TEMPORARY PASSWORD: Xm9$pL4@wN7!
----------------------------------------------------------------------
======================================================================
```

**← COPY THIS PASSWORD!**

**Verify in MongoDB Atlas**:
1. Go to Browse Collections
2. Database: `agentRequestDB`
3. Collection: `organizations`
   - Should see: `TechFlow Solutions` with slug `techflow-solutions`
4. Collection: `users`
   - Should see: `rachel.martinez@techflow.io` with role `CISO`

---

### Step 2: First Login as CISO

**Click**: "עבור להתחברות" (or go to `/login`)

**Login**:
```
Organization Name: TechFlow Solutions
Email:            rachel.martinez@techflow.io
Password:         Xm9$pL4@wN7!    (from terminal)
```

**You're forced to change password**:
```
Current Password: Xm9$pL4@wN7!
New Password:     RachelCISO2024!
Confirm:          RachelCISO2024!
```

**Click**: "שנה סיסמה"

**✅ Expected Result**:
- Redirected to `/dashboard`
- Top bar shows: "**Rachel Martinez · TechFlow Solutions**"
- Three tabs visible: הגשת בקשה | הבקשות שלי | ממתין לטיפולי
- Buttons: [הגדרות נתיב ירוק] [ניהול משתמשים] [התנתקות]

---

## Part 2: CISO Creates Manager & Employee

### Step 3: Create Manager

**Click**: "ניהול משתמשים" button (you're still logged in as Rachel)

**You see**:
- Page title: "ניהול משתמשים - TechFlow Solutions"
- Current users table with 1 user (Rachel)
- Button: "+ הוספת משתמש"

**Click**: "+ הוספת משתמש"

**Fill in**:
```
Email:     james.kim@techflow.io
Full Name: James Kim
Role:      מנהל (MANAGER)
```

**Click**: "צור משתמש"

**✅ Expected Result**:
- Success banner: "המשתמש Test Manager נוצר בהצלחה..."
- **Temporary Password**:
  - Check email: `james.kim@techflow.io` (if SMTP configured)
  - Check terminal: printed as backup, e.g.: `Qr5#hT8@mK2!`
- Table now shows 2 users

**Terminal output**:
```
======================================================================
🔑 NEW USER CREATED - TEMPORARY PASSWORD
======================================================================
Organization: TechFlow Solutions
User Email:   james.kim@techflow.io
User Name:    James Kim
Role:         MANAGER
----------------------------------------------------------------------
📋 TEMPORARY PASSWORD: Qr5#hT8@mK2!
----------------------------------------------------------------------
Created By:   rachel.martinez@techflow.io
======================================================================
```

**Copy the Manager's temp password** (from email or terminal)

---

### Step 4: Create Employee

**Click**: "+ הוספת משתמש"

**Fill in**:
```
Email:     maria.santos@techflow.io
Full Name: Maria Santos
Role:      עובד (EMPLOYEE)
```

**Click**: "צור משתמש"

**✅ Expected Result**:
- Success message shown
- **Check terminal** for password:

```
======================================================================
🔑 NEW USER CREATED - TEMPORARY PASSWORD
======================================================================
Organization: TechFlow Solutions
User Email:   maria.santos@techflow.io
User Name:    Maria Santos
Role:         EMPLOYEE
----------------------------------------------------------------------
📋 TEMPORARY PASSWORD: Vn3@bD9$fL6!
----------------------------------------------------------------------
Created By:   rachel.martinez@techflow.io
======================================================================
```

**Copy the Employee's temp password** (from email or terminal)

**Verify**: User table now shows 3 users (CISO, Manager, Employee)

**Click**: "חזרה ללוח הבקרה"

---

## Part 3: Manager First Login

### Step 5: Logout and Login as Manager

**Click**: "התנתקות" (red logout button)

**You're redirected to `/login`**

**Login as James**:
```
Organization Name: TechFlow Solutions
Email:            james.kim@techflow.io
Password:         Qr5#hT8@mK2!    (from Step 3 terminal)
```

**Forced to change password**:
```
Current Password: Qr5#hT8@mK2!
New Password:     JamesManager#99
Confirm:          JamesManager#99
```

**✅ Expected Result**:
- Redirected to `/dashboard`
- Top bar: "**James Kim · TechFlow Solutions**"
- Buttons: [ניהול משתמשים] [התנתקות]
- Three tabs: הגשת בקשה | הבקשות שלי | ממתין להמלצתי

**Note James's password for later**: `JamesManager#99`

---

### Step 6: Verify Manager Can Manage Users

**Click**: "ניהול משתמשים"

**Verify**:
- You see all 3 users (Rachel, James, Maria)
- "+ הוספת משתמש" button is present
- Manager can create MANAGER and EMPLOYEE roles (not CISO)

**Click**: "חזרה ללוח הבקרה"

---

## Part 4: Employee First Login & Submit Request

### Step 7: Logout and Login as Employee

**Click**: "התנתקות"

**Login as Maria**:
```
Organization Name: TechFlow Solutions
Email:            maria.santos@techflow.io
Password:         Vn3@bD9$fL6!    (from Step 4 terminal)
```

**Forced to change password**:
```
Current Password: Vn3@bD9$fL6!
New Password:     MariaSales2024!
Confirm:          MariaSales2024!
```

**✅ Expected Result**:
- Dashboard as Employee
- Top bar: "**Maria Santos · TechFlow Solutions**"
- **Only 1 button**: [התנתקות] - NO user management access
- **2 tabs only**: הגשת בקשה | הבקשות שלי

**Note Maria's password**: `MariaSales2024!`

---

### Step 8: Employee Submits Request

**Default tab is "הגשת בקשה"**

**Fill the form**:
```
Agent Name: Sales Assistant Bot
Purpose: Automated customer inquiry responses and lead qualification

Questions:
- Autonomy:      A2 - Autonomous
- Architecture:  B1 - Public/SaaS LLM  
- Capabilities:  C2 - Write/Modify  ← This breaks green path!
- Management:    M1 - Isolated System

Governance (fill any text):
- Owner:     Sales Director
- Tech:      DevOps Team
- Approver:  VP of Sales
- Monitoring: Daily automated logs
```

**Click**: "שמור בקשה"

**✅ Expected Result**:
- Success message: "הבקשה נשלחה לאישור CISO"
- Request is now in MongoDB with status `PENDING_CISO`

---

### Step 9: View Your Request

**Click**: "הבקשות שלי" tab

**You see**:
- "Sales Assistant Bot" request
- Badge: "ממתין לאישור CISO" (orange/yellow)
- Submitted by: Maria Santos
- Agent level: A2-B1-C2-M1
- **NO action buttons** (employees cannot approve)

---

## Part 5: CISO Reviews & Routes to Manager

### Step 10: Login as CISO

**Click**: "התנתקות"

**Login as Rachel**:
```
Organization Name: TechFlow Solutions
Email:            rachel.martinez@techflow.io
Password:         RachelCISO2024!    (from Step 2)
```

**Dashboard - Default tab "ממתין לטיפולי"**

**You see**:
- 1 request: "Sales Assistant Bot" by Maria Santos
- **Expand the card** (click it)
- Full questionnaire visible
- Buttons: **אשר** | **דחה** | **העבר להתייעצות עם מנהל**

---

### Step 11: Route to Manager

**Click**: "העבר להתייעצות עם מנהל"

**Modal appears**:
- Dropdown shows: "James Kim" (the only manager)
- Optional note field

**Select**: "James Kim"

**Add note** (optional): "נא לבדוק השפעה על תהליכי מכירות"

**Click**: Confirm button

**✅ Expected Result**:
- Request disappears from "ממתין לטיפולי"
- Status changed to `PENDING_MANAGER`
- Assigned to James

**Verify**: Click "בקשות פעילות" tab
- Request still visible (because it's not terminal status)
- Shows: "ממתין להמלצת מנהל"

---

## Part 6: Manager Reviews & Recommends

### Step 12: Login as Manager

**Click**: "התנתקות"

**Login as James**:
```
Organization Name: TechFlow Solutions
Email:            james.kim@techflow.io
Password:         JamesManager#99    (from Step 5)
```

---

### Step 13: View Routed Request

**Click**: "ממתין להמלצתי" tab

**You see**:
- "Sales Assistant Bot" request
- CISO's routing note: "נא לבדוק השפעה על תהליכי מכירות"
- Full questionnaire details
- Buttons: **המלץ לאישור** | **המלץ לדחייה**

**Click**: "המלץ לאישור"

**Modal appears** with note field

**Add recommendation note**: "בדקתי את השפעת הסיכון, מומלץ לאשר עם מגבלות"

**Click**: Confirm

**✅ Expected Result**:
- Request disappears from "ממתין להמלצתי"
- Returns to CISO inbox for final decision
- Manager's recommendation saved

---

## Part 7: CISO Final Decision

### Step 14: Login as CISO Again

**Click**: "התנתקות"

**Login as Rachel**:
```
Organization Name: TechFlow Solutions
Email:            rachel.martinez@techflow.io
Password:         RachelCISO2024!
```

**Go to**: "ממתין לטיפולי" tab

**You see**:
- "Sales Assistant Bot" is back in inbox
- Manager's recommendation badge visible
- Manager's note: "בדקתי את השפעת הסיכון, מומלץ לאשר עם מגבלות"
- Buttons: **אשר** | **דחה**

---

### Step 15: Final Approval

**Click**: "אשר"

**Modal with final notes** (optional)

**Add final note** (optional): "מאושר בהתאם להמלצת המנהל"

**Click**: Confirm

**✅ Expected Result**:
- Request approved!
- Status: `APPROVED`
- Disappears from "ממתין לטיפולי"

**Verify**:
- Go to "בקשות פעילות" tab → should NOT show (it's now terminal)
- Check Maria's "הבקשות שלי" → shows as "מאושר" (green badge)

---

## Part 8: Admin Access (System Administrator)

### Step 16: Create Admin

**Open NEW PowerShell terminal** (keep `npm run dev` running):

```powershell
$env:MONGODB_URI = "mongodb+srv://mashiahnoya_db_user:fAkMbc97ed0mruqU@agentapprovaldb.nfakgtz.mongodb.net/agentRequestDB?retryWrites=true&w=majority"
npm run seed:admin
```

**Follow prompts**:
```
Admin email: admin@techflow-system.com
Admin password: TechFlowAdmin#2024
Confirm password: TechFlowAdmin#2024
Admin name (default: System Admin): System Administrator
```

**Note**: Password prompts are hidden (show asterisks). Type the **same** password twice.

**✅ Expected Result**:
```
══════════════════════════════════════════════════
✅ SYSTEM_ADMIN created successfully!
══════════════════════════════════════════════════

   ID:    6a85508f00ea4c626ec1e1c9        
   Email: admin@techflow-system.com       
   Name:  System Administrator

📌 Login at: /admin/login
   (or /login with organization field empty)
```

---

### Step 17: Login as Admin

**Logout from current session**

**Go to**: http://localhost:3000/admin/login

**Login**:
```
Email:    admin@techflow-system.com
Password: TechFlowAdmin#2024
```

**✅ Expected Result**:
- Redirected to `/admin`
- **Purple banner** at top: 🛡️ SYSTEM ADMIN
- Organizations table shows "TechFlow Solutions"
- Two buttons per org: 
  - Blue "צפייה במשתמשים" (View Users)
  - Green "צפייה בבקשות" (View Requests - NEW!)
- Pagination controls (10 orgs per page)

---

### Step 18: View Users (Admin)

**Click**: Blue "צפייה במשתמשים" button on TechFlow Solutions

**You see**:
- Table with 3 users:
  - Rachel Martinez (CISO)
  - James Kim (MANAGER)
  - Maria Santos (EMPLOYEE)
- Each with email, role badge, status, creation date
- **Read-only** (no edit/delete buttons)

**Click**: "← חזרה לרשימה" (Back to List)

---

### Step 19: View Requests (Admin - NEW FEATURE)

**Click**: Green "צפייה בבקשות" button on TechFlow Solutions

**You see**:
- Table with org's requests
- Columns: Agent Name | Submitted By | Status | Agent Level | Date
- "Sales Assistant Bot" request visible
- Status badge: "מאושר" (green)
- Submitted by: Maria Santos
- **Pagination**: 5 requests per page
- Arrow buttons for navigation

**Test pagination**:
- If org has >5 requests, use "הבא →" and "← הקודם" buttons
- Page indicator shows: "עמוד X מתוך Y"

**Click**: "← חזרה לרשימה"

---

### Step 20: Test Role Impersonation

**Click**: Green "Switch Org View" button (top-right)

**Modal appears**:
- Select Organization: TechFlow Solutions
- Select Role: CISO

**Click**: Confirm

**✅ Expected Result**:
- Dashboard changes to CISO view
- Purple banner changes to green: "TESTING AS: CISO"
- You see Rachel's inbox and requests
- This is for testing purposes only

**Click**: "Exit Test Mode" to return to admin panel

---

## 📋 Summary of All Credentials

**Copy this table for easy reference**:

| User | Email | Password | Role |
|------|-------|----------|------|
| Rachel Martinez | rachel.martinez@techflow.io | RachelCISO2024! | CISO |
| James Kim | james.kim@techflow.io | JamesManager#99 | MANAGER |
| Maria Santos | maria.santos@techflow.io | MariaSales2024! | EMPLOYEE |
| System Administrator | admin@techflow-system.com | TechFlowAdmin#2024 | SYSTEM_ADMIN |

**Organization Name**: `TechFlow Solutions` (use for all logins except admin)

---

## ✅ What You Just Tested

**Feature Checklist**:
- [x] Organization registration with first CISO
- [x] Email delivery for temp passwords (if configured)
- [x] Terminal backup for all passwords
- [x] Force password change on first login
- [x] Auto space trimming on all inputs
- [x] CISO creates Manager and Employee
- [x] Manager can also manage users
- [x] Employee submits request (no approval rights)
- [x] CISO routes request to Manager
- [x] Manager recommends (but can't approve)
- [x] CISO gives final approval
- [x] Full workflow: Employee → CISO → Manager → CISO → Approved
- [x] Admin views all organizations (10 per page)
- [x] Admin views users per org
- [x] Admin views requests per org (5 per page - NEW!)
- [x] Role impersonation for testing

---

## 🎯 Key Features Demonstrated

### 1. Multi-Tenancy
- Each org is completely isolated
- Users only see their org's data
- Admin sees all orgs

### 2. Role-Based Access Control (RBAC)
- **EMPLOYEE**: Submit requests, view own requests
- **MANAGER**: + Recommend on routed requests, manage users
- **CISO**: + Final approve/reject, route to manager, manage all users
- **SYSTEM_ADMIN**: View all orgs, users, requests (system-wide)

### 3. Request Lifecycle
1. Employee submits → `PENDING_CISO`
2. CISO routes → `PENDING_MANAGER` (assigned to specific manager)
3. Manager recommends → Back to CISO
4. CISO approves → `APPROVED` (terminal)

### 4. Security Features
- Bcrypt password hashing (cost 12)
- Force password change on first login
- Session-based authentication (NextAuth)
- Organization-scoped data queries
- Admin isolated from regular orgs

### 5. Email System (NEW)
- Sends temp passwords via email (if SMTP configured)
- Falls back to terminal if email fails
- Bilingual HTML template (Hebrew + English)
- Fire-and-forget (doesn't block user creation)

### 6. Admin Enhancements (NEW)
- View requests per organization
- Paginated (5 per page)
- Two buttons per org (users + requests)
- Green color for requests button

---

## 🐛 Troubleshooting

### Didn't receive temporary password email
- **Check 1**: SMTP configured in `.env.local`? (if not, check terminal only)
- **Check 2**: Check spam/junk folder
- **Check 3**: Look for warning in terminal: "SMTP not configured"
- **Fallback**: Password is always printed to terminal as backup

### Temp password not visible in terminal
- **Fix**: Make sure `npm run dev` is running in a visible terminal window
- Password appears immediately after user creation (even if email fails)

### Login fails after registering org
- **Fix**: Check MongoDB connection, verify user was created
- Copy password exactly (case-sensitive, special chars)

### Dashboard shows "not authorized"
- **Fix**: Clear cookies, logout/login again
- Check session is valid

### Admin panel empty
- **Fix**: Register at least one organization first
- Refresh the page

### Cannot see purple admin banner
- **Fix**: Login at `/admin/login`, not `/login`
- Verify user role is `SYSTEM_ADMIN` in MongoDB

### Requests view shows empty (admin)
- **Fix**: Organization has no requests yet
- Submit a request as an employee first

---

## 🎓 Next Steps

After completing these tests:

1. **Try Green Path**: Submit a request with all A1-B1-C1-M1 → should auto-approve
2. **Test Edge Cases**: Empty fields, wrong credentials, expired sessions
3. **Test Multi-Tenancy**: Create second org, verify data isolation
4. **Performance**: Create 10+ orgs, 20+ users, 50+ requests
5. **Mobile**: Test on phone/tablet (responsive layout)
6. **Email**: Configure SMTP and test email delivery
7. **Production**: Deploy to Render, test with real MongoDB Atlas

---

**Last Updated**: August 19, 2026
**Version**: 2.0 (Complete with Admin Requests View & Email System)
