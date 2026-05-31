import { convexQuery } from '@convex-dev/react-query'
import { api } from '@strivio/backend/api'
import type { Doc, Id } from '@strivio/backend/dataModel'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

type DashboardContext = { organization: { organizationId: Id<'organizations'> } }

export const Route = createFileRoute('/dashboard/programs/$slug')({
  // Résout le programme par son slug (unique dans l'org) une fois ici, et
  // l'expose aux routes enfants via le contexte. L'URL porte le slug ; l'`_id`
  // Convex reste interne (queries days/blocks).
  beforeLoad: async ({ context, params }) => {
    const { organizationId } = (context as unknown as DashboardContext).organization
    const program = await context.queryClient.fetchQuery(
      convexQuery(api.programs.getBySlug, { organizationId, slug: params.slug }),
    )
    if (!program) throw redirect({ to: '/dashboard' })
    return { program }
  },
  component: ProgramLayout,
})

function ProgramLayout() {
  return <Outlet />
}

export type ProgramContext = { program: Doc<'programs'> }
