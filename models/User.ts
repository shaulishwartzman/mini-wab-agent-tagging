/**
 * Mongoose model for a User in the multi-tenant authentication system.
 *
 * Database: agentRequestDB (set via MONGODB_URI)
 * Collection: users
 *
 * Users belong to exactly one organization (except SYSTEM_ADMIN who has no org).
 * Email is unique per organization (compound index), allowing the same email
 * to exist in different organizations.
 *
 * Password is hashed using bcrypt before save. New users have `mustChangePassword: true`
 * and must change their temporary password on first login.
 *
 * Hot-reload safe: reuses `mongoose.models.User` when present.
 *
 * @see models/Organization.ts - Organization that owns this user
 * @see lib/types.ts - UserRole enum definition
 */

import mongoose, { Schema, type InferSchemaType, type Model, type HydratedDocument } from "mongoose";
import { UserRole, OrgBoundRoles } from "@/lib/types";

const userSchema = new Schema(
  {
    /**
     * User's email address, used as login identifier.
     * Unique per organization (enforced by compound index).
     */
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    /**
     * Bcrypt-hashed password.
     * Plain text passwords are hashed in pre-save hook.
     */
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't include password in queries by default
    },

    /**
     * User's display name.
     */
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be at most 100 characters"],
    },

    /**
     * User's role in the organization.
     * Determines permissions for user creation and request workflow.
     */
    role: {
      type: String,
      enum: {
        values: Object.values(UserRole),
        message: "Invalid role: {VALUE}",
      },
      required: [true, "Role is required"],
    },

    /**
     * Reference to the user's organization.
     * Null only for SYSTEM_ADMIN users who operate across all orgs.
     */
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      validate: {
        validator: function (this: { role: string }, value: unknown) {
          // SYSTEM_ADMIN must have null organizationId
          if (this.role === UserRole.SYSTEM_ADMIN) {
            return value === null;
          }
          // All other roles must have an organizationId
          return value !== null;
        },
        message: function (props: { value: unknown }) {
          return props.value === null
            ? "Organization is required for non-SYSTEM_ADMIN users"
            : "SYSTEM_ADMIN users cannot belong to an organization";
        },
      },
    },

    /**
     * Whether user must change password on next login.
     * Set to true when user is created with temporary password.
     */
    mustChangePassword: {
      type: Boolean,
      default: true,
    },

    /**
     * Password reset token (cryptographically secure random string).
     * Generated when user requests password reset.
     * Stored as hashed SHA-256 value for security.
     */
    resetPasswordToken: {
      type: String,
      default: null,
      select: false, // Don't include in queries by default
    },

    /**
     * When the reset token expires (1 hour from generation).
     * Token is invalid after this time.
     */
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },

    /**
     * When user last requested a password reset.
     * Used for rate limiting (max 3 requests per hour).
     */
    lastPasswordResetRequest: {
      type: Date,
      default: null,
    },

    /**
     * User ID of who created this user.
     * Used for audit trail. Null for seed users (first CISO in org registration).
     */
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

/**
 * Compound unique index: email + organizationId.
 * Allows same email in different organizations.
 * Uses sparse: true to allow multiple SYSTEM_ADMIN users with null organizationId.
 */
userSchema.index(
  { email: 1, organizationId: 1 },
  {
    unique: true,
    partialFilterExpression: { organizationId: { $ne: null } },
  }
);

/**
 * Additional index for SYSTEM_ADMIN users (email must be unique among admins).
 */
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { organizationId: null },
  }
);

/** Index for querying users by organization. */
userSchema.index({ organizationId: 1 });

/** Index for querying users by role within an organization. */
userSchema.index({ organizationId: 1, role: 1 });

/**
 * Pre-save hook to hash password if modified.
 * Uses bcrypt with salt rounds of 12.
 *
 * Mongoose 9 document middleware receives SaveOptions (not a next callback);
 * async hooks complete by returning a Promise (errors reject the promise).
 *
 * Note: bcrypt is imported dynamically; this hook should only run on the server.
 */
userSchema.pre("save", async function () {
  // Only hash if password is modified (or new)
  if (!this.isModified("password")) {
    return;
  }

  const bcryptModule = await import("bcryptjs");
  const bcrypt = bcryptModule.default ?? bcryptModule;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance method to compare password with hash.
 * Used during authentication.
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const bcryptModule = await import("bcryptjs");
  const bcrypt = bcryptModule.default ?? bcryptModule;
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Static method to find user by email and organization slug.
 * Used during login flow.
 */
userSchema.statics.findByEmailAndOrg = async function (
  email: string,
  organizationId: mongoose.Types.ObjectId
) {
  return this.findOne({ email: email.toLowerCase(), organizationId }).select(
    "+password"
  );
};

/**
 * Static method to find SYSTEM_ADMIN by email.
 */
userSchema.statics.findSystemAdmin = async function (email: string) {
  return this.findOne({
    email: email.toLowerCase(),
    organizationId: null,
    role: UserRole.SYSTEM_ADMIN,
  }).select("+password");
};

/**
 * Static method to find user by reset token.
 * Only returns users with valid (non-expired) tokens.
 */
userSchema.statics.findByResetToken = async function (token: string) {
  return this.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires +password");
};

/** Document shape inferred from the schema, plus Mongo `_id` and methods. */
export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
};

/** Hydrated document type with Mongoose methods like save() */
export type UserDocumentWithMethods = HydratedDocument<UserDocument>;

/** Model interface with static methods. */
interface UserModel extends Model<UserDocument> {
  findByEmailAndOrg(
    email: string,
    organizationId: mongoose.Types.ObjectId
  ): Promise<UserDocumentWithMethods | null>;
  findSystemAdmin(email: string): Promise<UserDocumentWithMethods | null>;
  findByResetToken(token: string): Promise<UserDocumentWithMethods | null>;
}

/**
 * User model.
 * Reuses existing model in hot-reload scenarios.
 */
const User: UserModel =
  (mongoose.models.User as UserModel) ??
  mongoose.model<UserDocument, UserModel>("User", userSchema);

export default User;

/**
 * Helper type for user creation payload (excludes auto-generated fields).
 */
export type CreateUserPayload = {
  email: string;
  password: string;
  name: string;
  role: (typeof OrgBoundRoles)[number];
  organizationId: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  mustChangePassword?: boolean;
};
