import { ConvexQueryClient } from '@convex-dev/react-query'
import { QueryClient } from '@tanstack/react-query'
import { env } from './env'

const isServer = typeof window === 'undefined'

type Clients = {
  convexQueryClient: ConvexQueryClient
  queryClient: QueryClient
}

let browserClients: Clients | null = null

function build(): Clients {
  // `expectAuth: true` keeps browser queries from racing before BetterAuth has
  // installed the Convex token. SSR gets its token in the root beforeLoad.
  const convexQueryClient = new ConvexQueryClient(env.convexUrl, {
    expectAuth: true,
    unsavedChangesWarning: false,
  })
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  })
  convexQueryClient.connect(queryClient)
  return { convexQueryClient, queryClient }
}

/**
 * Browser: single shared instance for the whole tab lifetime.
 * SSR: fresh per request so caches and auth state never leak across users.
 */
export function createClients(): Clients {
  if (isServer) return build()
  if (!browserClients) browserClients = build()
  return browserClients
}
