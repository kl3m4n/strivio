import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'
import { env } from './env'

// Same-origin proxy mounted at /api/auth/$. Reçoit la Request en argument →
// pas impacté par le bug ci-dessous, on le garde.
export const { handler } = convexBetterAuthReactStart({
  convexUrl: env.convexUrl,
  convexSiteUrl: env.convexSiteUrl,
})

// Échange le cookie de session BetterAuth (sur la requête SSR entrante) contre
// le JWT Convex, en relayant les cookies vers l'endpoint token du déploiement
// Convex `.site`.
//
// On NE passe PAS par le `getToken` de la lib : `@convex-dev/better-auth@0.12.2`
// y lit les headers via `getRequestHeaders()` de `@tanstack/react-start/server`,
// API supprimée en react-start >= 1.168 → l'appel throw en SSR → stream de rendu
// figé jusqu'au timeout (60s). Ici on prend la Request explicitement et on
// reproduit l'échange à la main, avec timeout de garde.
export async function getTokenFromRequest(request: Request): Promise<string | undefined> {
  const { getSessionCookie } = await import('better-auth/cookies')
  // Anonyme (pas de cookie de session) → pas d'appel réseau.
  if (!getSessionCookie(new Headers(request.headers))) return undefined

  const headers = new Headers(request.headers)
  headers.delete('content-length')
  headers.delete('transfer-encoding')
  headers.set('accept-encoding', 'identity')
  headers.set('host', new URL(env.convexSiteUrl).host)

  try {
    const res = await fetch(`${env.convexSiteUrl}/api/auth/convex/token`, {
      headers,
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return undefined
    const data = (await res.json().catch(() => null)) as { token?: string } | null
    return data?.token ?? undefined
  } catch {
    return undefined
  }
}
