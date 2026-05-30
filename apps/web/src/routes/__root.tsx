import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useRouteContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { createServerFn } from '@tanstack/react-start'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { authClient } from '@/lib/auth-client'
import { getToken } from '@/lib/auth-server'
import type { RouterAppContext } from '../router'
import appCss from '../styles.css?url'

function isMissingSessionError(error: unknown) {
  if (!(error instanceof Error)) return false
  const maybeStatus = 'status' in error ? error.status : undefined
  const maybeCause = 'cause' in error ? error.cause : undefined
  const maybeCode =
    typeof maybeCause === 'object' && maybeCause !== null && 'code' in maybeCause ? maybeCause.code : undefined

  return maybeStatus === 401 || maybeCode === 'UNAUTHORIZED'
}

const getAuth = createServerFn({ method: 'GET' }).handler(async (ctx) => {
  const { request } = ctx as typeof ctx & { request: Request }
  const { getSessionCookie } = await import('better-auth/cookies')
  const headers = new Headers(request.headers)

  if (!getSessionCookie(headers)) {
    return undefined
  }

  try {
    return await getToken()
  } catch (error) {
    if (isMissingSessionError(error)) {
      return undefined
    }
    throw error
  }
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
    }
    return { isAuthenticated: !!token, token }
  },
  component: RootComponent,
})

function RootComponent() {
  const context = useRouteContext({ from: Route.id })
  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ConvexBetterAuthProvider>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
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
