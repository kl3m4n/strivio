import { getAuthConfigProvider } from '@convex-dev/better-auth/auth-config'
import type { AuthConfig } from 'convex/server'

// JWKS is served dynamically by the BetterAuth HTTP routes (registered in
// http.ts). No static JWKS env var needed for dev.
export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig
