import { convexQuery } from '@convex-dev/react-query'
import { api } from '@strivio/backend/api'
import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/dashboard')({
  // Auth check needs the cookie/localStorage + browser-side BetterAuth client.
  ssr: false,
  beforeLoad: async ({ context }) => {
    const { data: session, error } = await authClient.getSession()
    if (error || !session?.user) {
      throw redirect({ to: '/login' })
    }
    const isCoach = await context.queryClient.fetchQuery(convexQuery(api.users.isCoach, { userId: session.user.id }))
    if (!isCoach) {
      throw redirect({ to: '/' })
    }
    return {
      user: {
        email: session.user.email,
        name: session.user.name ?? null,
      },
    }
  },
  loader: ({ context }) => ({ user: context.user }),
  component: Dashboard,
})

function Dashboard() {
  const { user } = Route.useLoaderData()
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut()
    toast.success('Déconnecté')
    void router.navigate({ to: '/' })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-8 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Bienvenue, coach {user.name ?? user.email}</CardTitle>
          <CardDescription>Espace coach — gestion des programmes à venir.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild variant="secondary">
            <Link to="/">Accueil</Link>
          </Button>
          <Button onClick={handleSignOut} variant="outline">
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
