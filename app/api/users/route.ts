/**
 * API endpoints for user management within an organization.
 *
 * GET /api/users
 *   - List all users in the caller's organization
 *   - CISO, MANAGER, SYSTEM_ADMIN only
 *   - SYSTEM_ADMIN can optionally filter by organizationId query param
 *
 * POST /api/users
 *   - Create a new user in the caller's organization
 *   - Validates role creation permissions (canCreateRole)
 *   - Generates temporary password and logs to console (MVP)
 *
 * @see lib/auth/session.ts - Session helpers
 * @see lib/auth/permissions.ts - canCreateRole
 * @see models/User.ts - User model
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/models/User";
import Organization from "@/models/Organization";
import { UserRole, OrgBoundRoles, type OrgBoundRole } from "@/lib/types";
import { generateTempPassword } from "@/lib/auth/password";
import { jsonError, jsonOk } from "@/lib/api/jsonResponse";
import {
  getAuthUser,
  hasRole,
  USER_MANAGER_ROLES,
} from "@/lib/auth/session";
import { canCreateRole } from "@/lib/auth/permissions";
import { UserErrors } from "@/lib/errors/user";
import mongoose from "mongoose";

/**
 * GET /api/users
 *
 * List users in the caller's organization.
 * SYSTEM_ADMIN can view any org via ?organizationId=<id>.
 *
 * Response: { success: true, users: [...] }
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return jsonError(UserErrors.unauthorized, 401);
    }

    if (!hasRole(user, USER_MANAGER_ROLES)) {
      return jsonError(UserErrors.forbidden, 403);
    }

    await connectDB();

    let organizationId: string | null = user.organizationId;

    // SYSTEM_ADMIN can query any org
    if (user.role === UserRole.SYSTEM_ADMIN) {
      const queryOrgId = request.nextUrl.searchParams.get("organizationId");
      if (queryOrgId) {
        organizationId = queryOrgId;
      } else {
        // Return empty for SYSTEM_ADMIN without org filter (they have no org)
        return jsonOk({ success: true, users: [] });
      }
    }

    if (!organizationId) {
      return jsonError(UserErrors.noOrganization, 400);
    }

    const users = await User.find({ organizationId })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    // Map to safe response shape
    const safeUsers = users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      name: u.name,
      role: u.role,
      mustChangePassword: u.mustChangePassword,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return jsonOk({ success: true, users: safeUsers });
  } catch (err) {
    console.error("GET /api/users error:", err);
    return jsonError(UserErrors.serverError, 500);
  }
}

/** Request body for creating a user. */
interface CreateUserBody {
  email?: string;
  name?: string;
  role?: string;
}

/**
 * POST /api/users
 *
 * Create a new user in the caller's organization.
 *
 * Body:
 *   - email: User's email (required)
 *   - name: User's display name (required)
 *   - role: EMPLOYEE | MANAGER | CISO (required, validated by canCreateRole)
 *
 * Returns:
 *   - 201: { success: true, user: {...}, message: "..." }
 *   - 400: Missing or invalid fields
 *   - 401: Not authenticated
 *   - 403: Not authorized to create users or target role
 *   - 409: Email already exists in org
 *   - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getAuthUser();
    if (!currentUser) {
      return jsonError(UserErrors.unauthorized, 401);
    }

    if (!hasRole(currentUser, USER_MANAGER_ROLES)) {
      return jsonError(UserErrors.cannotCreateUsers, 403);
    }

    const body = (await request.json()) as CreateUserBody;
    const { email, name, role } = body;

    // Validate required fields
    if (!email?.trim()) {
      return jsonError(UserErrors.missingEmail, 400);
    }
    if (!name?.trim()) {
      return jsonError(UserErrors.missingName, 400);
    }
    if (!role?.trim()) {
      return jsonError(UserErrors.missingRole, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return jsonError(UserErrors.invalidEmail, 400);
    }

    // Validate role is org-bound
    if (!OrgBoundRoles.includes(role as OrgBoundRole)) {
      return jsonError(UserErrors.invalidRole, 400);
    }

    // Check role creation permission
    if (!canCreateRole(currentUser.role, role)) {
      return jsonError(UserErrors.cannotCreateRole(role), 403);
    }

    // SYSTEM_ADMIN must specify an org (they have none)
    let organizationId: mongoose.Types.ObjectId;
    if (currentUser.role === UserRole.SYSTEM_ADMIN) {
      const queryOrgId = request.nextUrl.searchParams.get("organizationId");
      if (!queryOrgId) {
        return jsonError(UserErrors.adminNeedsOrg, 400);
      }
      organizationId = new mongoose.Types.ObjectId(queryOrgId);
      
      // Verify org exists
      const org = await Organization.findById(organizationId);
      if (!org) {
        return jsonError(UserErrors.orgNotFound, 404);
      }
    } else {
      if (!currentUser.organizationId) {
        return jsonError(UserErrors.noOrganization, 400);
      }
      organizationId = new mongoose.Types.ObjectId(currentUser.organizationId);
    }

    await connectDB();

    // Check for duplicate email in this org
    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
      organizationId,
    });
    if (existingUser) {
      return jsonError(UserErrors.emailExists, 409);
    }

    // Generate temporary password
    const tempPassword = generateTempPassword(12);

    // Create user
    const newUser = new User({
      email: email.trim().toLowerCase(),
      password: tempPassword,
      name: name.trim(),
      role,
      organizationId,
      mustChangePassword: true,
      createdBy: new mongoose.Types.ObjectId(currentUser.id),
    });

    await newUser.save();

    // Get org name for logging
    const org = await Organization.findById(organizationId).lean();

    // Log temporary password for development/testing
    const divider = "=".repeat(70);
    const innerDivider = "-".repeat(70);
    console.log(`
${divider}
🔑 NEW USER CREATED - TEMPORARY PASSWORD
${divider}
Organization: ${org?.name ?? organizationId.toString()}
User Email:   ${newUser.email}
User Name:    ${newUser.name}
Role:         ${newUser.role}
${innerDivider}
📋 TEMPORARY PASSWORD: ${tempPassword}
${innerDivider}
Created By:   ${currentUser.email}
${divider}
`);

    return jsonOk(
      {
        success: true,
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          mustChangePassword: newUser.mustChangePassword,
          createdAt: newUser.createdAt,
        },
        message: UserErrors.successMessage,
      },
      201
    );
  } catch (err) {
    console.error("POST /api/users error:", err);

    // Handle duplicate key error
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === 11000
    ) {
      return jsonError(UserErrors.emailExists, 409);
    }

    return jsonError(UserErrors.serverError, 500);
  }
}
