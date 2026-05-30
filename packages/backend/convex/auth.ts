import { createClient, type GenericCtx } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { type BetterAuthOptions, betterAuth } from 'better-auth/minimal'

import { components } from './_generated/api'
import type { DataModel } from './_generated/dataModel'
import authConfig from './auth.config'

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuthOptions = (ctx: GenericCtx<DataModel>) =>
  ({
    appName: 'Strivio',
    baseURL: process.env.SITE_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    plugins: [convex({ authConfig })],
  }) satisfies BetterAuthOptions

// Roles live in our `members` table (see schema.ts / users.ts), keyed by
// organization. The BetterAuth component's static validator rejects unknown
// user-table fields, so we don't try to put role-related data on the
// BetterAuth user.
//
// The `convex` plugin issues JWTs that the Convex client uses to populate
// `ctx.auth.getUserIdentity()` in queries/mutations. Auth requests reach
// here via the same-origin proxy (`apps/web/src/routes/api/auth/$.ts`), so
// cookies are HTTP-only and same-origin — no cross-domain plumbing needed.
export const createAuth = (ctx: GenericCtx<DataModel>) => betterAuth(createAuthOptions(ctx))
