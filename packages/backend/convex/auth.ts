import { createClient, type GenericCtx } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { betterAuth } from 'better-auth'

import { components } from './_generated/api'
import type { DataModel } from './_generated/dataModel'
import authConfig from './auth.config'

export const siteUrl = () => process.env.SITE_URL ?? 'http://localhost:3000'

export const authComponent = createClient<DataModel>(components.betterAuth)

// Roles live in our `members` table (see schema.ts / users.ts), keyed by
// organization. The BetterAuth component's static validator rejects unknown
// user-table fields, so we don't try to put role-related data on the
// BetterAuth user.
//
// The `convex` plugin issues JWTs that the Convex client uses to populate
// `ctx.auth.getUserIdentity()` in queries/mutations. Auth requests reach
// here via the same-origin proxy (`apps/web/src/routes/api/auth/$.ts`), so
// cookies are HTTP-only and same-origin — no cross-domain plumbing needed.
export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: siteUrl(),
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    plugins: [convex({ authConfig })],
  })
