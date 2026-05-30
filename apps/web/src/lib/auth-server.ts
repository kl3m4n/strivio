import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'
import { env } from './env'

const SSR_AUTH_TIMEOUT_MS = 2500

// `handler` is the same-origin proxy mounted at /api/auth/$. It forwards
// BetterAuth requests to the Convex `.site` host while keeping cookies on the
// web app origin.
//
// `getToken` reads the BetterAuth cookie from the current TanStack Start
// request and exchanges it for the Convex JWT used by SSR loaders.
export const { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } = convexBetterAuthReactStart({
  convexUrl: env.convexUrl,
  convexSiteUrl: env.convexSiteUrl,
  jwtCache: {
    enabled: true,
    isAuthError: () => true,
  },
})

export async function getTokenForSsr(): Promise<string | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return (
      (await Promise.race([
        getToken(),
        new Promise<null>((resolve) => {
          timeout = setTimeout(() => resolve(null), SSR_AUTH_TIMEOUT_MS)
        }),
      ])) ?? null
    )
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}
