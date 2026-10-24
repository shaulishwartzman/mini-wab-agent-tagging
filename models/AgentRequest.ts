/**
 * Mongoose model for an AI Agent assessment request stored in MongoDB.
 *
 * Database: agentRequestDB (set via MONGODB_URI)
 * Collection: agent_requests (explicitly configured below)
 *
 * Combines questionnaire / AgentCard assessment fields with workflow metadata
 * (`status`, `assignedTo`). Timestamps (`createdAt`, `updatedAt`) are enabled.
 *
 * Multi-tenant: Each request belongs to an organization (`organizationId`).
 * All queries should filter by organizationId to maintain data isolation.
 *
 * Hot-reload safe: reuses `mongoose.models.AgentRequest` when present.
 *
 * @see models/Organization.ts - Organization that owns this request
 */

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { RequestStatus, UserRole, ManagerRecommendation } from "@/lib/types";

/** Nested classification codes (autonomy / brain / capability / management). */
const classificationSchema = new Schema(
  {
    autonomy: { type: String, default: "" },
    brain: { type: String, default: "" },
    capability: { type: String, default: "" },
    management: { type: String, default: "" },
  },
  { _id: false },
);

/** Nested governance ownership / oversight fields. */
const governanceSchema = new Schema(
  {
    agentOwner: { type: String, default: "" },
    technicalOwner: { type: String, default: "" },
    changeApprover: { type: String, default: "" },
    oversightMechanism: { type: String, default: "" },
  },
  { _id: false },
);

/** Single entry in the routing history audit trail. */
const routingHistoryEntrySchema = new Schema(
  {
    from: { type: String, required: true },
    fromRole: { type: String, enum: Object.values(UserRole), required: true },
    to: { type: String, required: true },
    toRole: { type: String, enum: Object.values(UserRole), required: true },
    action: { type: String, required: true },
    notes: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const agentRequestSchema = new Schema(
  {
    agentName: { type: String, required: true, trim: true },

    /**
     * Reference to the organization this request belongs to.
     * Required for multi-tenant data isolation.
     * All queries must filter by this field.
     */
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
      index: true,
    },

    /** Flexible map of questionnaire answers (question_id → value). */
    answers: { type: Schema.Types.Mixed, default: {} },
    classification: { type: classificationSchema, default: () => ({}) },
    agentLevel: { type: String, default: "" },
    classificationExplanation: { type: Schema.Types.Mixed, default: {} },
    governance: { type: governanceSchema, default: () => ({}) },
    riskScenarios: { type: [String], default: [] },
    /** Workflow status; defaults to PENDING_CISO on create. */
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.PENDING_CISO,
    },
    /**
     * Role inbox currently responsible for this request.
     * Cleared (`null`) when the request reaches a terminal status.
     */
    assignedTo: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CISO,
      required: false,
    },
    submittedByRole: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.EMPLOYEE,
    },
    /** Optional note from a reviewer on approve / reject / route. */
    reviewNotes: { type: String, default: "" },

    /** User ID (email) of who submitted the request. */
    submittedByUserId: { type: String, default: "" },

    /** Name of the user who submitted the request (for display). */
    submittedByName: { type: String, default: "" },

    /** Specific user ID assigned (for manager routing — current inbox holder). */
    assignedToUserId: { type: String, default: null },

    /** Free-text description of agent's purpose (required on submit; CISO context, not auto-approval). */
    agentPurpose: { type: String, default: "", trim: true },

    /** Who made the final decision: "SYSTEM_AUTO_APPROVAL" or user ID. */
    approvedBy: { type: String, default: null },

    /** When the request reached terminal status. */
    resolvedAt: { type: Date, default: null },

    /** Whether this request qualified for green-path auto-approval. */
    autoApprovalEligible: { type: Boolean, default: false },

    /** Reason for auto-approval eligibility or ineligibility. */
    autoApprovalReason: { type: String, default: null },

    /** Manager's recommendation (RECOMMEND_APPROVE or RECOMMEND_REJECT). */
    managerRecommendation: {
      type: String,
      enum: [...Object.values(ManagerRecommendation), null],
      default: null,
    },

    /** Full routing history for audit trail. */
    routingHistory: { type: [routingHistoryEntrySchema], default: [] },
  },
  {
    timestamps: true,
    collection: "agent_requests",
  },
);

/** Compound index for querying requests by org + status (dashboard queues). */
agentRequestSchema.index({ organizationId: 1, status: 1 });

/** Compound index for querying requests by org + assignedTo (role inbox). */
agentRequestSchema.index({ organizationId: 1, assignedTo: 1 });

/** Compound index for querying requests by org + submittedByUserId (user's requests). */
agentRequestSchema.index({ organizationId: 1, submittedByUserId: 1 });

/** Document shape inferred from the schema, plus Mongo `_id`. */
export type AgentRequestDocument = InferSchemaType<typeof agentRequestSchema> & {
  _id: mongoose.Types.ObjectId;
};

const AgentRequest: Model<AgentRequestDocument> =
  (mongoose.models.AgentRequest as Model<AgentRequestDocument>) ??
  mongoose.model<AgentRequestDocument>("AgentRequest", agentRequestSchema);

export default AgentRequest;
