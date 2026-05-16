import { ConvexQueryClient } from '@convex-dev/react-query'
import { QueryClient } from '@tanstack/react-query'
import { ConvexReactClient } from 'convex/react'
import { env } from './env'

const isServer = typeof window === 'undefined'

type Clients = { convex: ConvexReactClient; queryClient: QueryClient }

let browserClients: Clients | null = null

function build(): Clients {
  const convex = new ConvexReactClient(env.convexUrl, {
    unsavedChangesWarning: false,
  })
  const convexQueryClient = new ConvexQueryClient(convex)
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  })
  convexQueryClient.connect(queryClient)
  return { convex, queryClient }
}

/**
 * Browser side : single shared instance for the whole tab lifetime. Avoids
 *   - opening N WebSockets when TanStack Start re-instantiates the router
 *   - splitting the React Query cache between navigations
 *
 * Server side (SSR) : fresh per request so the React Query cache (and any
 * future auth state) never leak across users.
 */
export function createClients(): Clients {
  if (isServer) return build()
  if (!browserClients) browserClients = build()
  return browserClients
}
