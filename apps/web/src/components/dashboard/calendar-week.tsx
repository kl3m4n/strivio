import type { Id } from '@strivio/backend/dataModel'
import type { BlockColor } from '@strivio/shared'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Copy, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BLOCK_COLOR_CLASSES } from '@/lib/block-colors'
import { addDays, DAY_LABELS_FR, isSameDay, MONTH_LABELS_FR, startOfWeek, toIsoDate, weekDates } from '@/lib/date'

export type BlockPreview = {
  _id: Id<'blocks'>
  dayId: Id<'days'>
  order: number
  title: string
  color: BlockColor
  contentMarkdown: string
}

export type DayPreview = {
  _id: Id<'days'>
  date: string
  blocks: BlockPreview[]
}

export type CalendarWeekProps = {
  days: DayPreview[]
  onAddBlock: (args: { date: string; existingDay: DayPreview | undefined }) => void
  onEditBlock: (args: { block: BlockPreview; day: DayPreview; index: number }) => void
  onMoveBlock: (args: { day: DayPreview; index: number; direction: -1 | 1 }) => void
  onDuplicateDay: (args: { day: DayPreview }) => void
}

export function CalendarWeek({ days, onAddBlock, onEditBlock, onMoveBlock, onDuplicateDay }: CalendarWeekProps) {
  const [cursor, setCursor] = useState(() => startOfWeek(new Date()))
  const today = new Date()

  const byDate = new Map(days.map((d) => [d.date, d]))
  const grid = weekDates(cursor)
  const last = grid[6] as Date

  const sameMonth = cursor.getMonth() === last.getMonth()
  const sameYear = cursor.getFullYear() === last.getFullYear()
  const headerLabel =
    sameMonth && sameYear
      ? `Semaine du ${cursor.getDate()} au ${last.getDate()} ${MONTH_LABELS_FR[cursor.getMonth()]?.toLowerCase()} ${cursor.getFullYear()}`
      : sameYear
        ? `Semaine du ${cursor.getDate()} ${MONTH_LABELS_FR[cursor.getMonth()]?.toLowerCase()} au ${last.getDate()} ${MONTH_LABELS_FR[last.getMonth()]?.toLowerCase()} ${cursor.getFullYear()}`
        : `${cursor.toLocaleDateString('fr-FR')} → ${last.toLocaleDateString('fr-FR')}`

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-card">
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        <h2 className="font-semibold capitalize">{headerLabel}</h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor(addDays(cursor, -7))}
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(startOfWeek(new Date()))}>
            Aujourd'hui
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor(addDays(cursor, 7))}
            aria-label="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-7">
        {grid.map((d, colIdx) => {
          const iso = toIsoDate(d)
          const day = byDate.get(iso)
          const isToday = isSameDay(d, today)
          return (
            <DayColumn
              key={iso}
              date={iso}
              dayLabel={DAY_LABELS_FR[colIdx] ?? ''}
              dayNumber={d.getDate()}
              isToday={isToday}
              isLast={colIdx === 6}
              day={day}
              onAddBlock={() => onAddBlock({ date: iso, existingDay: day })}
              onEditBlock={(block, index) => {
                if (!day) return
                onEditBlock({ block, day, index })
              }}
              onMoveBlock={(index, direction) => {
                if (!day) return
                onMoveBlock({ day, index, direction })
              }}
              onDuplicateDay={() => {
                if (!day) return
                onDuplicateDay({ day })
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

function DayColumn({
  date,
  dayLabel,
  dayNumber,
  isToday,
  isLast,
  day,
  onAddBlock,
  onEditBlock,
  onMoveBlock,
  onDuplicateDay,
}: {
  date: string
  dayLabel: string
  dayNumber: number
  isToday: boolean
  isLast: boolean
  day: DayPreview | undefined
  onAddBlock: () => void
  onEditBlock: (block: BlockPreview, index: number) => void
  onMoveBlock: (index: number, direction: -1 | 1) => void
  onDuplicateDay: () => void
}) {
  const blocks = day?.blocks ?? []
  return (
    <div className={`flex min-h-0 flex-col border-b md:border-b-0 ${isLast ? '' : 'md:border-r'}`} data-date={date}>
      <div className="flex shrink-0 items-center justify-between border-b bg-card/50 px-2 py-1.5">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-[10px] text-muted-foreground uppercase">{dayLabel}</span>
          <span
            className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 font-semibold text-sm ${
              isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
            }`}
          >
            {dayNumber}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {blocks.length > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onDuplicateDay}
              aria-label="Dupliquer ce jour"
              title="Dupliquer ce jour"
            >
              <Copy className="h-3 w-3" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onAddBlock}
            aria-label="Ajouter un bloc"
            title="Ajouter un bloc"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-1.5">
        {blocks.length === 0 ? (
          <button
            type="button"
            onClick={onAddBlock}
            className="flex h-full min-h-[80px] items-center justify-center rounded border border-dashed text-muted-foreground/60 text-xs hover:bg-muted/40 hover:text-muted-foreground"
          >
            + Ajouter un bloc
          </button>
        ) : (
          blocks.map((b, i) => (
            <BlockCard
              key={b._id}
              block={b}
              canMoveUp={i > 0}
              canMoveDown={i < blocks.length - 1}
              onClick={() => onEditBlock(b, i)}
              onMoveUp={(e) => {
                e.stopPropagation()
                onMoveBlock(i, -1)
              }}
              onMoveDown={(e) => {
                e.stopPropagation()
                onMoveBlock(i, 1)
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}

function BlockCard({
  block,
  canMoveUp,
  canMoveDown,
  onClick,
  onMoveUp,
  onMoveDown,
}: {
  block: BlockPreview
  canMoveUp: boolean
  canMoveDown: boolean
  onClick: () => void
  onMoveUp: (e: React.MouseEvent) => void
  onMoveDown: (e: React.MouseEvent) => void
}) {
  const cls = BLOCK_COLOR_CLASSES[block.color]
  const preview = stripMarkdown(block.contentMarkdown)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col gap-1 rounded border bg-background p-2 text-left transition hover:shadow-sm ${cls.badge}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${cls.dot}`} />
          <span className="line-clamp-1 font-medium text-xs">{block.title}</span>
        </div>
        <div className="flex shrink-0 gap-0.5 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
          <span
            onClick={canMoveUp ? onMoveUp : undefined}
            onKeyDown={(e) => {
              if (!canMoveUp) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onMoveUp(e as unknown as React.MouseEvent)
              }
            }}
            role="button"
            tabIndex={canMoveUp ? 0 : -1}
            aria-label="Monter"
            className={`flex h-4 w-4 items-center justify-center rounded ${
              canMoveUp ? 'hover:bg-foreground/10' : 'cursor-default opacity-30'
            }`}
          >
            <ArrowUp className="h-3 w-3" />
          </span>
          <span
            onClick={canMoveDown ? onMoveDown : undefined}
            onKeyDown={(e) => {
              if (!canMoveDown) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onMoveDown(e as unknown as React.MouseEvent)
              }
            }}
            role="button"
            tabIndex={canMoveDown ? 0 : -1}
            aria-label="Descendre"
            className={`flex h-4 w-4 items-center justify-center rounded ${
              canMoveDown ? 'hover:bg-foreground/10' : 'cursor-default opacity-30'
            }`}
          >
            <ArrowDown className="h-3 w-3" />
          </span>
        </div>
      </div>
      {preview ? (
        <p className="line-clamp-3 whitespace-pre-wrap text-[11px] text-muted-foreground leading-snug">{preview}</p>
      ) : null}
    </button>
  )
}

/** Convert markdown to a plain-text preview suitable for tight cards. */
function stripMarkdown(s: string): string {
  return s
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
