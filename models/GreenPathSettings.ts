/**
 * Mongoose model for CISO-configurable Green Path auto-approval settings.
 *
 * Database: agentRequestDB (set via MONGODB_URI)
 * Collection: green_path_settings
 *
 * Singleton document (`key: "default"`) stores which closed-question answers
 * are allowed for auto-approval. Defaults match GREEN_PATH_ANSWERS (A1/B1/C1/M1).
 *
 * Hot-reload safe: reuses `mongoose.models.GreenPathSettings` when present.
 *
 * @see lib/auto-approval/greenPathCriteria.ts - Default criteria
 * @see app/api/green-path-settings/route.ts - GET/PUT API
 */

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const allowedAnswersSchema = new Schema(
  {
    q1_autonomy: { type: [String], default: ["A1"] },
    q2_brain: { type: [String], default: ["B1"] },
    q3_capability: { type: [String], default: ["C1"] },
    q4_management: { type: [String], default: ["M1"] },
  },
  { _id: false },
);

const greenPathSettingsSchema = new Schema(
  {
    /**
     * Document key. Per-org docs use `org:<organizationId>`.
     * Legacy singleton used "default".
     */
    key: { type: String, required: true },
    /** Allowed option ids per closed questionnaire dimension. */
    allowedAnswers: { type: allowedAnswersSchema, required: true },
    /**
     * When false, green-path auto-approval is off for this organization.
     * All new requests go to CISO review.
     */
    enabled: { type: Boolean, default: true },
    /** Organization these settings belong to (multi-tenant). */
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    /** User id of CISO who last saved (audit). */
    updatedBy: { type: String, default: null },
  },
  { timestamps: true, collection: "green_path_settings" },
);

export type GreenPathSettingsDocument = InferSchemaType<
  typeof greenPathSettingsSchema
> & { _id: mongoose.Types.ObjectId };

const GreenPathSettings: Model<GreenPathSettingsDocument> =
  (mongoose.models.GreenPathSettings as Model<GreenPathSettingsDocument>) ||
  mongoose.model<GreenPathSettingsDocument>(
    "GreenPathSettings",
    greenPathSettingsSchema,
  );

export default GreenPathSettings;
