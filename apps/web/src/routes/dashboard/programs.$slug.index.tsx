import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from '@strivio/backend/api'
import type { Id } from '@strivio/backend/dataModel'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Settings } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { BlockEditorDialog, type BlockEditorValue } from '@/components/dashboard/block-editor-dialog'
import { type BlockPreview, CalendarWeek, type DayPreview } from '@/components/dashboard/calendar-week'
import { DuplicateDayDialog } from '@/components/dashboard/duplicate-day-dialog'
import { Button } from '@/components/ui/button'
import type { ProgramContext } from './programs.$slug'

export const Route = createFileRoute('/dashboard/programs/$slug/')({
  loader: async ({ context }) => {
    const { program } = context as unknown as ProgramContext
    await context.queryClient.ensureQueryData(convexQuery(api.days.listForProgram, { programId: program._id }))
  },
  component: ProgramCalendarPage,
})

type EditorState =
  | null
  | { kind: 'create'; date: string; existingDay: DayPreview | undefined }
  | { kind: 'edit'; block: BlockPreview; day: DayPreview }

function ProgramCalendarPage() {
  const { program } = Route.useRouteContext() as unknown as ProgramContext
  const programId = program._id
  const { data: days } = useSuspenseQuery(convexQuery(api.days.listForProgram, { programId }))

  const upsertDay = useMutation({ mutationFn: useConvexMutation(api.days.upsert) })
  const createBlock = useMutation({ mutationFn: useConvexMutation(api.blocks.create) })
  const updateBlock = useMutation({ mutationFn: useConvexMutation(api.blocks.update) })
  const removeBlock = useMutation({ mutationFn: useConvexMutation(api.blocks.remove) })
  const reorderBlocks = useMutation({ mutationFn: useConvexMutation(api.blocks.reorder) })
  const duplicateDay = useMutation({ mutationFn: useConvexMutation(api.days.duplicate) })

  const [editor, setEditor] = useState<EditorState>(null)
  const [dup, setDup] = useState<{ day: DayPreview } | null>(null)

  const submitEditor = async (value: BlockEditorValue) => {
    if (!editor) return
    try {
      if (editor.kind === 'edit') {
        await updateBlock.mutateAsync({ blockId: editor.block._id, ...value })
        toast.success('Bloc mis à jour')
      } else {
        const dayId = editor.existingDay?._id ?? (await upsertDay.mutateAsync({ programId, date: editor.date }))
        await createBlock.mutateAsync({ dayId, ...value })
        toast.success('Bloc ajouté')
      }
      setEditor(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const deleteCurrentBlock = async () => {
    if (!editor || editor.kind !== 'edit') return
    try {
      await removeBlock.mutateAsync({ blockId: editor.block._id })
      toast.success('Bloc supprimé')
      setEditor(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const moveBlock = async ({ day, index, direction }: { day: DayPreview; index: number; direction: -1 | 1 }) => {
    const target = index + direction
    if (target < 0 || target >= day.blocks.length) return
    const newOrder = day.blocks.map((b) => b._id)
    ;[newOrder[index], newOrder[target]] = [newOrder[target] as Id<'blocks'>, newOrder[index] as Id<'blocks'>]
    try {
      await reorderBlocks.mutateAsync({ dayId: day._id, orderedIds: newOrder })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const submitDuplicate = async (toDate: string) => {
    if (!dup) return
    try {
      await duplicateDay.mutateAsync({ fromDayId: dup.day._id, toDate })
      toast.success(`Jour copié vers le ${toDate}`)
      setDup(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  // Map server data → calendar types
  const previewDays: DayPreview[] = days.map((d) => ({
    _id: d._id,
    date: d.date,
    blocks: d.blocks.map((b) => ({
      _id: b._id,
      dayId: b.dayId,
      order: b.order,
      title: b.title,
      color: b.color,
      contentMarkdown: b.contentMarkdown,
    })),
  }))

  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b bg-background px-6 py-3">
        <div className="flex items-baseline gap-3">
          <Link to="/dashboard" className="text-muted-foreground text-sm hover:underline">
            ← Programmes
          </Link>
          <h1 className="font-bold text-lg tracking-tight">{program.name}</h1>
          <p className="text-muted-foreground text-xs">
            /{program.slug}
            {program.isPublished ? '' : ' · brouillon'}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/programs/$slug/settings" params={{ slug: program.slug }}>
            <Settings className="-ml-1 h-4 w-4" /> Paramètres
          </Link>
        </Button>
      </div>

      <CalendarWeek
        days={previewDays}
        onAddBlock={({ date, existingDay }) => setEditor({ kind: 'create', date, existingDay })}
        onEditBlock={({ block, day }) => setEditor({ kind: 'edit', block, day })}
        onMoveBlock={moveBlock}
        onDuplicateDay={({ day }) => setDup({ day })}
      />

      {editor ? (
        <BlockEditorDialog
          open={true}
          onOpenChange={(o) => {
            if (!o) setEditor(null)
          }}
          initialValue={
            editor.kind === 'edit'
              ? {
                  title: editor.block.title,
                  color: editor.block.color,
                  contentMarkdown: editor.block.contentMarkdown,
                }
              : { title: '', color: 'slate', contentMarkdown: '' }
          }
          onSubmit={submitEditor}
          onDelete={editor.kind === 'edit' ? deleteCurrentBlock : undefined}
          submitting={createBlock.isPending || updateBlock.isPending || removeBlock.isPending || upsertDay.isPending}
          mode={editor.kind === 'edit' ? 'edit' : 'create'}
        />
      ) : null}

      {dup ? (
        <DuplicateDayDialog
          open={true}
          onOpenChange={(o) => {
            if (!o) setDup(null)
          }}
          sourceDate={dup.day.date}
          onSubmit={submitDuplicate}
          submitting={duplicateDay.isPending}
        />
      ) : null}
    </>
  )
}
