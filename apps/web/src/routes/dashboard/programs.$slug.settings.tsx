import { useConvexMutation } from '@convex-dev/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@strivio/backend/api'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ProgramContext } from './programs.$slug'

const schema = z.object({
  name: z.string().min(2, '2 caractères minimum'),
  slug: z
    .string()
    .min(1, 'Slug requis')
    .regex(/^[a-z0-9-]+$/, 'lettres minuscules, chiffres et tirets uniquement')
    .max(64),
  description: z.string().max(2000, '2000 caractères maximum'),
  priceCents: z.string().regex(/^\d+$/, 'Entier positif requis'),
  currency: z.string().min(3).max(3, 'Code ISO 4217 (3 lettres)'),
  isPublished: z.boolean(),
})

type Values = z.infer<typeof schema>

export const Route = createFileRoute('/dashboard/programs/$slug/settings')({
  component: ProgramSettingsPage,
})

function ProgramSettingsPage() {
  const { program } = Route.useRouteContext() as unknown as ProgramContext
  const programId = program._id
  const navigate = useNavigate()

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: program.name,
      slug: program.slug,
      description: program.description,
      priceCents: String(program.priceCents),
      currency: program.currency,
      isPublished: program.isPublished,
    },
  })

  const updateProgram = useMutation({ mutationFn: useConvexMutation(api.programs.update) })
  const removeProgram = useMutation({ mutationFn: useConvexMutation(api.programs.remove) })

  const onSubmit = async (values: Values) => {
    try {
      await updateProgram.mutateAsync({
        programId,
        name: values.name,
        slug: values.slug,
        description: values.description,
        priceCents: parseInt(values.priceCents, 10),
        currency: values.currency,
        isPublished: values.isPublished,
      })
      toast.success('Programme mis à jour')
      // Le slug fait partie de l'URL : s'il change, on suit la nouvelle URL
      // (sinon le slug courant ne résoudrait plus).
      if (values.slug !== program.slug) {
        void navigate({ to: '/dashboard/programs/$slug/settings', params: { slug: values.slug } })
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const onRemove = async () => {
    if (!confirm(`Supprimer "${program.name}" et tous ses jours/blocs ? Cette action est irréversible.`)) {
      return
    }
    try {
      await removeProgram.mutateAsync({ programId })
      toast.success('Programme supprimé')
      void navigate({ to: '/dashboard' })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 py-8">
      <Link
        to="/dashboard/programs/$slug"
        params={{ slug: program.slug }}
        className="text-muted-foreground text-sm hover:underline"
      >
        ← {program.name}
      </Link>
      <h1 className="mt-1 mb-6 font-bold text-2xl tracking-tight">Paramètres</h1>

      <Card>
        <CardHeader>
          <CardTitle>Programme</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>identifiant dans l'URL (unique dans ton org)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priceCents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix (centimes)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormDescription>0 = gratuit. Facturation pas active.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Devise</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 rounded-md border p-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <div>
                      <FormLabel className="!mb-0">Publié</FormLabel>
                      <FormDescription>Quand coché, visible publiquement.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Sauvegarde…' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="mt-6 border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Zone dangereuse</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-muted-foreground text-sm">
            Supprime le programme et tous ses jours/blocs. Irréversible.
          </p>
          <Button variant="destructive" onClick={onRemove} disabled={removeProgram.isPending}>
            Supprimer ce programme
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
