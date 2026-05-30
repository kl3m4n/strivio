import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useRouteContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { createServerFn } from '@tanstack/react-start'
import { Toaster } from '@/components/ui/sonner'
import { authClient } from '@/lib/auth-client'
import { getToken } from '@/lib/auth-server'
import type { RouterAppContext } from '../router'
import appCss from '../styles.css?url'

// Read the BetterAuth JWT from request cookies on the server. The token
// is then pushed into both the SSR HTTP client (so loaders can run authed
// queries during SSR) and the React provider (for browser hydration).
const getAuth = createServerFn({ method: 'GET' }).handler(async () => {
  return await getToken()
})

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Strivio' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  beforeLoad: async () => {
    // DEBUG: getAuth() neutralisé
    return { token: null }
  },
  shellComponent: RootDocument,
})

function RootDocument() {
  const { token } = useRouteContext({ from: Route.id })
  const { convexQueryClient } = useRouteContext({ from: Route.id })
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* DEBUG: provider bypassé */}
        <Outlet />
        <Toaster position="top-right" richColors />
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
