/**
 * Mongoose model for an Organization in the multi-tenant system.
 *
 * Database: agentRequestDB (set via MONGODB_URI)
 * Collection: organizations
 *
 * Each organization is an isolated tenant containing its own users and
 * agent requests. The first CISO is created during organization registration.
 *
 * Hot-reload safe: reuses `mongoose.models.Organization` when present.
 *
 * @see models/User.ts - Users belong to an organization
 * @see models/AgentRequest.ts - Requests are scoped to an organization
 */

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { slugify } from "@/lib/utils/slugify";

const organizationSchema = new Schema(
  {
    /**
     * Display name of the organization.
     * Example: "Hadassah Academic College"
     */
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      minlength: [2, "Organization name must be at least 2 characters"],
      maxlength: [100, "Organization name must be at most 100 characters"],
    },

    /**
     * URL-safe identifier for the organization.
     * Used in login flow to identify the org (case-insensitive).
     * Auto-generated from name if not provided.
     * Example: "hadassah-academic-college"
     */
    slug: {
      type: String,
      required: [true, "Organization slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u,
        "Slug must contain letters/numbers separated by single hyphens",
      ],
    },
  },
  {
    timestamps: true,
    collection: "organizations",
  }
);

/**
 * Pre-save hook to auto-generate slug from name if not provided.
 * Uses shared `slugify()` so login and registration stay consistent.
 *
 * Mongoose 9 document middleware receives SaveOptions (not a next callback);
 * sync/async hooks complete by returning void or a Promise.
 */
organizationSchema.pre("save", function () {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

/** Document shape inferred from the schema, plus Mongo `_id`. */
export type OrganizationDocument = InferSchemaType<typeof organizationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Organization model.
 * Reuses existing model in hot-reload scenarios.
 */
const Organization: Model<OrganizationDocument> =
  (mongoose.models.Organization as Model<OrganizationDocument>) ??
  mongoose.model<OrganizationDocument>("Organization", organizationSchema);

export default Organization;
