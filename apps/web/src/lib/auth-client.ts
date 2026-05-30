import { convexClient } from '@convex-dev/better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

// No baseURL: requests go to the same origin as the web (default), then
// are proxied to Convex by the `/api/auth/$` route. Cookies are HTTP-only
// and same-origin — no `crossDomainClient` plugin needed.
export const authClient = createAuthClient({
  plugins: [convexClient()],
})

export const { useSession, signIn, signUp, signOut } = authClient
