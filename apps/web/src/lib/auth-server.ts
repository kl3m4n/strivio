import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'
import { env } from './env'

// `handler` is the proxy mounted at /api/auth/$ — it forwards every
// BetterAuth request to the Convex `.site` host while keeping the browser's
// origin pinned to the web app. That's what makes cookies same-origin.
//
// `getToken` reads the JWT from the request cookies on the server, so SSR
// loaders can make authenticated Convex calls.
//
// `fetchAuthQuery / fetchAuthMutation / fetchAuthAction` are sugar for
// authenticated server-side Convex calls; not used in phase 2 but handy
// later.
export const { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } = convexBetterAuthReactStart({
  convexUrl: env.convexUrl,
  convexSiteUrl: env.convexSiteUrl,
})
