import { useState } from 'react'
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

export function DuplicateDayDialog({
  open,
  onOpenChange,
  sourceDate,
  onSubmit,
  submitting,
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
  sourceDate: string
  onSubmit: (toDate: string) => Promise<void> | void
  submitting?: boolean
}) {
  const [date, setDate] = useState(sourceDate)
  const sameDay = date === sourceDate
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dupliquer le jour</DialogTitle>
          <DialogDescription>
            Copie le {sourceDate} et ses blocs vers une autre date. Si la cible a déjà des blocs, ceux du jour source y
            sont ajoutés à la suite.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dup-date">Date cible</Label>
          <Input id="dup-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button disabled={sameDay || submitting} onClick={() => onSubmit(date)}>
            {submitting ? 'Duplication…' : 'Dupliquer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
