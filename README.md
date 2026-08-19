# AI Governance & Agent Risk Assessment Platform

## Overview

This platform enables organizations to identify, classify, govern, and assess risks associated with AI systems, AI agents, and AI-powered applications operating within the enterprise.

The system provides a structured questionnaire that maps AI solutions according to governance, autonomy, architecture, permissions, and operational management models. Based on the responses, the platform automatically generates a governance profile and risk assessment card.

The solution is designed to support:

- CISO teams
- Information Security departments
- AI Governance programs
- Risk Management teams
- Compliance and Regulatory functions
- Product and Technology owners

---

## Key Features

### AI System Classification

Classifies AI systems across four dimensions:

- Autonomy & Decision Making
- Model Architecture & Data Exposure
- Capabilities & Permissions
- Organizational Management Structure

---

### Governance Mapping

Governance information including:

- Business Owner
- Technical Owner
- Accountable Owner
- Change Approval Authority
- Oversight Mechanism
- Oversight Responsibility

---

### Risk Scenario Identification

Automatically maps potential risks based on the selected architecture and operating model.

Examples include:

- Prompt Injection Risks
- Hallucination Risks
- Excessive Privilege Risks
- Autonomous Decision Risks
- Multi-Agent Coordination Risks
- Orchestration Layer Failures
- Data Exposure Risks

---

### Agent Inventory & Request Store (MongoDB only)

All assessment requests and approved agents are stored in **MongoDB Atlas** via `/api/requests`.

- Create / list / update / delete go through the API → Mongoose → MongoDB
- Employee “הסוכנים שלך במאגר” and all role queues load from MongoDB
- **No browser LocalStorage (or similar) for requests / agents** — that old client inventory path was removed

The only LocalStorage usage in the app is the **Admin Role Impersonation** feature (`mvp-test-role` in `RoleContext`), which allows SYSTEM_ADMIN users to test different role views. Regular users never see this feature.

---

### Request Lifecycle (MongoDB)

Server-side approval workflow for assessment requests:

- Create requests with questionnaire / AgentCard data (optionally auto-approved via green path)
- Filter inboxes by role (`assignedTo`), user (`assignedToUserId` / `submittedByUserId`), or status
- CISO hub-and-spoke: approve, reject, or route to manager; manager recommends only
- Optional CISO↔manager notes stored on the request and in `routingHistory[].notes`

---

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript

### Backend

- Next.js API Routes
- Mongoose (MongoDB ODM)

### Storage

| Store | What lives there |
| --- | --- |
| MongoDB `agentRequestDB.organizations` | Multi-tenant organizations |
| MongoDB `agentRequestDB.users` | User accounts with roles (bcrypt-hashed passwords) |
| MongoDB `agentRequestDB.agent_requests` | All assessment requests + workflow/audit fields (scoped by organizationId) |
| MongoDB `agentRequestDB.green_path_settings` | CISO green-path criteria (singleton) |
| Browser LocalStorage (`mvp-test-role`) | MVP selected role only — **not** requests |

### Hosting

- Render Web Service env: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

---

## Architecture (Data & Routing)

```text
[Employee / Manager / CISO UI]
        │  fetch / PATCH / DELETE
        ▼
 Next.js API  (/api/requests, /api/green-path-settings)
        │  connectDB()
        ▼
 MongoDB Atlas  (agentRequestDB)
   ├─ agent_requests
   └─ green_path_settings
```

**Hub-and-spoke routing (CISO is the hub):**

1. Employee submits → usually `PENDING_CISO` (or `AUTO_APPROVED` if green path passes)
2. CISO may **route** to a manager → `PENDING_MANAGER` + `assignedToUserId`
3. Manager **recommends** (approve/reject) → returns to `PENDING_CISO`; identity & optional note stay in `routingHistory`
4. CISO makes the **final** APPROVE / REJECT → terminal status; request appears in approval history

Manager never sets terminal APPROVED/REJECTED. Optional correspondence is drafted in the UI under “להתכתבות עם המנהל / ה-CISO” and saved as `reviewNotes` + `routingHistory[].notes`. Employees do not see this thread on **הבקשות שלי**.

---

## Project Structure

```text
app/
├─ layout.tsx
├─ providers.tsx               # SessionProvider + Admin RoleProvider (impersonation)
├─ page.tsx                    # Public landing (login / register-org CTAs)
├─ dashboard/
│  └─ page.tsx                 # Role-based approval dashboard
├─ login/
│  └─ page.tsx                 # Sign-in (org + email + password)
├─ register-org/
│  └─ page.tsx                 # Register organization + first CISO
├─ change-password/
│  └─ page.tsx                 # First-login / forced password change
├─ users/
│  └─ page.tsx                 # User management (CISO/MANAGER only)
├─ admin/
│  ├─ page.tsx                 # System admin panel (SYSTEM_ADMIN only)
│  └─ login/
│     └─ page.tsx              # Dedicated admin login page
├─ green-path/
│  └─ page.tsx                 # CISO Green Path settings page
└─ api/
   ├─ auth/
   │  ├─ [...nextauth]/
   │  │  └─ route.ts           # NextAuth API handler (signin/signout/session)
   │  └─ change-password/
   │     └─ route.ts           # POST change password (authenticated)
   ├─ organizations/
   │  └─ route.ts              # GET list orgs (admin), POST register org + CISO
   ├─ users/
   │  └─ route.ts              # GET list users, POST create user
   ├─ green-path-settings/
   │  └─ route.ts              # GET/PUT green path criteria
   └─ requests/
      ├─ route.ts              # POST create, GET list/filter with pagination
      └─ [id]/
         └─ route.ts           # PATCH/PUT/DELETE status transitions

proxy.ts                       # Auth route protection (Next.js 16 proxy convention)

components/
├─ auth/
│  ├─ AuthShell.tsx            # Shared auth page layout + form styles
│  ├─ LoginForm.tsx            # Credentials login form
│  ├─ AdminLoginForm.tsx       # SYSTEM_ADMIN login form
│  ├─ RegisterOrgForm.tsx      # Org + first CISO registration form
│  ├─ ChangePasswordForm.tsx   # Password change form
│  └─ SessionNav.tsx           # Dashboard sign-out + users link
├─ users/
│  └─ UserManagementClient.tsx # User list + create form (client component)
├─ admin/
│  └─ AdminDashboard.tsx       # Org list + drill-down UI (client component)
├─ AgentForm.tsx               # Assessment form (employee + manager)
├─ DashboardTabs.tsx           # Role-based tab navigation
├─ FieldHelpTooltip.tsx        # (?) hover help next to questionnaire fields
├─ GreenPathSettingsForm.tsx   # CISO checkbox editor for green path
├─ Pagination.tsx              # Prev/next pagination controls
├─ RequestAnswersPanel.tsx     # Read-only questionnaire toggle in request cards
├─ CorrespondencePanel.tsx     # Collapsible CISO↔manager note thread
├─ RequestQueue.tsx            # Paginated request list with actions
├─ RoleSwitcher.tsx            # Admin role impersonation (SYSTEM_ADMIN only)
└─ questionnaire/
   └─ fields.ts                # Questions, options, and field tooltips

lib/
├─ agent-engine/
│  └─ createAgentCard.ts       # Build AgentCard from questionnaire answers
├─ api/
│  ├─ auth.ts                  # changePassword() client helper
│  ├─ jsonResponse.ts          # jsonError / jsonOk for API routes
│  ├─ organizations.ts         # registerOrganization() client helper
│  ├─ requests.ts              # Client-side API helpers with pagination support
│  └─ greenPathSettings.ts     # fetch/save/reset green path settings
├─ auth/
│  ├─ auth-options.ts          # NextAuth Credentials config
│  ├─ password.ts              # Temp password generation + bcrypt helpers
│  ├─ permissions.ts           # canCreateUsers / canCreateRole (client-safe)
│  └─ session.ts               # getAuthSession / requireAuthUser helpers
├─ auto-approval/
│  ├─ greenPathCriteria.ts     # Default criteria + helpers
│  └─ rulesEngine.ts           # Auto-approval evaluation logic
├─ db/
│  ├─ mongodb.ts               # connectDB() — cached Mongoose connection
│  └─ seed-admin.ts            # Auto-seed SYSTEM_ADMIN from env vars
├─ errors/
│  ├─ admin.ts                 # Hebrew messages for system admin panel
│  ├─ authorization.ts         # Hebrew 403 messages for request actions
│  ├─ auth.ts                  # Hebrew messages for login / register / password / org registration
│  └─ user.ts                  # Hebrew messages for user management
├─ requests/
│  └─ transitions.ts           # Legal status transition + role authorization rules
├─ utils/
│  ├─ slugify.ts               # Organization name → login slug
│  ├─ dashboardFilters.ts      # CISO tab → queue filter presets
│  └─ requestHelpers.ts        # Status labels, colors, card conversion helpers
└─ types.ts                    # Shared types: AgentCard, RequestStatus, payloads

contexts/
└─ RoleContext.tsx             # Admin role impersonation state (SYSTEM_ADMIN feature)

models/
├─ Organization.ts             # Multi-tenant organization (collection: organizations)
├─ User.ts                     # User accounts with roles (collection: users)
├─ AgentRequest.ts             # Mongoose schema (collection: agent_requests)
└─ GreenPathSettings.ts        # Singleton settings (collection: green_path_settings)

scripts/
└─ seed-admin.ts               # CLI tool: npm run seed:admin

docs/
└─ admin-setup.md              # SYSTEM_ADMIN setup guide

.env.example                   # placeholder env vars (safe to commit)
.env.local                     # local secrets (not committed)
```

---

## Multi-Tenant Data Models

The system supports multiple organizations, each with isolated data.

### Organization (`models/Organization.ts`)

Represents a tenant in the multi-org system.

| Field | Type | Description |
| --- | --- | --- |
| `_id` | ObjectId | Unique identifier |
| `name` | String | Display name (e.g., "Hadassah Academic College") |
| `slug` | String | URL-safe identifier for login (auto-generated from name) |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

### User (`models/User.ts`)

User accounts with role-based permissions. Passwords are bcrypt-hashed.

| Field | Type | Description |
| --- | --- | --- |
| `_id` | ObjectId | Unique identifier |
| `email` | String | Login identifier (unique per organization) |
| `password` | String | Bcrypt-hashed (excluded from queries by default) |
| `name` | String | Display name |
| `role` | Enum | `EMPLOYEE`, `MANAGER`, `CISO`, or `SYSTEM_ADMIN` |
| `organizationId` | ObjectId | FK to Organization (null for SYSTEM_ADMIN) |
| `mustChangePassword` | Boolean | True for new users with temp password |
| `createdBy` | ObjectId | FK to User who created this account |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

**Indexes:**
- Compound unique: `{ email, organizationId }` — same email can exist in different orgs
- Partial unique for SYSTEM_ADMIN: `{ email }` where `organizationId: null`

### Role Permissions

| Role | Create EMPLOYEE | Create MANAGER | Create CISO | View All Orgs |
| --- | --- | --- | --- | --- |
| EMPLOYEE | No | No | No | No |
| MANAGER | Yes | Yes | No | No |
| CISO | Yes | Yes | Yes | No |
| SYSTEM_ADMIN | Yes | Yes | Yes | Yes |

### Data Isolation

- Every `AgentRequest` has a required `organizationId` field
- All API queries filter by `organizationId` from the user's session
- Users can only see data from their own organization
- `SYSTEM_ADMIN` can view across all organizations

---

## Authentication (NextAuth.js)

Multi-tenant authentication using NextAuth.js v4 with Credentials provider and JWT sessions.

### Login Flow

1. User enters: **Organization slug** + **Email** + **Password**
2. System looks up organization by slug
3. Finds user by email within that organization (compound unique per org)
4. Verifies password with bcrypt (`User.comparePassword`)
5. Creates JWT session with user + org info

**SYSTEM_ADMIN** users login with email + password only (leave organization slug empty).

Client sign-in (once login UI exists):

```ts
signIn("credentials", {
  organizationSlug: "hadassah-academic-college",
  email: "ciso@example.com",
  password: "...",
});
```

### Session Data

The session (`useSession` / `getAuthSession`) includes:

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | User's MongoDB ObjectId |
| `email` | string | User's email |
| `name` | string | Display name |
| `role` | string | EMPLOYEE, MANAGER, CISO, or SYSTEM_ADMIN |
| `organizationId` | string \| null | Org ObjectId (null for SYSTEM_ADMIN) |
| `organizationName` | string \| null | Org display name |
| `mustChangePassword` | boolean | True if temp password needs changing |

### Public Auth Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing — Sign in / Register organization (redirects signed-in users to `/dashboard`) |
| `/login` | Org name + email + password (SYSTEM_ADMIN: leave org empty) |
| `/admin/login` | Dedicated admin login page (email + password only) |
| `/register-org` | Register org + first CISO (calls `POST /api/organizations`) |
| `/change-password` | Replace temporary password; updates JWT via `session.update` |
| `/dashboard` | Authenticated approval workflow UI (SYSTEM_ADMIN sees role impersonation banner) |

Hebrew form validation / error banners live in `components/auth/*`.

### Route Protection (`proxy.ts`)

Next.js 16 uses the `proxy.ts` convention (replaces deprecated `middleware.ts`).

| Route | Access |
| --- | --- |
| `/`, `/login`, `/register-org`, `/admin/login` | Public |
| `/api/auth/*`, `/api/organizations` | Public path (handlers enforce session where needed) |
| `/dashboard`, `/green-path`, request APIs | **Authenticated** (any role) |
| `/change-password` | Authenticated (any role) |
| `/admin/*` | SYSTEM_ADMIN only |
| `/users/*` | CISO, MANAGER, SYSTEM_ADMIN |

Users with `mustChangePassword: true` are redirected to `/change-password`.

### Auth Modules

| Path | Purpose |
| --- | --- |
| `lib/auth/auth-options.ts` | NextAuth Credentials config, JWT/session callbacks |
| `lib/auth/permissions.ts` | `canCreateUsers` / `canCreateRole` (shared client + server) |
| `lib/auth/password.ts` | `generateTempPassword`, `hashPassword`, `verifyPassword` |
| `lib/auth/session.ts` | `getAuthSession`, `getAuthUser`, `requireAuthUser`, `hasRole` |
| `lib/utils/slugify.ts` | Organization name → slug (shared by login + Organization model) |
| `lib/api/auth.ts` | `changePassword()` client helper |
| `lib/api/jsonResponse.ts` | `jsonError(message, status)` / `jsonOk(body)` for API routes |
| `lib/api/organizations.ts` | `registerOrganization()` client helper |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth App Router handler (`GET` / `POST`) |
| `app/api/auth/change-password/route.ts` | Authenticated password change |
| `app/api/organizations/route.ts` | GET list orgs (admin), POST register org + CISO |
| `app/api/users/route.ts` | User management (GET list, POST create) |
| `proxy.ts` | Route protection and role-based redirects |
| `app/providers.tsx` | Wraps app in `SessionProvider` |
| `components/auth/*` | AuthShell + Login / RegisterOrg / ChangePassword forms |
| `components/users/*` | UserManagementClient (list + create form) |
| `components/admin/*` | AdminDashboard (org list + drill-down) |
| `lib/errors/admin.ts` | Hebrew admin panel messages and labels |
| `lib/errors/auth.ts` | Hebrew login / register / change-password / org-registration messages |
| `lib/errors/user.ts` | Hebrew user management messages + role labels |

### Organization Registration API

`POST /api/organizations` — Public endpoint for registering new organizations.

**Request Body:**

```json
{
  "name": "Organization Display Name",
  "cisoName": "First CISO Full Name",
  "cisoEmail": "ciso@company.com"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "organization": {
    "id": "...",
    "name": "Organization Display Name",
    "slug": "organization-display-name"
  },
  "message": "הארגון נרשם בהצלחה. סיסמה זמנית נשלחה לאימייל ה-CISO."
}
```

**Error Responses:**

| Status | Reason |
| --- | --- |
| 400 | Missing or invalid fields (name, cisoName, cisoEmail) |
| 409 | Organization slug already exists, or email already taken |
| 500 | Server error |

**MVP Note:** Temporary passwords are logged to the server console. Email integration is pending for production.

### Organizations List API (Admin Only)

`GET /api/organizations` — Protected endpoint for listing all organizations.

**Authorization:** SYSTEM_ADMIN only.

**Response (200 OK):**

```json
{
  "organizations": [
    {
      "id": "...",
      "name": "Organization Name",
      "slug": "organization-name",
      "userCount": 5,
      "createdAt": "2024-01-15T12:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

| Status | Reason |
| --- | --- |
| 401 | Not authenticated |
| 403 | Not SYSTEM_ADMIN role |
| 500 | Server error |

### System Admin Panel

The admin panel (`/admin`) provides a system-wide view for SYSTEM_ADMIN users:

**Features:**
- View all organizations with user counts
- Drill-down to view users in any organization (read-only)
- No org-specific actions in MVP (viewing only)

**Creating Admins (two methods):**

| Method | File | Use Case |
| --- | --- | --- |
| CLI Tool | `scripts/seed-admin.ts` | Development, manual setup |
| Auto-Seed | `lib/db/seed-admin.ts` | Deployments, CI/CD |

- **CLI**: Set `$env:MONGODB_URI` first (PowerShell) or `export MONGODB_URI` (Bash), then `npm run seed:admin`
- **Auto-seed**: Set `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` env vars; admin created on app startup
- See [docs/admin-setup.md](docs/admin-setup.md) for full guide with shell commands and function reference

**Login:** Use the dedicated `/admin/login` page, or go to `/login` and leave the organization name field **empty**.

**Components:**
| Path | Purpose |
| --- | --- |
| `scripts/seed-admin.ts` | CLI tool for creating admins |
| `lib/db/seed-admin.ts` | Auto-seeding from env vars |
| `app/admin/login/page.tsx` | Dedicated admin login page |
| `app/admin/page.tsx` | Server component with SYSTEM_ADMIN guard |
| `components/auth/AdminLoginForm.tsx` | Admin login form |
| `components/admin/AdminDashboard.tsx` | Client component with org list + drill-down |
| `lib/errors/admin.ts` | Hebrew labels and error messages |

### User Management API

Endpoints for managing users within an organization. Requires authentication as CISO, MANAGER, or SYSTEM_ADMIN.

#### `GET /api/users`

List all users in the caller's organization.

**Response:**

```json
{
  "success": true,
  "users": [
    {
      "id": "...",
      "email": "user@company.com",
      "name": "User Name",
      "role": "EMPLOYEE",
      "mustChangePassword": false,
      "createdAt": "2026-08-19T...",
      "updatedAt": "2026-08-19T..."
    }
  ]
}
```

SYSTEM_ADMIN can query any org via `?organizationId=<id>`.

#### `POST /api/users`

Create a new user in the caller's organization.

**Request Body:**

```json
{
  "email": "newuser@company.com",
  "name": "New User",
  "role": "EMPLOYEE"
}
```

**Role Permissions:**

| Creator Role | Can Create |
| --- | --- |
| MANAGER | EMPLOYEE, MANAGER |
| CISO | EMPLOYEE, MANAGER, CISO |
| SYSTEM_ADMIN | EMPLOYEE, MANAGER, CISO |

**Response (201 Created):**

```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "newuser@company.com",
    "name": "New User",
    "role": "EMPLOYEE",
    "mustChangePassword": true,
    "createdAt": "2026-08-19T..."
  },
  "message": "המשתמש נוצר בהצלחה. סיסמה זמנית נשלחה לאימייל."
}
```

**Error Responses:**

| Status | Reason |
| --- | --- |
| 400 | Missing or invalid fields (email, name, role) |
| 401 | Not authenticated |
| 403 | Not authorized to create users or target role |
| 409 | Email already exists in organization |
| 500 | Server error |

**MVP Note:** Temporary passwords are logged to the server console.

### User Management Page (`/users`)

Protected page for CISO and MANAGER to manage organization users.

**Features:**
- List all users with role badges and status
- Create new users (respects role creation permissions)
- Display creation date and password change status

**Access:** CISO, MANAGER, SYSTEM_ADMIN only. Others redirected to `/dashboard`.

### Environment Variables

Add to `.env.local` (see `.env.example`):

```bash
NEXTAUTH_SECRET=<random-secret-at-least-32-chars>
NEXTAUTH_URL=http://localhost:3000
```

Generate a secret: `openssl rand -base64 32` (or PowerShell: random 32 bytes as Base64). Also set `NEXTAUTH_*` on Render for production.

---

## Request Lifecycle API

Server-side persistence for AI agent assessment requests. The questionnaire UI saves directly to MongoDB via these endpoints.

### Modules

| Path | Purpose |
| --- | --- |
| `lib/types.ts` | Shared enums: `RequestStatus`, `UserRole` (incl. SYSTEM_ADMIN), `RequestAction`, `OrgBoundRoles`, plus payload types |
| `lib/db/mongodb.ts` | `connectDB()` — connects using `MONGODB_URI`, caches for Next.js hot reload |
| `lib/api/requests.ts` | Client-side helpers: `createRequest()`, `fetchRequests()`, `deleteRequest()`, `applyAction()` with pagination |
| `lib/errors/authorization.ts` | Hebrew 403 messages + optional redirects (`getAuthorizationErrorInfo`) |
| `lib/utils/requestHelpers.ts` | Status labels, badge colors, card conversion utilities |
| `lib/utils/dashboardFilters.ts` | CISO queue view presets (`getCisoQueueView`) |
| `models/Organization.ts` | Mongoose model for multi-tenant orgs (collection: `organizations`) |
| `models/User.ts` | Mongoose model for user accounts (collection: `users`) |
| `models/AgentRequest.ts` | Mongoose model with `organizationId` (collection: `agent_requests`) |
| `lib/requests/transitions.ts` | `applyTransition()` — state machine; `isAuthorizedForAction()` — role-based auth |
| `app/api/requests/route.ts` | Collection: create + list with pagination |
| `app/api/requests/[id]/route.ts` | Item: approve / reject / route / delete |
| `components/DashboardTabs.tsx` | Role-based tab navigation |
| `components/RequestQueue.tsx` | Paginated request list with role-specific actions |
| `components/Pagination.tsx` | Pagination controls (prev/next with page indicator) |

### Status Workflow (CISO-Final)

CISO is the **final decision-maker**. Managers provide **recommendations only** and cannot approve or reject directly.

```
┌─────────────────────────────────────────────────────────────────┐
│                      EMPLOYEE SUBMITS                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                   ┌──────────┴──────────┐
                   ↓                     ↓
            Green-path criteria      Not green-path
              ALL met?                   
                   ↓                     ↓
            AUTO_APPROVED           PENDING_CISO
              (terminal)           assignedTo: CISO
                                        ↓
                         ┌──────────────┼──────────────┐
                         ↓              ↓              ↓
                      APPROVE        REJECT     ROUTE_TO_MANAGER
                         ↓              ↓              ↓
                     APPROVED       REJECTED     PENDING_MANAGER
                     (terminal)     (terminal)   assignedTo: MANAGER
                                                       ↓
                                          ┌────────────┴────────────┐
                                          ↓                         ↓
                                  RECOMMEND_APPROVE          RECOMMEND_REJECT
                                          ↓                         ↓
                                          └────────────┬────────────┘
                                                       ↓
                                               PENDING_CISO
                                            (with manager input)
                                            assignedTo: CISO
                                                       ↓
                                          ┌────────────┴────────────┐
                                          ↓                         ↓
                                       APPROVE                   REJECT
                                          ↓                         ↓
                                      APPROVED                  REJECTED
                                      (terminal)                (terminal)
```

#### State Transitions

| Current Status | Action | Next Status | assignedTo |
| --- | --- | --- | --- |
| (create) | — | PENDING_CISO | CISO |
| (create + autoApprove) | — | AUTO_APPROVED | null |
| PENDING_CISO | APPROVE | APPROVED | null |
| PENDING_CISO | REJECT | REJECTED | null |
| PENDING_CISO | ROUTE_TO_MANAGER | PENDING_MANAGER | MANAGER |
| PENDING_MANAGER | RECOMMEND_APPROVE | PENDING_CISO | CISO |
| PENDING_MANAGER | RECOMMEND_REJECT | PENDING_CISO | CISO |
| APPROVED / REJECTED / AUTO_APPROVED | any | error | — |

#### Business Rules

- **CISO is always final** — Only CISO can set APPROVED or REJECTED status
- **Manager is advisory** — Manager provides recommendations, not decisions
- **Routing is optional** — CISO routes to manager ad-hoc, not mandatory
- **Auto-approval is criteria-based** — Green-path uses closed fields only (read-only, human-in-the-loop, etc.)
- **Free text doesn't block auto-approval** — `agentPurpose` is for audit/context, not approval logic
- **Terminal = no assignee** — When APPROVED/REJECTED/AUTO_APPROVED, `assignedTo = null`
- **Role-based authorization** — API enforces `actorRole` must be authorized for the requested action (403 if not)
- **Persistence is MongoDB-only** — requests are never written to LocalStorage; delete removes the MongoDB document
- **Optional correspondence** — CISO/manager notes are optional; empty notes are allowed on every action

#### Schema Fields

**Workflow Fields:**

| Field | Type | Purpose |
| --- | --- | --- |
| `status` | Enum | PENDING_CISO, PENDING_MANAGER, AUTO_APPROVED, APPROVED, REJECTED |
| `assignedTo` | Enum / null | Which role's inbox (CISO, MANAGER, or null for terminal) |
| `assignedToUserId` | String / null | Current assignee user id (set when routed to a manager; cleared after recommend) |
| `submittedByRole` | Enum | EMPLOYEE, MANAGER, CISO |
| `submittedByUserId` | String | User ID (email) of who submitted |
| `reviewNotes` | String | Latest optional reviewer note (also stored per step in `routingHistory[].notes`) |

**Audit Trail Fields:**

| Field | Type | Purpose |
| --- | --- | --- |
| `approvedBy` | String / null | Who made final decision: `SYSTEM_AUTO_APPROVAL` or user ID |
| `resolvedAt` | Date / null | When request reached terminal status |
| `managerRecommendation` | Enum / null | `RECOMMEND_APPROVE` or `RECOMMEND_REJECT` |
| `routingHistory` | Array | Full routing chain for audit (includes who recommended via `from` + optional `notes`) |

**Auto-Approval Fields:**

| Field | Type | Purpose |
| --- | --- | --- |
| `autoApprovalEligible` | Boolean | Did request meet green-path criteria? |
| `autoApprovalReason` | String / null | Why auto-approved or why not eligible |
| `agentPurpose` | String | Free text description (for CISO context, not auto-approval) |

#### Auto-Approval Engine (Green Path)

The auto-approval engine evaluates requests against green-path criteria. If ALL criteria are met, the request is automatically approved without CISO review.

**Default Green Path Criteria (all must be met):**

| Question | Default Answer | Meaning |
| --- | --- | --- |
| Autonomy (`q1_autonomy`) | `A1` | Human-in-the-loop |
| Architecture (`q2_brain`) | `B1` | Public/SaaS LLM |
| Capabilities (`q3_capability`) | `C1` | Read-Only |
| Management (`q4_management`) | `M1` | Isolated System |

CISO can expand each dimension (multi-select) via **הגדרות נתיב ירוק** (`/green-path`). Settings are stored in MongoDB collection `green_path_settings`.

**Required Documentation Fields (must be non-empty, not editable in MVP UI):**

| Field | Purpose |
| --- | --- |
| `gov_owner` | Accountable manager |
| `gov_tech` | Technical owner |
| `gov_approver` | Change approval authority |
| `gov_monitoring` | Oversight mechanism |

**Disqualifying Conditions:**

- Any answer is `U0` (unknown/undetermined) — never allowed in settings
- Any required text field is empty
- Any closed question answer is outside the CISO-configured allowed list

**Implementation:**

```
lib/auto-approval/
├── greenPathCriteria.ts   # Defaults + getDefaultAllowedAnswers / toCustomCriteria
└── rulesEngine.ts         # evaluateForAutoApproval(answers, customCriteria?)

models/GreenPathSettings.ts
app/api/green-path-settings/route.ts
app/green-path/page.tsx
components/GreenPathSettingsForm.tsx
components/AgentForm.tsx   # Loads settings on submit, then evaluates
```

#### Green Path Settings UI (CISO)

| Item | Detail |
| --- | --- |
| Route | `/green-path` |
| Access | CISO only (Role Switcher MVP). Others see unauthorized message |
| Nav | Link **הגדרות נתיב ירוק** on main dashboard (CISO) |
| Actions | **שמור שינויים** (PUT), **אפס לברירת מחדל** (restore A1/B1/C1/M1) |
| API | `GET/PUT /api/green-path-settings` — PUT requires `actorRole: CISO` |

#### Automatic Processing on Submit (onSubmit)

The auto-approval engine runs **automatically** when the user clicks **"שמור בקשה"**.

```
User clicks "שמור בקשה"
                    ↓
            AgentForm.handleSubmit()
                    ↓
      GET /api/green-path-settings
         (fail → use code defaults)
                    ↓
  evaluateForAutoApproval(answers, customCriteria)
                    ↓
          ┌─────────┴─────────┐
          ↓                   ↓
      eligible            not eligible
          ↓                   ↓
   autoApprove: true     autoApprove: false
   AUTO_APPROVED         PENDING_CISO
```

- The form passes `autoApprove`, `autoApprovalEligible`, and `autoApprovalReason` to the API.
- The UI shows: **הבקשה אושרה אוטומטית** or **הבקשה נשלחה לאישור**.

#### Fail-Safe Defaults (מנגנון בטיחות)

| Condition | Result |
| --- | --- |
| Any deviation from allowed green-path answers | `PENDING_CISO` |
| Any "לא ידוע" (U0) answer | `PENDING_CISO` |
| Any required text field empty | `PENDING_CISO` |
| Settings fetch fails on submit | Evaluate with code defaults |
| Any error during evaluation | `PENDING_CISO` |
| All criteria met | `AUTO_APPROVED` |

**Routing History Entry:**

```typescript
{
  from: string;        // User ID (e.g., "ciso@company.com")
  fromRole: UserRole;  // "CISO" or "MANAGER"
  to: string;          // User ID or "terminal"
  toRole: UserRole;    
  action: string;      // "ROUTE_TO_MANAGER", "RECOMMEND_APPROVE", etc.
  notes: string;       // Context/reason for the action
  at: Date;            // Timestamp
}
```

### Endpoints

#### `POST /api/requests`

Create a request. Requires at least `agentName`.

```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d "{\"agentName\":\"Ops Assistant\",\"agentLevel\":\"A2-B1-C1-M1\"}"
```

Optional body fields: `answers`, `classification`, `agentLevel`, `classificationExplanation`, `governance`, `riskScenarios`, `submittedByRole`, `reviewNotes`, `autoApprove`, `submittedByUserId`, `agentPurpose`, `autoApprovalEligible`, `autoApprovalReason`.

Returns `201` + `{ success: true, request }`.

#### `GET /api/requests`

List requests (newest first). Optional filters:

| Query | Example | Effect |
| --- | --- | --- |
| `assignedTo` | `?assignedTo=MANAGER` | Role inbox filter |
| `status` | `?status=PENDING_CISO` | Status filter |

```bash
curl "http://localhost:3000/api/requests?assignedTo=CISO"
```

#### `PATCH /api/requests/:id` (or `PUT`)

Apply a workflow action with role-based authorization.

**Required fields:**

| Field | Type | Description |
| --- | --- | --- |
| `action` | string | APPROVE, REJECT, ROUTE_TO_MANAGER, RECOMMEND_APPROVE, RECOMMEND_REJECT |
| `actorRole` | string | Role of the user: CISO, MANAGER, or EMPLOYEE |
| `actorUserId` | string | User ID performing the action (for audit trail) |

**Optional fields:**

| Field | Type | Description |
| --- | --- | --- |
| `reviewNotes` | string | Optional note/question (CISO→manager on route, manager→CISO on recommend, or final decision note) |
| `targetUserId` | string | For ROUTE_TO_MANAGER: which manager to assign |

**Example request body:**

```json
{
  "action": "APPROVE",
  "actorRole": "CISO",
  "actorUserId": "ciso@company.com",
  "reviewNotes": "Looks good"
}
```

#### Role-Based Authorization

The API enforces that only authorized roles can perform specific actions:

| Role | Allowed Actions |
| --- | --- |
| CISO | APPROVE, REJECT, ROUTE_TO_MANAGER |
| MANAGER | RECOMMEND_APPROVE, RECOMMEND_REJECT |
| EMPLOYEE | (none - can only submit requests) |

**Authorization is checked before the state transition** — even if a transition would be valid, the request is rejected if the role is unauthorized.

#### API Response Codes

| Status | Meaning |
| --- | --- |
| `200` | Transition applied; returns `{ success: true, request }` |
| `400` | Invalid action, missing `actorRole`, or illegal transition |
| `403` | Role not authorized for this action |
| `404` | Request not found |
| `500` | Internal server error |

#### Validation Order

```
1. Validate action is a known RequestAction        → 400 if invalid
2. Validate actorRole is a known UserRole          → 400 if invalid/missing
3. Check role authorization (isAuthorizedForAction) → 403 if unauthorized
4. Check transition legality (applyTransition)     → 400 if illegal
5. Apply transition and save                       → 200 on success
```

**Example: CISO routes to manager**

```bash
curl -X PATCH http://localhost:3000/api/requests/<id> \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"ROUTE_TO_MANAGER\",\"actorRole\":\"CISO\",\"actorUserId\":\"ciso@company.com\",\"targetUserId\":\"manager@company.com\",\"reviewNotes\":\"Need business owner sign-off\"}"
```

**Example: Manager recommends approval**

```bash
curl -X PATCH http://localhost:3000/api/requests/<id> \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"RECOMMEND_APPROVE\",\"actorRole\":\"MANAGER\",\"actorUserId\":\"manager@company.com\",\"reviewNotes\":\"Verified with legal, low risk\"}"
```

**Example: Unauthorized action (403 response)**

```bash
# Manager tries to APPROVE (not allowed)
curl -X PATCH http://localhost:3000/api/requests/<id> \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"APPROVE\",\"actorRole\":\"MANAGER\",\"actorUserId\":\"manager@company.com\"}"

# Response: 403
# { "success": false, "error": "Role MANAGER is not authorized to perform APPROVE. Managers can only use RECOMMEND_APPROVE or RECOMMEND_REJECT." }
```

#### User-Facing Authorization Messages (Hebrew)

Messages live in `lib/errors/authorization.ts` (lookup table by role + action).
`applyAction()` in `lib/api/requests.ts` maps HTTP 403 to these messages:

| Scenario | Hebrew Message |
| --- | --- |
| Employee tries any action | אין לך הרשאה לבצע פעולות על בקשות. רק CISO ומנהלים מורשים יכולים לאשר או לדחות. |
| Manager tries APPROVE/REJECT | מנהלים יכולים רק להמליץ, לא לאשר או לדחות. השתמש ב״המלץ לאישור״ או ״המלץ לדחייה״. |
| Manager tries ROUTE_TO_MANAGER | רק CISO יכול להעביר בקשות למנהלים. |
| CISO tries RECOMMEND_* | CISO לא צריך להמליץ - יש לך הרשאה לאשר או לדחות ישירות. |

**Usage in UI components:**

```typescript
import { applyAction } from "@/lib/api/requests";

const result = await applyAction(requestId, "APPROVE", "MANAGER", "manager@test.local");

if (!result.success && result.unauthorized) {
  // Show Hebrew message to user
  alert(result.userMessage);
  
  // Redirect if suggested (e.g., employees go to home)
  if (result.redirectTo) {
    router.push(result.redirectTo);
  }
}
```

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd <repository-name>
```

Install dependencies:

```bash
npm install
```

### Environment variables

1. Copy `.env.example` to `.env.local` in the project root.
2. Fill in real credentials. Next.js loads **only** `.env.local` / `.env` style files — ad-hoc files like `atlas-credentials.env` are **not** read by the app.
3. Restart `npm run dev` after changing env vars.

```env
# MongoDB Atlas — required for all request / settings persistence
# Database name must be agentRequestDB
# Collections: agent_requests, green_path_settings
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/agentRequestDB?retryWrites=true&w=majority
```

| Variable | Required | Used by | Notes |
| --- | --- | --- | --- |
| `MONGODB_URI` | **Yes** | `lib/db/mongodb.ts` → `connectDB()` | Atlas connection string. **Must include `/agentRequestDB`** in the path. Without it, API routes that touch the DB fail at startup/connect. |

On Render (production), set the same `MONGODB_URI` in the Web Service **Environment** settings (not in the repo).

> **Note:** System databases `admin` and `local` are reserved — app data goes only in `agentRequestDB`.

**MongoDB Atlas checklist (students):**

1. Create a free Atlas cluster and a database user.
2. Copy the connection string into `.env.local` as `MONGODB_URI` (include `/agentRequestDB` in the path).
3. In Atlas → **Network Access**, allow your current IP (or `0.0.0.0/0` for temporary school/dev use).
4. Never commit `.env.local` or credential dumps (e.g. `atlas-credentials.env`) — they are gitignored.
5. After submit, verify in Atlas → Browse Collections → `agent_requests` (and `green_path_settings` after CISO saves green path).

---

### Granting Atlas Access to Teammates

To give a teammate (e.g. your boss or colleague) full admin access to the database:

1. **Database Access** (Atlas left menu) → **Add New Database User**
   - Choose **Password** authentication
   - Create a username + strong password
   - Under **Database User Privileges**, select **Atlas admin** (or appropriate role)
   - Save

2. **Network Access** → **Add IP Address**
   - Add the teammate's IP (or `0.0.0.0/0` temporarily for school/dev)

3. **Share credentials privately** (Slack / email — **never** in Git / README):
   - Username
   - Password
   - Connection string (`MONGODB_URI`) with their username/password filled in
   - Link to the Atlas project

> **Important:** Git branch access (GitHub) is separate from MongoDB Atlas access. A teammate needs both: Git clone/branch access **and** Atlas credentials to work on the project locally.

---

### Verifying Database Connection

After setting up `.env.local`:

1. Run `npm run dev`
2. Fill out the assessment form and click **"שמור בקשה"**
3. Confirm success message in the UI
4. Open Atlas → **Browse Collections** → `agentRequestDB` → `agent_requests` → see your document
5. Or verify via API: `GET http://localhost:3000/api/requests`

Run the application:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Deployment & Hosting (Render)

### TL;DR — How this connects to Render

**GitHub repo → linked in the Render Dashboard → Render builds & hosts the live site.**

There is no Render config inside this codebase. Render watches this repository; when code is pushed, it runs `npm run build` and `npm start`, then serves the app on the public Render URL. Secrets like `MONGODB_URI` live in the Render Web Service settings, not in the repo.

---

### How it works (CI/CD Pipeline)

The connection to Render is managed entirely at the infrastructure level rather than within the application's source code. The integration works through a direct connection between the Render Dashboard and this GitHub repository.

1. **Continuous Integration (Auto-Deploy):** Render is configured to listen for new commits pushed to the repository.
2. **Build Process:** Whenever new code is pushed, Render automatically pulls the latest version and runs the standard Next.js build commands defined in our `package.json` (`npm run build` followed by `npm start`).
3. **Live Environment:** The newly built Next.js application is then deployed and served via the public Render URL.

### Technical Note (Architecture Verification)

Based on an architectural code review, it is verified that this repository is environment-agnostic. There are no hardcoded Render configurations, such as a `render.yaml` file, `Dockerfile`, or Render-specific API hooks within the codebase itself. All deployment settings, environment variables (like `MONGODB_URI`), and auto-deploy triggers are configured externally in the Render Web Service Dashboard.

---

## Usage

1. Create a new AI system assessment.
2. Answer the governance questionnaire.
3. Generate an AI Governance Card.
4. Review risk scenarios.
5. Save the assessment to MongoDB (internal submit).

### Testing Guide

For comprehensive step-by-step testing instructions with real example credentials, see **[docs/testing-guide.md](docs/testing-guide.md)**.

The testing guide covers:
- Organization registration and first CISO setup
- User management (creating Managers and Employees)
- Complete approval workflow (Employee → CISO → Manager → Final Decision)
- System admin access and role impersonation
- Multi-organization isolation testing
- Troubleshooting common issues

---

## Admin Role Impersonation (SYSTEM_ADMIN Only)

SYSTEM_ADMIN users have access to a **Role Impersonation** feature that allows testing the full approval workflow by viewing the dashboard as different roles.

### Purpose

- **Testing & debugging** — Admins can verify the workflow behaves correctly for each role
- **Support** — Admins can see exactly what a user would see in their dashboard
- **Demo capability** — Show stakeholders the full flow in real-time

### How It Works

When logged in as SYSTEM_ADMIN and visiting `/dashboard`:
1. A purple **"Admin Testing Mode"** banner appears at the top
2. Use the dropdown to select which role to view as (EMPLOYEE, MANAGER, CISO)
3. The dashboard content updates to show the selected role's view
4. Impersonated role is persisted in localStorage for convenience

**Regular users (EMPLOYEE, MANAGER, CISO)** always see their dashboard based on their actual session role — they never see the role switcher.

### Impersonation Roles

| Role | User ID | View |
| --- | --- | --- |
| **EMPLOYEE** | `employee@test.local` | Submit form + My Requests |
| **MANAGER** | `manager@test.local` | Submit form + My Requests + Pending Recommendations |
| **CISO** | `ciso@test.local` | Queue tabs (ממתין לטיפולי, בקשות פעילות, היסטוריה) |

### Quick Test Scenarios (Admin)

#### Scenario 1: Test Direct CISO Approval

1. Login as SYSTEM_ADMIN at `/admin/login`
2. Go to `/dashboard`, select **EMPLOYEE** view
3. Submit an agent assessment request
4. Switch to **CISO** view
5. Find the request and click **Approve**

#### Scenario 2: Test Manager Consultation Flow

1. Select **EMPLOYEE** view → Submit a request
2. Switch to **CISO** view → Click **Route to Manager**
3. Switch to **MANAGER** view → Click **Recommend Approve** (or Reject)
4. Switch to **CISO** view → Make final decision

### Files Involved

| File | Purpose |
| --- | --- |
| `lib/test-users.ts` | Impersonation user definitions |
| `contexts/RoleContext.tsx` | Admin impersonation state (localStorage) |
| `components/RoleSwitcher.tsx` | Role selector (visible to SYSTEM_ADMIN only) |
| `app/dashboard/page.tsx` | Conditional impersonation logic |
| `app/providers.tsx` | Wraps app with SessionProvider + RoleProvider |

### Note

> **Regular users** always see their actual session role. The role switcher is **only visible to SYSTEM_ADMIN** users.
>
> Impersonated role is cached in browser localStorage under `mvp-test-role`. **Requests and agents are stored in MongoDB only** — localStorage is just for the impersonation selection.

---

## Queue Management UI

Role-based dashboard with paginated request queues. Different roles see different default views.

### Role-Based Views

| Role | Default Tab | Tabs |
| --- | --- | --- |
| EMPLOYEE | Form | הגשת בקשה \| הבקשות שלי |
| MANAGER | Form | הגשת בקשה \| הבקשות שלי \| ממתין להמלצתי |
| CISO | ממתין לטיפולי | ממתין לטיפולי \| בקשות פעילות \| היסטוריית אישורים |

**Key UX Rules:**
- Employees and managers share the same form + "my requests" UI (no duplicated components)
- Manager also has a reviewer inbox (ממתין להמלצתי) as the third tab
- CISO gets quick filter tabs for oversight (CISO-only)
- All queues are paginated (10 items per page, prev/next)

### CISO Quick Filters

CISO-only navigation for queue management. Manager does **not** see these filters.

| Tab | Meaning | API Filter |
| --- | --- | --- |
| ממתין לטיפולי | Needs CISO action **now** | `assignedTo=CISO` |
| בקשות פעילות | Open pipeline (still in flight) | `status=PENDING_CISO,PENDING_MANAGER` |
| היסטוריית אישורים | Fully resolved requests | `status=APPROVED,REJECTED,AUTO_APPROVED` |

Presets live in `lib/utils/dashboardFilters.ts` (`CISO_QUEUE_VIEWS` / `getCisoQueueView()`).

**History notes:**
- Includes manual approvals, rejections, and green-path `AUTO_APPROVED` (all terminal)
- View-only (`showActions: false`) — no approve/reject/route on history cards
- Sub-filters (active mode is hidden from sibling controls):
  - **הכל** — `APPROVED,REJECTED,AUTO_APPROVED`
  - **מאושרות** (dropdown):
    - **כל המאושרות** — `APPROVED,AUTO_APPROVED`
    - **אוטומטי בלבד** — `AUTO_APPROVED`
  - **נדחו** — `REJECTED`
- Helpers: `getHistoryFilterOptions`, `HistoryStatusFilters`, approved-dropdown helpers in `dashboardFilters.ts`

**Hub & Spoke behavior:**
- When CISO routes a request to a manager → it **leaves** ממתין לטיפולי (`assignedTo` becomes MANAGER)
- It **stays** in בקשות פעילות (`PENDING_MANAGER` is still active)
- After the manager recommends → it **returns** to ממתין לטיפולי (`PENDING_CISO` + `assignedTo=CISO`); `assignedToUserId` is cleared; manager identity is in `routingHistory[].from`
- After final APPROVE/REJECT (or auto-approve on create) → appears in היסטוריית אישורים
- Optional CISO↔manager notes: on route / recommend (and other actions), `reviewNotes` is stored on the request and copied into that `routingHistory` entry's `notes`

### Pagination API

The `GET /api/requests` endpoint supports pagination and filters:

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 10 | Items per page (max 50) |
| `assignedTo` | string | — | Filter by role inbox (CISO, MANAGER) |
| `assignedToUserId` | string | — | Filter by specific user assignment |
| `submittedByUserId` | string | — | Filter by who submitted (for "my requests") |
| `status` | string | — | Single status, or comma-separated list (`$in`) |

Examples:

```bash
# CISO inbox
GET /api/requests?assignedTo=CISO

# Active / open requests
GET /api/requests?status=PENDING_CISO,PENDING_MANAGER

# Approval history (terminal statuses)
GET /api/requests?status=APPROVED,REJECTED,AUTO_APPROVED
```

Response includes pagination metadata:

```json
{
  "success": true,
  "requests": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### Components

| Component / Module | Purpose |
| --- | --- |
| `DashboardTabs` | Role-based tab navigation (includes CISO quick filters) |
| `lib/utils/dashboardFilters.ts` | CISO tab → API filter presets (`getCisoQueueView`, history sub-filters) |
| `HistoryStatusFilters` | History filters: הכל / מאושרות▾ / נדחו |
| `RequestQueue` | Paginated request list with role-specific actions + optional CISO↔manager notes |
| `RequestAnswersPanel` | Read-only questionnaire answers inside expanded cards |
| `CorrespondencePanel` | Collapsible CISO↔manager thread + optional compose (`להתכתבות עם המנהל` / `להתכתבות עם ה-CISO`); hidden from employees |
| `Pagination` | Prev/next controls with page indicator |
| `AgentForm` | Questionnaire form + approved agents (employee + manager) |
| `FieldHelpTooltip` | (?) hover help on employee form fields |
| `questionnaire/fields.ts` | Questions, options, and short ABCM/gov tooltips |

### Questionnaire Field Help (Employee Form)

On **הגשת בקשה**, each question shows a **?** icon. Hover (or focus) reveals a short Hebrew tip:

- **מה זה בוחן?** — what the field measures (ABCM / governance)
- **איך לברר?** — how to find the answer for the agent being registered

Tooltips live on each field as optional `tooltip` in `components/questionnaire/fields.ts` and are rendered only in `AgentForm` (not in CISO/Manager review views).

### Read-Only Questionnaire Review (Context Expand)

Inside an expanded request card, questionnaire answers are behind a toggle:

- **▼ תשובות השאלון (קריאה בלבד)** — expand all answers
- **▲ הסתר תשובות השאלון** — collapse again
- Closed (radio) answers mapped to Hebrew option labels
- Free-text governance fields (`gov_*`) as raw text from MongoDB
- No edit controls — review only, before Approve / Recommend actions

Helpers live in `lib/utils/requestHelpers.ts`:
- `getReadableAnswer()` — option id → label (or raw free text)
- `getQuestionnaireAnswerRows()` — ordered Q&A rows for the panel

This fulfills the “context panel” review need via card expansion + answers toggle (no separate modal in MVP).

### Filter Logic per Tab

| Tab | API Filter | Shows |
| --- | --- | --- |
| הגשת בקשה (employee/manager) | approved agents for current user | Form + approved agents |
| הבקשות שלי (employee/manager) | `submittedByUserId = currentUser.id` | All request statuses |
| ממתין להמלצתי (manager) | `assignedTo=MANAGER` + `assignedToUserId` | Pending recommendations |
| ממתין לטיפולי (CISO) | `assignedTo=CISO` | Needs CISO action |
| בקשות פעילות (CISO) | `PENDING_CISO,PENDING_MANAGER` | Open pipeline |
| היסטוריית אישורים (CISO) | `APPROVED,REJECTED,AUTO_APPROVED` | Finished requests (paginated) |

### Shared Helpers

`lib/utils/requestHelpers.ts` provides:

- `toAgentCard()` — Convert API response to UI card shape
- `getStatusLabel()` — Hebrew labels for statuses
- `getStatusBadgeStyle()` — Badge colors by status
- `isTerminalStatus()` — Check if status is final
- `formatDate()` — Hebrew locale date formatting
- `getRecommendationLabel()` — Manager recommendation labels
- `getRoutingActionLabel()` — Hebrew labels for `routingHistory` actions
- `getReadableAnswer()` / `getQuestionnaireAnswerRows()` — read-only questionnaire display

---

## Future Enhancements

- PDF export
- Excel reporting
- Risk scoring engine
- Real user authentication (replace MVP Role Switcher)
- Multi-tenant support
- Richer audit / versioning beyond `routingHistory`
- Regulatory framework mapping (NIST AI RMF, ISO 42001, EU AI Act)

---

## Author

**Shauli Shwartzman**

AI Governance | Information Security | Risk Management

Contact:

- Email: shauli.sh321@gmail.com

---

## License

This project is intended for internal governance, risk assessment, and AI inventory management purposes.
