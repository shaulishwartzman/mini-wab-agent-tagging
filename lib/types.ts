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
 *
 * - `EMPLOYEE` — Can submit agent assessment requests
 * - `MANAGER` — Can submit requests; can recommend when consulted by CISO; can create users
 * - `CISO` — Final decision-maker; can approve, reject, route to manager; can create users
 * - `SYSTEM_ADMIN` — System-wide admin; not bound to any organization; can view all orgs
 *
 * `assignedTo` on a request indicates which role's inbox the item sits in.
 */
export const UserRole = {
  EMPLOYEE: "EMPLOYEE",
  MANAGER: "MANAGER",
  CISO: "CISO",
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/**
 * Roles that belong to an organization (excludes SYSTEM_ADMIN).
 * Used for validation when creating users within an org context.
 */
export const OrgBoundRoles = [
  UserRole.EMPLOYEE,
  UserRole.MANAGER,
  UserRole.CISO,
] as const;
export type OrgBoundRole = (typeof OrgBoundRoles)[number];

/**
 * Allowed PATCH/PUT actions that drive status transitions.
 * Clients send an action; they do not write `status` directly.
 *
 * CISO actions: APPROVE, REJECT, ROUTE_TO_MANAGER
 * Manager actions: RECOMMEND_APPROVE, RECOMMEND_REJECT (advisory only, returns to CISO)
 */
export const RequestAction = {
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  ROUTE_TO_MANAGER: "ROUTE_TO_MANAGER",
  RECOMMEND_APPROVE: "RECOMMEND_APPROVE",
  RECOMMEND_REJECT: "RECOMMEND_REJECT",
} as const;
export type RequestAction =
  (typeof RequestAction)[keyof typeof RequestAction];

/**
 * Manager recommendation values (subset of RequestAction for type safety).
 * Managers provide recommendations, not final decisions.
 */
export const ManagerRecommendation = {
  RECOMMEND_APPROVE: "RECOMMEND_APPROVE",
  RECOMMEND_REJECT: "RECOMMEND_REJECT",
} as const;
export type ManagerRecommendation =
  (typeof ManagerRecommendation)[keyof typeof ManagerRecommendation];

/**
 * Single entry in the routing history audit trail.
 * Tracks who routed/recommended to whom and when.
 */
export type RoutingHistoryEntry = {
  from: string;
  fromRole: UserRole;
  to: string;
  toRole: UserRole;
  action: RequestAction;
  notes: string;
  at: string;
};

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
 * Client-side assessment card built by `createAgentCard`.
 * Used by the form UI and assessment engine.
 */
export type AgentCard = {
  id: string;
  agentName: string;
  agentLevel: string;
  classification: Classification;
  classificationExplanation: Record<string, string>;
  governance: Governance;
  riskScenarios: string[];
};

/**
 * Assessment payload aligned with `createAgentCard` / AgentCard.
 * Sent on `POST /api/requests` (fields beyond `agentName` are optional).
 *
 * Note: `organizationId` is typically injected server-side from the user's session,
 * not provided by the client. It's optional here for type flexibility.
 */
export type AgentAssessmentPayload = {
  /** Display name of the AI agent / system being assessed. */
  agentName: string;
  /**
   * Organization ID this request belongs to.
   * Injected from session on the server; not typically sent by client.
   */
  organizationId?: string;
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
  /** User ID (email) of who submitted. */
  submittedByUserId?: string;
  /** Role of the submitter (Employee or Manager when self-submitting). */
  submittedByRole?: UserRole;
  /** Free-text description of agent's purpose (for CISO context, not auto-approval). */
  agentPurpose?: string;
  /** Whether this request qualifies for green-path auto-approval. */
  autoApprovalEligible?: boolean;
  /** Reason for auto-approval eligibility or ineligibility. */
  autoApprovalReason?: string;
  /** If true, request will be created as AUTO_APPROVED (set by rulesEngine). */
  autoApprove?: boolean;
};

/**
 * Full agent request document shape returned from API / MongoDB.
 * Extends AgentAssessmentPayload with workflow metadata and timestamps.
 */
export type AgentRequestResponse = {
  _id: string;
  /** Organization this request belongs to (for multi-tenant isolation). */
  organizationId: string;
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
  submittedByUserId: string;
  submittedByName: string;
  assignedToUserId: string | null;
  agentPurpose: string;
  approvedBy: string | null;
  resolvedAt: string | null;
  autoApprovalEligible: boolean;
  autoApprovalReason: string | null;
  managerRecommendation: ManagerRecommendation | null;
  routingHistory: RoutingHistoryEntry[];
};
