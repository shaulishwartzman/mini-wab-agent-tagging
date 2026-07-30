/**
 * Shared domain types for the AI Agent Request lifecycle.
 *
 * Used by the Mongoose model, transition helper, and `/api/requests` routes.
 * Status / role / action values are string enums (const objects) so they can be
 * reused both at runtime (validation) and as TypeScript types.
 */

/**
 * Lifecycle status of an agent assessment request.
 *
 * - `PENDING_CISO` — waiting for CISO review (default on create)
 * - `PENDING_MANAGER` — escalated to a manager
 * - `AUTO_APPROVED` — created already approved (e.g. future auto-engine)
 * - `APPROVED` / `REJECTED` — terminal outcomes
 */
export const RequestStatus = {
  PENDING_CISO: "PENDING_CISO",
  PENDING_MANAGER: "PENDING_MANAGER",
  AUTO_APPROVED: "AUTO_APPROVED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type RequestStatus =
  (typeof RequestStatus)[keyof typeof RequestStatus];

/**
 * Organizational roles in the approval workflow.
 * `assignedTo` on a request indicates which role's inbox the item sits in.
 */
export const UserRole = {
  EMPLOYEE: "EMPLOYEE",
  MANAGER: "MANAGER",
  CISO: "CISO",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/**
 * Allowed PATCH/PUT actions that drive status transitions.
 * Clients send an action; they do not write `status` directly.
 */
export const RequestAction = {
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  ROUTE_TO_MANAGER: "ROUTE_TO_MANAGER",
} as const;
export type RequestAction =
  (typeof RequestAction)[keyof typeof RequestAction];

/** Reusable nested type for classification codes. */
export type Classification = {
  autonomy: string;
  brain: string;
  capability: string;
  management: string;
};

/** Reusable nested type for governance ownership fields. */
export type Governance = {
  agentOwner: string;
  technicalOwner: string;
  changeApprover: string;
  oversightMechanism: string;
};

/**
 * Assessment payload aligned with `createAgentCard` / AgentCard.
 * Sent on `POST /api/requests` (fields beyond `agentName` are optional).
 */
export type AgentAssessmentPayload = {
  /** Display name of the AI agent / system being assessed. */
  agentName: string;
  /** Raw questionnaire answers keyed by question_id. */
  answers?: Record<string, string>;
  /** Classification codes (A# / B# / C# / M#). */
  classification?: Classification;
  /** Composite level string, e.g. `A2-B1-C2-M1`. */
  agentLevel?: string;
  /** Human-readable labels for each classification dimension. */
  classificationExplanation?: Record<string, string>;
  /** Ownership and oversight fields from the governance section. */
  governance?: Governance;
  /** Risk scenario strings derived from classification options. */
  riskScenarios?: string[];
};

/**
 * Full agent request document shape returned from API / MongoDB.
 * Extends AgentAssessmentPayload with workflow metadata and timestamps.
 */
export type AgentRequestResponse = {
  _id: string;
  agentName: string;
  answers: Record<string, string>;
  classification: Classification;
  agentLevel: string;
  classificationExplanation: Record<string, string>;
  governance: Governance;
  riskScenarios: string[];
  status: RequestStatus;
  assignedTo: UserRole | null;
  submittedByRole: UserRole;
  reviewNotes: string;
  createdAt: string;
  updatedAt: string;
};
