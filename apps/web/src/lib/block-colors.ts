import type { BlockColor } from '@strivio/shared'

// Mapping palette slug → classes Tailwind v4 utilisées partout (badge,
// bordure de carte de bloc, picker). Centralisé pour qu'on puisse retoucher
// l'apparence sans toucher au schéma backend.
export const BLOCK_COLOR_CLASSES: Record<BlockColor, { dot: string; badge: string; ring: string }> = {
  slate: { dot: 'bg-slate-500', badge: 'bg-slate-100 text-slate-800 border-slate-300', ring: 'ring-slate-400' },
  red: { dot: 'bg-red-500', badge: 'bg-red-100 text-red-800 border-red-300', ring: 'ring-red-400' },
  orange: { dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800 border-orange-300', ring: 'ring-orange-400' },
  amber: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800 border-amber-300', ring: 'ring-amber-400' },
  green: { dot: 'bg-green-500', badge: 'bg-green-100 text-green-800 border-green-300', ring: 'ring-green-400' },
  blue: { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800 border-blue-300', ring: 'ring-blue-400' },
  violet: { dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-800 border-violet-300', ring: 'ring-violet-400' },
}

export const BLOCK_COLOR_LABELS: Record<BlockColor, string> = {
  slate: 'Ardoise',
  red: 'Rouge',
  orange: 'Orange',
  amber: 'Ambre',
  green: 'Vert',
  blue: 'Bleu',
  violet: 'Violet',
}
