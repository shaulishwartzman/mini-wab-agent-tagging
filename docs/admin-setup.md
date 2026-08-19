# System Admin Setup Guide

This guide explains how to create and manage SYSTEM_ADMIN users in the AI Governance Platform.

## Overview

SYSTEM_ADMIN users have system-wide access and are not bound to any organization. They can:
- View all organizations
- View users across all organizations
- View agent requests across all organizations

## Architecture: Two Seeding Methods

The system provides **two separate files** for creating SYSTEM_ADMIN users, each designed for different scenarios:

| File | Type | When to Use |
|------|------|-------------|
| `scripts/seed-admin.ts` | CLI tool | Development, manual setup, one-time creation |
| `lib/db/seed-admin.ts` | Auto-seeder | Deployments, CI/CD, containerized environments |

### Why Two Files?

1. **`scripts/seed-admin.ts`** (CLI Tool)
   - Run manually with `npm run seed:admin`
   - Interactive prompts for email/password/name
   - Or pass arguments: `--email`, `--password`, `--name`
   - Best for: developers, initial setup, creating additional admins

2. **`lib/db/seed-admin.ts`** (Auto-Seeder)
   - Runs automatically when the app connects to MongoDB
   - Reads from environment variables (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`)
   - Idempotent: only creates admin if one doesn't exist
   - Best for: Render, Vercel, Docker, CI/CD pipelines

### Functions Reference

#### `scripts/seed-admin.ts`

| Function | Purpose |
|----------|---------|
| `parseArgs()` | Parse `--email`, `--password`, `--name` from command line |
| `prompt(question, hidden)` | Interactive input with optional password masking |
| `validateEmail(email)` | Check email format with regex |
| `validatePassword(password)` | Check password meets requirements (8+ chars) |
| `main()` | Entry point: parse args, prompt, validate, connect, insert |

#### `lib/db/seed-admin.ts`

| Function | Purpose |
|----------|---------|
| `seedAdminFromEnv()` | Check env vars, validate, create admin if not exists |

## Creating the First Admin

### Option 1: CLI Seed Script (Recommended for Development)

Use the interactive CLI tool.

**Important:** The CLI script does NOT auto-load `.env.local`. You must set `MONGODB_URI` in your shell first.

**PowerShell (Windows):**
```powershell
$env:MONGODB_URI = "mongodb+srv://user:pass@cluster.mongodb.net/agentRequestDB?retryWrites=true&w=majority"
npm run seed:admin
```

**Bash (Mac/Linux):**
```bash
export MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/agentRequestDB?retryWrites=true&w=majority"
npm run seed:admin
```

You'll be prompted for:
- **Email**: Admin email address
- **Password**: At least 8 characters (hidden with `*` as you type)
- **Name**: Display name (defaults to "System Admin")

Or pass arguments directly:

```powershell
$env:MONGODB_URI = "your-connection-string"
npm run seed:admin -- --email admin@example.com --password "YourSecurePassword!" --name "Admin Name"
```

**Requirements:**
- `MONGODB_URI` environment variable must be set (copy value from `.env.local`)
- Node.js / npm installed
- Your IP must be whitelisted in MongoDB Atlas

### Option 2: Auto-Seeding (Recommended for Deployments)

Set these environment variables before starting the app:

```bash
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=YourSecurePassword!
SEED_ADMIN_NAME=System Admin  # Optional, defaults to "System Admin"
```

On first app startup, if no SYSTEM_ADMIN with that email exists, one will be created automatically.

**Perfect for:**
- Render, Vercel, Railway deployments
- Docker containers
- CI/CD pipelines

**Security notes:**
- The admin is only created once (idempotent)
- You can remove the env vars after first deployment
- Password is bcrypt-hashed before storage

### Option 3: Manual MongoDB Insert

For direct database access (e.g., MongoDB Atlas):

1. Generate a bcrypt hash for your password (cost 12):
   ```bash
   npx tsx -e "import bcrypt from 'bcryptjs'; console.log(bcrypt.hashSync('YourPassword', 12))"
   ```

2. Insert into the `users` collection:
   ```json
   {
     "email": "admin@example.com",
     "password": "<bcrypt-hash-from-step-1>",
     "name": "System Admin",
     "role": "SYSTEM_ADMIN",
     "organizationId": null,
     "mustChangePassword": false,
     "createdBy": null,
     "createdAt": { "$date": "2024-01-01T00:00:00.000Z" },
     "updatedAt": { "$date": "2024-01-01T00:00:00.000Z" }
   }
   ```

## Logging In as Admin

### Dedicated Admin Login Page

Go to `/admin/login` and enter:
- **Email**: Your admin email
- **Password**: Your admin password

### Regular Login Page

Alternatively, go to `/login` and:
- Leave the **Organization Name** field **empty**
- Enter your admin email and password

## Admin Dashboard

After logging in, you'll be redirected to `/admin` where you can:

1. **View Organizations**: See all registered organizations with user counts
2. **Drill-Down to Users**: Click on any organization to view its users
3. **Navigation**: Use the "לוח בקרה" button in the header to return to the admin panel

## Security Considerations

1. **Strong Passwords**: Use at least 12 characters with mixed case, numbers, and symbols

2. **Limited Access**: Only share admin credentials with trusted system administrators

3. **Environment Variables**: For production deployments:
   - Use secrets management (Render secrets, Vercel environment variables)
   - Remove `SEED_ADMIN_*` vars after initial setup if desired

4. **Audit Trail**: Admin actions are logged with timestamps in the database

5. **No Organization Binding**: SYSTEM_ADMIN users have `organizationId: null` and cannot be assigned to any organization

## Troubleshooting

### "Admin already exists" when seeding

This is expected if you've already created an admin with that email. The seed script is idempotent and won't overwrite existing admins.

### Can't log in as admin

1. Verify the email is correct (case-insensitive)
2. Check that `organizationId` is `null` in the database
3. Verify `role` is exactly `"SYSTEM_ADMIN"`
4. Try resetting via the seed script with a new email

### Auto-seed not working

1. Check that both `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set
2. Verify password is at least 8 characters
3. Check server logs for `[seed-admin]` messages
4. Ensure `MONGODB_URI` is correct

## Related Files

| Path | Purpose |
| --- | --- |
| `scripts/seed-admin.ts` | CLI seed script |
| `lib/db/seed-admin.ts` | Auto-seeding module |
| `lib/db/mongodb.ts` | Calls auto-seed on connection |
| `app/admin/login/page.tsx` | Admin login page |
| `app/admin/page.tsx` | Admin dashboard |
| `components/auth/AdminLoginForm.tsx` | Admin login form |
| `components/admin/AdminDashboard.tsx` | Admin dashboard UI |
