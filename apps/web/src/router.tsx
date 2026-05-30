import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { createClients } from './lib/convex'
import { routeTree } from './routeTree.gen'

export interface RouterAppContext {
  convexQueryClient: ConvexQueryClient
  queryClient: QueryClient
}

export function getRouter() {
  const { convexQueryClient, queryClient } = createClients()
  const router = createTanStackRouter({
    routeTree,
    context: { convexQueryClient, queryClient } satisfies RouterAppContext,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })
  setupRouterSsrQueryIntegration({ router, queryClient })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
