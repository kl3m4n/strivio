import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'
import { env } from './env'

// `handler` is the same-origin proxy mounted at /api/auth/$. It forwards
// BetterAuth requests to the Convex `.site` host while keeping cookies on the
// web app origin.
//
// `getToken` reads the BetterAuth cookie from the current TanStack Start
// request and exchanges it for the Convex JWT used by SSR loaders.
export const { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } = convexBetterAuthReactStart({
  convexUrl: env.convexUrl,
  convexSiteUrl: env.convexSiteUrl,
})
