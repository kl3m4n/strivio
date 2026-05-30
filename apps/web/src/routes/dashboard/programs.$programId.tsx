import { convexQuery } from '@convex-dev/react-query'
import { api } from '@strivio/backend/api'
import type { Id } from '@strivio/backend/dataModel'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/programs/$programId')({
  loader: async ({ context, params }) => {
    const programId = params.programId as Id<'programs'>
    await context.queryClient.ensureQueryData(convexQuery(api.programs.getById, { programId }))
  },
  component: ProgramLayout,
})

function ProgramLayout() {
  // Le layout est volontairement minimal — chaque enfant gère son propre
  // header. On le garde uniquement pour pré-charger le programme.
  return <Outlet />
}
