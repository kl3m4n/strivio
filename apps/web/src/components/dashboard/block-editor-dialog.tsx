import { BLOCK_COLORS, type BlockColor } from '@strivio/shared'
import { useEffect, useState } from 'react'
import { ColorPicker } from '@/components/dashboard/color-picker'
import { MarkdownPreview } from '@/components/dashboard/markdown-preview'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type BlockEditorValue = {
  title: string
  color: BlockColor
  contentMarkdown: string
}

export function BlockEditorDialog({
  open,
  onOpenChange,
  initialValue,
  onSubmit,
  onDelete,
  submitting,
  mode,
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
  initialValue: BlockEditorValue
  onSubmit: (value: BlockEditorValue) => Promise<void> | void
  /** Si fourni, affiche un bouton "Supprimer" (mode edit uniquement). */
  onDelete?: () => Promise<void> | void
  submitting?: boolean
  mode: 'create' | 'edit'
}) {
  const [title, setTitle] = useState(initialValue.title)
  const [color, setColor] = useState<BlockColor>(initialValue.color)
  const [content, setContent] = useState(initialValue.contentMarkdown)

  // Reset state every time the dialog re-opens with new initial values.
  useEffect(() => {
    if (open) {
      setTitle(initialValue.title)
      setColor(initialValue.color)
      setContent(initialValue.contentMarkdown)
    }
  }, [open, initialValue.title, initialValue.color, initialValue.contentMarkdown])

  const canSubmit = title.trim().length > 0 && BLOCK_COLORS.includes(color)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nouveau bloc' : 'Éditer le bloc'}</DialogTitle>
          <DialogDescription>
            Titre, couleur, contenu markdown. Les URLs YouTube sont automatiquement embarquées.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="block-title">Titre</Label>
              <Input
                id="block-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Strength, Metcon, Warmup…"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Couleur</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="block-content">Contenu (markdown)</Label>
              <Textarea
                id="block-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                placeholder={'5 rounds for time:\n- 400m row\n- 15 box jumps\n\nhttps://youtu.be/...'}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Aperçu</Label>
            <div className="min-h-[400px] rounded-md border bg-background p-4">
              {content.trim() ? (
                <MarkdownPreview source={content} />
              ) : (
                <p className="text-muted-foreground text-sm">L'aperçu s'affiche ici.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <div>
            {mode === 'edit' && onDelete ? (
              <Button
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={async () => {
                  if (!confirm('Supprimer ce bloc ?')) return
                  await onDelete()
                }}
                disabled={submitting}
              >
                Supprimer
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              disabled={!canSubmit || submitting}
              onClick={() => onSubmit({ title: title.trim(), color, contentMarkdown: content })}
            >
              {submitting ? 'Enregistrement…' : mode === 'create' ? 'Ajouter' : 'Enregistrer'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
