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
├─ page.tsx
└─ api/
   ├─ agent/
   │  └─ route.ts
   └─ requests/
      ├─ route.ts              # POST create, GET list/filter
      └─ [id]/
         └─ route.ts           # PATCH/PUT/DELETE status transitions

components/
├─ AgentForm.tsx               # Assessment form (saves to MongoDB)
└─ questionnaire/
   └─ fields.ts

lib/
├─ agent-engine/
│  └─ createAgentCard.ts       # Build AgentCard from questionnaire answers
├─ api/
│  └─ requests.ts              # Client-side API helpers (createRequest, fetchRequests)
├─ db/
│  └─ mongodb.ts               # connectDB() — cached Mongoose connection
├─ requests/
│  └─ transitions.ts           # Legal status transition rules
└─ types.ts                    # Shared types: AgentCard, RequestStatus, payloads

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
| `lib/api/requests.ts` | Client-side helpers: `createRequest()`, `fetchRequests()`, `deleteRequest()` |
| `models/AgentRequest.ts` | Mongoose model (collection: `agent_requests`) |
| `lib/requests/transitions.ts` | `applyTransition()` — CISO-final state machine; rejects illegal moves |
| `app/api/requests/route.ts` | Collection: create + list |
| `app/api/requests/[id]/route.ts` | Item: approve / reject / route / delete |

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

Apply a workflow action. Body:

```json
{ "action": "APPROVE", "reviewNotes": "Looks good", "actorUserId": "ciso@company.com" }
```

**CISO actions:** `APPROVE`, `REJECT`, `ROUTE_TO_MANAGER`

**Manager actions:** `RECOMMEND_APPROVE`, `RECOMMEND_REJECT`

Additional fields:
- `reviewNotes` — optional note from reviewer
- `actorUserId` — who is performing this action (for audit trail)
- `targetUserId` — for `ROUTE_TO_MANAGER`: which specific manager to assign

| Status | Meaning |
| --- | --- |
| `200` | Transition applied; returns `{ success: true, request }` |
| `400` | Invalid action or illegal transition (e.g. approving a `REJECTED` request) |
| `404` | Unknown id |

**Example: CISO routes to manager**

```bash
curl -X PATCH http://localhost:3000/api/requests/<id> \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"ROUTE_TO_MANAGER\",\"actorUserId\":\"ciso@company.com\",\"targetUserId\":\"manager@company.com\",\"reviewNotes\":\"Need business owner sign-off\"}"
```

**Example: Manager recommends approval**

```bash
curl -X PATCH http://localhost:3000/api/requests/<id> \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"RECOMMEND_APPROVE\",\"actorUserId\":\"manager@company.com\",\"reviewNotes\":\"Verified with legal, low risk\"}"
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
