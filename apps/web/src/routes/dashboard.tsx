import { convexQuery } from '@convex-dev/react-query'
import { api } from '@strivio/backend/api'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Topbar } from '@/components/dashboard/topbar'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }

    const me = await context.queryClient.fetchQuery(convexQuery(api.users.me, {}))
    if (!me) {
      throw redirect({ to: '/login' })
    }
    const organizations = await context.queryClient.fetchQuery(convexQuery(api.users.myOrganizations, {}))
    if (organizations.length === 0) {
      // User is logged in but not a coach of any org → not allowed here.
      throw redirect({ to: '/' })
    }
    // MVP : single programmation. On expose la première directement.
    return { user: me, organization: organizations[0] }
  },
  loader: ({ context }) => ({
    user: context.user,
    organization: context.organization,
  }),
  component: DashboardLayout,
})

function DashboardLayout() {
  const { user, organization } = Route.useLoaderData()
  return (
    <div className="flex h-screen flex-col bg-muted/30">
      <Topbar user={user} organizationName={organization.name} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
