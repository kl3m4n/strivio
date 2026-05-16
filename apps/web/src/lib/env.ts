function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing env var ${name}. Check .env.local in apps/web (run \`npx convex dev\` in packages/backend at least once to populate Convex URLs).`,
    )
  }
  return value
}

export const env = {
  convexUrl: required('VITE_CONVEX_URL', import.meta.env.VITE_CONVEX_URL),
  convexSiteUrl: required('VITE_CONVEX_SITE_URL', import.meta.env.VITE_CONVEX_SITE_URL),
}
