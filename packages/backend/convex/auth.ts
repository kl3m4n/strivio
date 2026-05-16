import { betterAuth } from "better-auth";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { crossDomain } from "@convex-dev/better-auth/plugins";

import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

export const siteUrl = () =>
  process.env.SITE_URL ?? "http://localhost:3000";

export const authComponent = createClient<DataModel>(components.betterAuth);

// Roles live in our `members` table (see schema.ts / users.ts), keyed by
// organization. The BetterAuth component's static validator rejects unknown
// user-table fields, so we don't try to put role-related data on the
// BetterAuth user.
//
// `crossDomain` is REQUIRED: the BetterAuth API runs on the Convex `.site`
// origin while the web runs on `localhost:3000`. Browsers won't propagate
// session cookies across origins on http; the plugin instead echoes the
// session token via the `Set-Better-Auth-Cookie` response header and the
// matching `crossDomainClient` plugin (web side) restores it on every
// request as a `Better-Auth-Cookie` header.
export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: siteUrl(),
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    plugins: [crossDomain({ siteUrl: siteUrl() })],
  });
