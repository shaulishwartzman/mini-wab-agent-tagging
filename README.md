````md
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

Stores all assessed AI systems locally in the browser and provides:

- Agent inventory management
- Risk visibility
- Governance tracking
- Agent deletion and updates

---

### Email Distribution

Allows governance questionnaires and agent assessments to be sent directly via email to:

- Product Owners
- Developers
- Business Stakeholders
- Governance Teams
- Security Teams

Emails include:

- Governance information
- Classification details
- Risk assessment results
- Governance fields requiring completion

---

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript

### Backend

- Next.js API Routes

### Email Service

- Resend

### Storage

- Browser Local Storage

---

## Project Structure

```text
app/
├─ layout.tsx
├─ page.tsx
└─ api/
   ├─ Agent/
   │  └─ route.ts
   └─ send-email/
      └─ route.ts

components/
└─ questionnaire/
   ├─ AgentForm.tsx
   ├─ AgentEmailSender.tsx
   └─ fields.ts

lib/
├─ agent-engine/
│  └─ createAgentCard.ts
└─ storage/
   └─ agentsStorage.ts

.env.local
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

Create a local environment file:

```env
RESEND_API_KEY=your_resend_api_key
```

Run the application:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Usage

1. Create a new AI system assessment.
2. Answer the governance questionnaire.
3. Generate an AI Governance Card.
4. Review risk scenarios.
5. Save the assessment.
6. Send governance requests by email to relevant stakeholders.

---

## Future Enhancements

- PDF export
- Excel reporting
- Risk scoring engine
- Governance workflow approvals
- Database integration
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
````
