import { httpRouter } from 'convex/server'
import { authComponent, createAuth, siteUrl } from './auth'

const http = httpRouter()

authComponent.registerRoutes(http, createAuth, {
  cors: {
    allowedOrigins: [siteUrl()],
  },
})

export default http
