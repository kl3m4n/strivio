import { httpRouter } from 'convex/server'
import { authComponent, createAuth } from './auth'

const http = httpRouter()

// All BetterAuth routes (sign-in/up/out, get-session, JWKS, convex JWT
// endpoint, etc.). Reached by the web via the same-origin proxy in
// `apps/web/src/routes/api/auth/$.ts` — so no CORS config needed.
authComponent.registerRoutes(http, createAuth)

export default http
