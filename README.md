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

### Agent Inventory Repository

Stores assessed AI systems in MongoDB Atlas via `/api/requests`. The UI fetches and persists all agent assessments through the API — no localStorage dependency.

---

### Request Lifecycle (MongoDB)

Server-side approval workflow for assessment requests:

- Create requests with questionnaire / AgentCard data
- Filter inboxes by role (`assignedTo`) or status
- Approve, reject, or route to manager with enforced state transitions

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

- MongoDB Atlas + Mongoose (`AgentRequest` via `/api/requests`)
- Database: `agentRequestDB`
- Collection: `agent_requests`

### Hosting

- Render

---

## Project Structure

```text
app/
├─ layout.tsx
├─ page.tsx                    # Main dashboard with role-based tabs
└─ api/
   ├─ agent/
   │  └─ route.ts
   └─ requests/
      ├─ route.ts              # POST create, GET list/filter with pagination
      └─ [id]/
         └─ route.ts           # PATCH/PUT/DELETE status transitions

components/
├─ AgentForm.tsx               # Assessment form (employees only)
├─ DashboardTabs.tsx           # Role-based tab navigation
├─ Pagination.tsx              # Prev/next pagination controls
├─ RequestQueue.tsx            # Paginated request list with actions
├─ RoleSwitcher.tsx            # MVP role selector (top banner)
└─ questionnaire/
   └─ fields.ts

lib/
├─ agent-engine/
│  └─ createAgentCard.ts       # Build AgentCard from questionnaire answers
├─ api/
│  └─ requests.ts              # Client-side API helpers with pagination support
├─ auto-approval/
│  ├─ greenPathCriteria.ts     # Green-path criteria definitions
│  └─ rulesEngine.ts           # Auto-approval evaluation logic
├─ db/
│  └─ mongodb.ts               # connectDB() — cached Mongoose connection
├─ errors/
│  └─ authorization.ts         # Hebrew 403 messages + redirect hints
├─ requests/
│  └─ transitions.ts           # Legal status transition + role authorization rules
├─ utils/
│  ├─ dashboardFilters.ts      # CISO tab → queue filter presets
│  └─ requestHelpers.ts        # Status labels, colors, card conversion helpers
└─ types.ts                    # Shared types: AgentCard, RequestStatus, payloads

contexts/
└─ RoleContext.tsx             # React context for current role state

models/
└─ AgentRequest.ts             # Mongoose schema (collection: agent_requests)

.env.example                   # placeholder env vars (safe to commit)
.env.local                     # local secrets (not committed)
```

---

## Request Lifecycle API

Server-side persistence for AI agent assessment requests. The questionnaire UI saves directly to MongoDB via these endpoints.

### Modules

| Path | Purpose |
| --- | --- |
| `lib/types.ts` | Shared enums: `RequestStatus`, `UserRole`, `RequestAction`, plus `AgentAssessmentPayload` |
| `lib/db/mongodb.ts` | `connectDB()` — connects using `MONGODB_URI`, caches for Next.js hot reload |
| `lib/api/requests.ts` | Client-side helpers: `createRequest()`, `fetchRequests()`, `deleteRequest()`, `applyAction()` with pagination |
| `lib/errors/authorization.ts` | Hebrew 403 messages + optional redirects (`getAuthorizationErrorInfo`) |
| `lib/utils/requestHelpers.ts` | Status labels, badge colors, card conversion utilities |
| `lib/utils/dashboardFilters.ts` | CISO queue view presets (`getCisoQueueView`) |
| `models/AgentRequest.ts` | Mongoose model (collection: `agent_requests`) |
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

#### Schema Fields

**Workflow Fields:**

| Field | Type | Purpose |
| --- | --- | --- |
| `status` | Enum | PENDING_CISO, PENDING_MANAGER, AUTO_APPROVED, APPROVED, REJECTED |
| `assignedTo` | Enum / null | Which role's inbox (CISO, MANAGER, or null for terminal) |
| `assignedToUserId` | String / null | Specific user ID when routed to a manager |
| `submittedByRole` | Enum | EMPLOYEE, MANAGER, CISO |
| `submittedByUserId` | String | User ID (email) of who submitted |
| `reviewNotes` | String | Current reviewer's notes |

**Audit Trail Fields:**

| Field | Type | Purpose |
| --- | --- | --- |
| `approvedBy` | String / null | Who made final decision: `SYSTEM_AUTO_APPROVAL` or user ID |
| `resolvedAt` | Date / null | When request reached terminal status |
| `managerRecommendation` | Enum / null | `RECOMMEND_APPROVE` or `RECOMMEND_REJECT` |
| `routingHistory` | Array | Full routing chain for audit (see below) |

**Auto-Approval Fields:**

| Field | Type | Purpose |
| --- | --- | --- |
| `autoApprovalEligible` | Boolean | Did request meet green-path criteria? |
| `autoApprovalReason` | String / null | Why auto-approved or why not eligible |
| `agentPurpose` | String | Free text description (for CISO context, not auto-approval) |

#### Auto-Approval Engine (Green Path)

The auto-approval engine evaluates requests against hardcoded "green path" criteria. If ALL criteria are met, the request is automatically approved without CISO review.

**Green Path Criteria (all must be met):**

| Question | Required Answer | Meaning |
| --- | --- | --- |
| Autonomy (`q1_autonomy`) | `A1` | Human-in-the-loop (controlled, no autonomous decisions) |
| Architecture (`q2_brain`) | `B1` | Public/SaaS LLM (no internal data exposure) |
| Capabilities (`q3_capability`) | `C1` | Read-Only (no write permissions) |
| Management (`q4_management`) | `M1` | Isolated System (single user tool) |

**Required Documentation Fields (must be non-empty):**

| Field | Purpose |
| --- | --- |
| `gov_owner` | Accountable manager |
| `gov_tech` | Technical owner |
| `gov_approver` | Change approval authority |
| `gov_monitoring` | Oversight mechanism |

**Disqualifying Conditions:**

- Any answer is `U0` (unknown/undetermined)
- Any required text field is empty
- Any closed question answer is not the green-path option

**Why these criteria?**

The green path represents the **lowest-risk agent configuration**:
- Human always in control (no autonomous decisions)
- No access to internal/sensitive data
- Cannot modify any systems (read-only)
- Single user tool (no multi-agent coordination)

**Implementation:**

```
lib/auto-approval/
├── greenPathCriteria.ts   # Hardcoded criteria constants
└── rulesEngine.ts         # Evaluation function with fail-safe defaults

components/AgentForm.tsx   # Runs evaluateForAutoApproval() on submit
```

#### Automatic Processing on Submit (onSubmit)

The auto-approval engine runs **automatically** when the user clicks **"שמור בקשה"** — no manual step is required.

```
User clicks "שמור בקשה"
                    ↓
            AgentForm.handleSubmit()
                    ↓
      evaluateForAutoApproval(answers)
                    ↓
          ┌─────────┴─────────┐
          ↓                   ↓
      eligible            not eligible
          ↓                   ↓
   autoApprove: true     autoApprove: false
   AUTO_APPROVED         PENDING_CISO
   assignedTo: null      assignedTo: CISO
   approvedBy:
     SYSTEM_AUTO_APPROVAL
```

- The form passes `autoApprove`, `autoApprovalEligible`, and `autoApprovalReason` to the API.
- The API saves the request to MongoDB with the correct status.
- The UI shows a short user-facing message: **הבקשה אושרה אוטומטית** (green) or **הבקשה נשלחה לאישור** (yellow). Technical status details stay in the DB / API only.

#### Fail-Safe Defaults (מנגנון בטיחות)

The rules engine is designed to be **conservative** - when in doubt, require CISO review:

| Condition | Result |
| --- | --- |
| Any deviation from green path | `PENDING_CISO` |
| Any "לא ידוע" (U0) answer | `PENDING_CISO` |
| Any required text field empty | `PENDING_CISO` |
| Any error during evaluation | `PENDING_CISO` |
| All criteria met | `AUTO_APPROVED` |

**Usage:**

```typescript
import { evaluateForAutoApproval } from "@/lib/auto-approval/rulesEngine";

const result = evaluateForAutoApproval(formAnswers);

if (result.eligible) {
  // AUTO_APPROVED - all green path criteria met
} else {
  // PENDING_CISO - result.reason explains why
  // result.failedCriteria lists specific failures
}
```

#### CISO Customization

CISO can expand/narrow/change the green path criteria:

```typescript
// Example: Allow both A1 (Human-in-loop) AND A2 (Semi-Autonomous)
const result = evaluateForAutoApproval(formAnswers, {
  allowedAnswers: {
    q1_autonomy: ["A1", "A2"],  // Expanded
  }
});

// Example: Require only 2 text fields instead of 4
const result = evaluateForAutoApproval(formAnswers, {
  requiredTextFields: ["gov_owner", "gov_tech"],
});
```

**Note:** Custom criteria UI will be added in the CISO dashboard (future task).

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
| `reviewNotes` | string | Note from reviewer |
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
2. Fill in real credentials. Next.js loads `.env.local` automatically; files like `atlas-credentials.env` are **not** read by the app.

```env
# MongoDB Atlas — required for DB connection
# Database name must be agentRequestDB (collection: agent_requests)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/agentRequestDB?retryWrites=true&w=majority
```

| Variable | Required for | Notes |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection via `connectDB()` | From MongoDB Atlas (Database → Connect). **Must include `/agentRequestDB`** in the path. |

> **Note:** System databases `admin` and `local` are reserved — app data goes only in `agentRequestDB`.

**MongoDB Atlas checklist (students):**

1. Create a free Atlas cluster and a database user.
2. Copy the connection string into `.env.local` as `MONGODB_URI` (include `/agentRequestDB` in the path).
3. In Atlas → **Network Access**, allow your current IP (or `0.0.0.0/0` for temporary school/dev use).
4. Never commit `.env.local` or credential dumps (e.g. `atlas-credentials.env`) — they are gitignored.

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

---

## MVP Testing Mode

For the Minimum Viable Product (MVP), the platform includes a **Role Switcher** that allows testing the full approval workflow without requiring a real authentication system.

### Why This Approach?

- **No auth complexity** — Focus on validating the workflow logic first
- **Instant role switching** — Test all workflow paths quickly
- **Demo capability** — Show stakeholders the full flow in real-time
- **Easy to replace** — Will be swapped for real auth in production

### Test Users

The role switcher (yellow banner at the top) provides three predefined test users:

| Role | User ID | Capabilities |
| --- | --- | --- |
| **EMPLOYEE** | `employee@test.local` | Submit agent assessment requests |
| **MANAGER** | `manager@test.local` | Provide recommendations when consulted by CISO |
| **CISO** | `ciso@test.local` | Final decision-maker (approve, reject, route) |

### Quick Test Scenarios

#### Scenario 1: Direct CISO Approval

1. Select **EMPLOYEE** role
2. Fill out the assessment form and submit
3. Switch to **CISO** role
4. Find the request and click **Approve**

#### Scenario 2: Manager Consultation Flow

1. Select **EMPLOYEE** role → Submit a request
2. Switch to **CISO** role → Click **Route to Manager**
3. Switch to **MANAGER** role → Click **Recommend Approve** (or Reject)
4. Switch to **CISO** role → Make final decision (Approve/Reject)

### Files Involved

| File | Purpose |
| --- | --- |
| `lib/test-users.ts` | Hardcoded test user definitions |
| `contexts/RoleContext.tsx` | React context for current role state |
| `components/RoleSwitcher.tsx` | Role selector dropdown UI |
| `app/providers.tsx` | Client-side providers wrapper |
| `lib/api/requests.ts` | API helpers including `applyAction()` |

### Note

> This role switcher is for **MVP/demo purposes only**. In production, it will be replaced with proper user authentication (e.g., OAuth, JWT sessions, or enterprise SSO).

---

## Queue Management UI

Role-based dashboard with paginated request queues. Different roles see different default views.

### Role-Based Views

| Role | Default Tab | Tabs |
| --- | --- | --- |
| EMPLOYEE | Form | הגשת בקשה \| הבקשות שלי |
| MANAGER | Pending queue | ממתין להמלצתי only (reviewer in MVP) |
| CISO | ממתין לטיפולי | ממתין לטיפולי \| בקשות פעילות \| היסטוריית אישורים |

**Key UX Rules:**
- Only employees see the questionnaire form
- Manager is a reviewer only in MVP (no form, no "my requests", no org-wide history)
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
- Sub-filters (active mode is hidden from the button row):
  - **הכל** — `APPROVED,REJECTED,AUTO_APPROVED`
  - **מאושרות** — `APPROVED,AUTO_APPROVED`
  - **נדחו** — `REJECTED`
- Helpers: `getHistoryFilterOptions`, `getVisibleHistoryFilterButtons`, `HistoryStatusFilters`

**Hub & Spoke behavior:**
- When CISO routes a request to a manager → it **leaves** ממתין לטיפולי (`assignedTo` becomes MANAGER)
- It **stays** in בקשות פעילות (`PENDING_MANAGER` is still active)
- After the manager recommends → it **returns** to ממתין לטיפולי (`PENDING_CISO` + `assignedTo=CISO`)
- After final APPROVE/REJECT (or auto-approve on create) → appears in היסטוריית אישורים

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
| `HistoryStatusFilters` | History buttons: הכל / מאושרות / נדחו (hides active mode) |
| `RequestQueue` | Paginated request list with role-specific actions |
| `RequestAnswersPanel` | Read-only questionnaire answers inside expanded cards |
| `Pagination` | Prev/next controls with page indicator |
| `AgentForm` | Questionnaire form + approved agents (employee) |

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
| הגשת בקשה (employee) | approved agents for current user | Form + approved agents |
| הבקשות שלי (employee) | `submittedByUserId = currentUser.id` | All request statuses |
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

---

## Future Enhancements

- PDF export
- Excel reporting
- Risk scoring engine
- Governance workflow approvals
- User authentication
- Multi-tenant support
- Audit trail and versioning
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
