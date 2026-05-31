import { convexQuery } from '@convex-dev/react-query'
import { api } from '@strivio/backend/api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { CreateProgramDialog } from '@/components/dashboard/create-program-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/dashboard/')({
  loader: async ({ context }) => {
    // Reads `organization` from the /dashboard layout context.
    const parent = context as unknown as {
      organization: {
        organizationId: import('@strivio/backend/dataModel').Id<'organizations'>
        name: string
        slug: string
      }
    }
    await context.queryClient.ensureQueryData(
      convexQuery(api.programs.listForOrg, { organizationId: parent.organization.organizationId }),
    )
  },
  component: ProgramsIndex,
})

function ProgramsIndex() {
  const { organization } = Route.useRouteContext()
  const { data: programs } = useSuspenseQuery(
    convexQuery(api.programs.listForOrg, { organizationId: organization.organizationId }),
  )

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Programmes</h1>
          <p className="text-muted-foreground text-sm">{organization.name}</p>
        </div>
        <CreateProgramDialog
          organizationId={organization.organizationId}
          trigger={
            <Button>
              <Plus className="-ml-1 h-4 w-4" /> Nouveau programme
            </Button>
          }
        />
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Aucun programme pour l'instant. Crée ton premier.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <Link
              key={p._id}
              to="/dashboard/programs/$slug"
              params={{ slug: p.slug }}
              className="block transition hover:opacity-90"
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="truncate">{p.name}</span>
                    {!p.isPublished ? (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 text-xs">
                        Brouillon
                      </span>
                    ) : null}
                  </CardTitle>
                  <CardDescription className="truncate">/{p.slug}</CardDescription>
                </CardHeader>
                {p.description ? (
                  <CardContent className="text-muted-foreground text-sm">{p.description}</CardContent>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
