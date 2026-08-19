/**
 * API endpoint for organization management.
 *
 * GET /api/organizations
 *   - Lists all organizations (SYSTEM_ADMIN only)
 *   - Returns organization details with user counts
 *
 * POST /api/organizations
 *   - Creates a new organization
 *   - Creates the first CISO user with a temporary password
 *   - Logs temporary password to console (email integration pending)
 *   - PUBLIC: This endpoint is unauthenticated (anyone can register an org)
 *
 * @see lib/api/organizations.ts - Client helper
 * @see components/auth/RegisterOrgForm.tsx - Registration form
 * @see components/admin/AdminDashboard.tsx - Admin panel UI
 * @see models/Organization.ts - Organization model
 * @see models/User.ts - User model
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import Organization from "@/models/Organization";
import User from "@/models/User";
import { UserRole } from "@/lib/types";
import { generateTempPassword } from "@/lib/auth/password";
import { jsonError, jsonOk } from "@/lib/api/jsonResponse";
import { slugify } from "@/lib/utils/slugify";
import { OrganizationErrors } from "@/lib/errors/auth";
import { getAuthUser } from "@/lib/auth/session";
import { AdminErrors } from "@/lib/errors/admin";

/** Request body shape for organization registration. */
interface RegisterOrgBody {
  name?: string;
  cisoName?: string;
  cisoEmail?: string;
}

/** Shape of an organization in the GET response. */
interface OrganizationListItem {
  id: string;
  name: string;
  slug: string;
  userCount: number;
  createdAt: string;
}

/**
 * GET /api/organizations
 *
 * List all organizations in the system.
 * SYSTEM_ADMIN only.
 *
 * Returns:
 *   - 200: { organizations: OrganizationListItem[] }
 *   - 401: Unauthorized (not logged in)
 *   - 403: Forbidden (not SYSTEM_ADMIN)
 *   - 500: Server error
 */
export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return jsonError(AdminErrors.unauthorized, 401);
    }

    if (user.role !== UserRole.SYSTEM_ADMIN) {
      return jsonError(AdminErrors.forbidden, 403);
    }

    await connectDB();

    // Fetch all organizations
    const orgs = await Organization.find({}).sort({ createdAt: -1 }).lean();

    // Get user counts per organization using aggregation
    const userCounts = await User.aggregate([
      { $match: { organizationId: { $ne: null } } },
      { $group: { _id: "$organizationId", count: { $sum: 1 } } },
    ]);

    // Create a lookup map for counts
    const countMap = new Map<string, number>(
      userCounts.map((item) => [item._id.toString(), item.count])
    );

    // Build response array with user counts
    const organizations: OrganizationListItem[] = orgs.map((org) => ({
      id: org._id.toString(),
      name: org.name,
      slug: org.slug,
      userCount: countMap.get(org._id.toString()) ?? 0,
      createdAt: org.createdAt.toISOString(),
    }));

    return jsonOk({ organizations });
  } catch (err) {
    console.error("Error fetching organizations:", err);
    return jsonError(AdminErrors.serverError, 500);
  }
}

/**
 * POST /api/organizations
 *
 * Register a new organization and its first CISO user.
 *
 * Body:
 *   - name: Organization display name (required)
 *   - cisoName: First CISO full name (required)
 *   - cisoEmail: First CISO email address (required)
 *
 * Returns:
 *   - 201: { success: true, organization: { id, name, slug } }
 *   - 400: Missing or invalid fields
 *   - 409: Organization slug already exists or email already taken
 *   - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterOrgBody;

    const { name, cisoName, cisoEmail } = body;

    // Validate required fields
    if (!name?.trim()) {
      return jsonError(OrganizationErrors.missingName, 400);
    }
    if (!cisoName?.trim()) {
      return jsonError(OrganizationErrors.missingCisoName, 400);
    }
    if (!cisoEmail?.trim()) {
      return jsonError(OrganizationErrors.missingCisoEmail, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cisoEmail.trim())) {
      return jsonError(OrganizationErrors.invalidCisoEmail, 400);
    }

    // Generate slug from name
    const slug = slugify(name.trim());
    if (!slug) {
      return jsonError(OrganizationErrors.invalidName, 400);
    }

    await connectDB();

    // Check if organization slug already exists
    const existingOrg = await Organization.findOne({ slug });
    if (existingOrg) {
      return jsonError(OrganizationErrors.slugExists, 409);
    }

    // Create organization
    const organization = new Organization({
      name: name.trim(),
      slug,
    });
    await organization.save();

    // Generate temporary password for first CISO
    const tempPassword = generateTempPassword(12);

    // Create first CISO user
    const cisoUser = new User({
      email: cisoEmail.trim().toLowerCase(),
      password: tempPassword,
      name: cisoName.trim(),
      role: UserRole.CISO,
      organizationId: organization._id,
      mustChangePassword: true,
      createdBy: null, // First user has no creator
    });

    try {
      await cisoUser.save();
    } catch (err) {
      // If user creation fails, delete the organization to maintain consistency
      await Organization.findByIdAndDelete(organization._id);

      // Check for duplicate email
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === 11000
      ) {
        return jsonError(OrganizationErrors.emailExists, 409);
      }
      throw err;
    }

    // Log temporary password for development/testing
    // TODO: Replace with actual email sending in production
    const divider = "=".repeat(70);
    const innerDivider = "-".repeat(70);
    console.log(`
${divider}
🏢 NEW ORGANIZATION REGISTERED - CISO TEMPORARY PASSWORD
${divider}
Organization: ${organization.name}
Slug:         ${organization.slug}
CISO Email:   ${cisoUser.email}
${innerDivider}
📋 TEMPORARY PASSWORD: ${tempPassword}
${innerDivider}
${divider}
`);

    return jsonOk(
      {
        success: true,
        organization: {
          id: organization._id.toString(),
          name: organization.name,
          slug: organization.slug,
        },
        message: OrganizationErrors.successMessage,
      },
      201
    );
  } catch (err) {
    console.error("Organization registration error:", err);
    return jsonError(OrganizationErrors.serverError, 500);
  }
}
