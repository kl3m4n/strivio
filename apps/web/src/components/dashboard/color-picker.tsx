import { BLOCK_COLORS, type BlockColor } from '@strivio/shared'
import { Check } from 'lucide-react'
import { BLOCK_COLOR_CLASSES, BLOCK_COLOR_LABELS } from '@/lib/block-colors'

export function ColorPicker({ value, onChange }: { value: BlockColor; onChange: (next: BlockColor) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur du bloc">
      {BLOCK_COLORS.map((c) => {
        const cls = BLOCK_COLOR_CLASSES[c]
        const selected = c === value
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={BLOCK_COLOR_LABELS[c]}
            onClick={() => onChange(c)}
            className={`flex h-8 w-8 items-center justify-center rounded-full ${cls.dot} ${
              selected ? `ring-2 ring-offset-2 ${cls.ring}` : ''
            }`}
          >
            {selected ? <Check className="h-4 w-4 text-white" /> : null}
          </button>
        )
      })}
    </div>
  )
}
