/**
 * Mongoose model for an AI Agent assessment request stored in MongoDB.
 *
 * Database: agentRequestDB (set via MONGODB_URI)
 * Collection: agent_requests (explicitly configured below)
 *
 * Combines questionnaire / AgentCard assessment fields with workflow metadata
 * (`status`, `assignedTo`). Timestamps (`createdAt`, `updatedAt`) are enabled.
 *
 * Hot-reload safe: reuses `mongoose.models.AgentRequest` when present.
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

    /** Specific user ID assigned (for manager routing — current inbox holder). */
    assignedToUserId: { type: String, default: null },

    /** Free-text description of agent's purpose (for CISO context, not auto-approval). */
    agentPurpose: { type: String, default: "" },

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

/** Document shape inferred from the schema, plus Mongo `_id`. */
export type AgentRequestDocument = InferSchemaType<typeof agentRequestSchema> & {
  _id: mongoose.Types.ObjectId;
};

const AgentRequest: Model<AgentRequestDocument> =
  (mongoose.models.AgentRequest as Model<AgentRequestDocument>) ??
  mongoose.model<AgentRequestDocument>("AgentRequest", agentRequestSchema);

export default AgentRequest;
