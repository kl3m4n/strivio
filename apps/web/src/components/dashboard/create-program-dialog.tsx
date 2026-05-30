import { useConvexMutation } from '@convex-dev/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@strivio/backend/api'
import type { Id } from '@strivio/backend/dataModel'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const schema = z.object({
  name: z.string().min(2, '2 caractères minimum'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'lettres minuscules, chiffres et tirets uniquement')
    .max(64, '64 caractères maximum')
    .optional()
    .or(z.literal('')),
})

type Values = z.infer<typeof schema>

export function CreateProgramDialog({
  organizationId,
  trigger,
}: {
  organizationId: Id<'organizations'>
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '' },
  })
  const createProgram = useMutation({
    mutationFn: useConvexMutation(api.programs.create),
  })

  const onSubmit = async (values: Values) => {
    try {
      const programId = await createProgram.mutateAsync({
        organizationId,
        name: values.name,
        slug: values.slug?.trim() ? values.slug.trim() : undefined,
      })
      toast.success(`Programme créé : ${values.name}`)
      setOpen(false)
      form.reset()
      void navigate({ to: '/dashboard/programs/$programId', params: { programId } })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau programme</DialogTitle>
          <DialogDescription>
            Donne-lui un nom. Le slug est auto-généré, tu pourras l'éditer plus tard.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Flagship, Hyrox, 60-Minutes…" autoFocus {...field} />
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
                  <FormLabel>Slug (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="auto" {...field} />
                  </FormControl>
                  <FormDescription>laisse vide pour auto-générer depuis le nom</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Création…' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
