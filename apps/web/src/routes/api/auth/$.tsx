import { createFileRoute } from '@tanstack/react-router'
import { handler } from '@/lib/auth-server'

// Catchall proxy for every BetterAuth endpoint
// (/api/auth/sign-in/email, /api/auth/get-session, /api/auth/jwks, etc.).
// The handler forwards the request to the Convex `.site` host, so the
// browser keeps talking to localhost:3000 — same-origin cookies.
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
      PUT: ({ request }) => handler(request),
      DELETE: ({ request }) => handler(request),
      PATCH: ({ request }) => handler(request),
      OPTIONS: ({ request }) => handler(request),
      HEAD: ({ request }) => handler(request),
    },
  },
})
