import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useRouteContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { createServerFn } from '@tanstack/react-start'
import { Toaster } from '@/components/ui/sonner'
import { authClient } from '@/lib/auth-client'
import { getTokenForSsr } from '@/lib/auth-server'
import type { RouterAppContext } from '../router'
import appCss from '../styles.css?url'

const getAuth = createServerFn({ method: 'GET' }).handler(async () => {
  return await getTokenForSsr()
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
  beforeLoad: async ({ context }) => {
    const token = await getAuth()
    if (token) {
      context.convexQueryClient.serverHttpClient?.setAuth(token)
    } else {
      context.convexQueryClient.serverHttpClient?.clearAuth()
    }
    return { token }
  },
  shellComponent: RootDocument,
})

function RootDocument() {
  const { convexQueryClient, token } = useRouteContext({ from: Route.id })
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        <ConvexBetterAuthProvider client={convexQueryClient.convexClient} authClient={authClient} initialToken={token}>
          <Outlet />
        </ConvexBetterAuthProvider>
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
