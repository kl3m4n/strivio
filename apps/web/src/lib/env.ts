function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing env var ${name}. Check .env.local in apps/web (run \`npx convex dev\` in packages/backend at least once to populate Convex URLs).`,
    )
  }
  return value
}

function rejectLocalhostInProduction(name: string, value: string): string {
  if (!import.meta.env.PROD) return value

  const url = new URL(value)
  if (['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
    throw new Error(`${name} points to ${value}. Set the production Convex URL in Vercel instead of a local URL.`)
  }
  return value
}

export const env = {
  convexUrl: rejectLocalhostInProduction(
    'VITE_CONVEX_URL',
    required('VITE_CONVEX_URL', import.meta.env.VITE_CONVEX_URL),
  ),
  convexSiteUrl: rejectLocalhostInProduction(
    'VITE_CONVEX_SITE_URL',
    required('VITE_CONVEX_SITE_URL', import.meta.env.VITE_CONVEX_SITE_URL),
  ),
}
