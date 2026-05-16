import type { QueryClient } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import type { ConvexReactClient } from 'convex/react'
import { ConvexProvider } from 'convex/react'
import { createClients } from './lib/convex'
import { routeTree } from './routeTree.gen'

export interface RouterAppContext {
  convex: ConvexReactClient
  queryClient: QueryClient
}

export function getRouter() {
  const { convex, queryClient } = createClients()
  const router = createTanStackRouter({
    routeTree,
    context: { convex, queryClient } satisfies RouterAppContext,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    Wrap: ({ children }) => <ConvexProvider client={convex}>{children}</ConvexProvider>,
  })
  setupRouterSsrQueryIntegration({ router, queryClient })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
