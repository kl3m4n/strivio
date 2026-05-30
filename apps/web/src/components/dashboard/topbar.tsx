import { Link, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

export function Topbar({
  user,
  organizationName,
}: {
  user: { email: string; name: string | null }
  organizationName: string
}) {
  const router = useRouter()
  const handleSignOut = async () => {
    await authClient.signOut()
    toast.success('Déconnecté')
    void router.navigate({ to: '/' })
  }
  return (
    <header className="flex items-center justify-between border-b bg-background px-6 py-3">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="font-semibold text-lg tracking-tight">
          Strivio
        </Link>
        <span className="text-muted-foreground text-sm">/ {organizationName}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground text-sm">{user.name ?? user.email}</span>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Se déconnecter
        </Button>
      </div>
    </header>
  )
}
