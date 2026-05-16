import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-6 px-8">
      <h1 className="font-bold text-4xl tracking-tight">Strivio</h1>
      <p className="text-lg text-muted-foreground">Plateforme de programmation CrossFit pour coachs et athlètes.</p>
      <Button asChild>
        <Link to="/login">Se connecter</Link>
      </Button>
    </main>
  )
}
