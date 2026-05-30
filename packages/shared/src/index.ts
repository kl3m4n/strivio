// Palette de couleurs des blocs (jour d'entraînement).
// Slugs stables — la résolution en valeur CSS (hex/oklch) se fait côté web
// dans une map (apps/web/src/lib/block-colors.ts) pour qu'on puisse retoucher
// l'apparence sans toucher au schéma backend.
export const BLOCK_COLORS = ['slate', 'red', 'orange', 'amber', 'green', 'blue', 'violet'] as const

export type BlockColor = (typeof BLOCK_COLORS)[number]

// Type de score d'un bloc. Schéma uniquement à la phase 2 (pas d'UI),
// utilisé plus tard quand on ajoutera le logging mobile.
//   - none     : pas de score à logger (warmup, mobilité)
//   - time     : temps mis (AMRAP fini, chrono)
//   - reps     : nombre de répétitions (AMRAP non fini)
//   - load     : charge soulevée
//   - rounds   : nombre de tours
//   - text     : note libre
export const SCORE_TYPES = ['none', 'time', 'reps', 'load', 'rounds', 'text'] as const
export type ScoreType = (typeof SCORE_TYPES)[number]
