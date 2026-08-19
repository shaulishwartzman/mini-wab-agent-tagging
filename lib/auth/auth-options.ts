/**
 * NextAuth.js configuration for multi-tenant authentication.
 *
 * Credentials provider accepts: organizationSlug + email + password
 * - First looks up the organization by slug
 * - Then finds the user by email within that organization
 * - SYSTEM_ADMIN users login without an organization (slug optional/ignored)
 *
 * Session includes: id, email, name, role, organizationId, mustChangePassword
 *
 * @see app/api/auth/[...nextauth]/route.ts - Route handler using this config
 * @see middleware.ts - Route protection using session
 * @see models/User.ts - User model with comparePassword method
 * @see models/Organization.ts - Organization model for slug lookup
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/models/User";
import Organization from "@/models/Organization";
import { UserRole } from "@/lib/types";
export { canCreateUsers, canCreateRole } from "@/lib/auth/permissions";

/**
 * App-specific authenticated user shape stored in the JWT/session.
 * Kept as a plain type (not extending NextAuth User) to avoid recursive
 * module-augmentation cycles.
 */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string | null;
  organizationName: string | null;
  mustChangePassword: boolean;
};

/**
 * Declare module augmentation for NextAuth types.
 * Extends Session and JWT to include our custom fields.
 */
declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }

  interface User {
    role: string;
    organizationId: string | null;
    organizationName: string | null;
    mustChangePassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string;
    organizationId?: string | null;
    organizationName?: string | null;
    mustChangePassword?: boolean;
  }
}

/**
 * NextAuth configuration options.
 *
 * Uses Credentials provider with custom authorize logic:
 * 1. For org users: lookup org by slug → find user by email + orgId → verify password
 * 2. For SYSTEM_ADMIN: find admin by email (no org) → verify password
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        organizationSlug: {
          label: "Organization",
          type: "text",
          placeholder: "your-organization",
        },
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      /**
       * Authorize user with organization slug + email + password.
       *
       * @param credentials - { organizationSlug, email, password }
       * @returns SessionUser on success, null on failure
       */
      async authorize(credentials): Promise<SessionUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;
        const orgSlug = credentials.organizationSlug?.toLowerCase().trim();

        // Try SYSTEM_ADMIN login (no org required)
        if (!orgSlug) {
          const adminUser = await User.findSystemAdmin(email);
          if (!adminUser) {
            return null;
          }

          const isValid = await adminUser.comparePassword(password);
          if (!isValid) {
            return null;
          }

          return {
            id: adminUser._id.toString(),
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
            organizationId: null,
            organizationName: null,
            mustChangePassword: adminUser.mustChangePassword,
          };
        }

        // Organization user login
        const organization = await Organization.findOne({ slug: orgSlug });
        if (!organization) {
          return null;
        }

        const user = await User.findByEmailAndOrg(email, organization._id);
        if (!user) {
          return null;
        }

        const isValid = await user.comparePassword(password);
        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: organization._id.toString(),
          organizationName: organization.name,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * JWT callback - persist custom fields in the token.
     * Called on sign-in and when the client calls `useSession().update()`.
     */
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Initial sign in - copy user data to token
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.mustChangePassword = user.mustChangePassword;
      }

      // Client session update (e.g. after password change)
      if (trigger === "update" && session && typeof session === "object") {
        const patch = session as { mustChangePassword?: boolean };
        if (typeof patch.mustChangePassword === "boolean") {
          token.mustChangePassword = patch.mustChangePassword;
        }
      }

      return token;
    },

    /**
     * Session callback - expose custom fields to the client.
     * Called whenever session is checked.
     */
    async session({ session, token }) {
      session.user = {
        id: token.id ?? "",
        email: token.email ?? "",
        name: token.name ?? "",
        role: token.role ?? "",
        organizationId: token.organizationId ?? null,
        organizationName: token.organizationName ?? null,
        mustChangePassword: Boolean(token.mustChangePassword),
      };
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
};
