import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { env } from './env'

// The BetterAuth client talks to the Convex HTTP routes registered in
// `packages/backend/convex/http.ts` — the `*.convex.site` host (or
// `localhost:3211` in local dev). Because that's a different origin from
// the web app, the `crossDomainClient` plugin replaces cookie-based session
// transport with a localStorage-stored `Better-Auth-Cookie` header. The
// matching server-side `crossDomain` plugin lives in `convex/auth.ts`.
export const authClient = createAuthClient({
  baseURL: env.convexSiteUrl,
  plugins: [convexClient(), crossDomainClient()],
})

export const { useSession, signIn, signUp, signOut } = authClient
