import { BLOCK_COLORS, SCORE_TYPES } from '@strivio/shared'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// BetterAuth's user/session/account/verification tables live inside the
// `betterAuth` Convex component (see convex.config.ts) — they're managed
// for us. The tables below are OUR tables; they reference BetterAuth users
// by their string id (`userId: v.string()`).
//
// Modèle métier :
//   - organizations        : un espace coach / une marque ("HWPO",
//                            "Mayhem", ...). Plusieurs coachs y publient
//                            plusieurs programmes.
//   - members              : qui peut éditer cette organisation
//                            (role: "owner" | "coach"). PAS les athlètes —
//                            les athlètes sont des users qui ont une
//                            `subscription` à un `program`.
//   - programs             : un produit vendable, scopé à une organisation
//                            ("Flagship", "Hyrox", "60-Minutes").
//   - days                 : un jour d'entraînement d'un programme, ancré
//                            à une date calendaire réelle (YYYY-MM-DD).
//   - blocks               : les sections markdown ordonnées d'un jour
//                            (warmup, strength, metcon, accessory, ...).
//
// À venir (PAS implémenté en phase 2) :
//   - subscriptions { userId, programId, status, startedAt, expiresAt }
//   - sessionLogs { userId, blockId, doneAt, payload }   // mobile logging

const ROLE = v.union(v.literal('owner'), v.literal('coach'))
const BLOCK_COLOR = v.union(...BLOCK_COLORS.map((c) => v.literal(c)))
const SCORE_TYPE = v.union(...SCORE_TYPES.map((s) => v.literal(s)))

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    createdAt: v.number(),
  }).index('by_slug', ['slug']),

  members: defineTable({
    organizationId: v.id('organizations'),
    userId: v.string(), // BetterAuth user._id (string)
    role: ROLE,
    createdAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_organizationId', ['organizationId'])
    .index('by_user_org', ['userId', 'organizationId']),

  programs: defineTable({
    organizationId: v.id('organizations'),
    slug: v.string(), // unique DANS l'org
    name: v.string(),
    description: v.string(),
    priceCents: v.number(), // pas encore facturé — phase Stripe
    currency: v.string(), // défaut "EUR"
    isPublished: v.boolean(), // défaut false
    createdAt: v.number(),
  })
    .index('by_organizationId', ['organizationId'])
    .index('by_org_slug', ['organizationId', 'slug']),

  days: defineTable({
    programId: v.id('programs'),
    date: v.string(), // "YYYY-MM-DD"
    publishedAt: v.union(v.null(), v.number()), // nullable, pas d'UI cette phase
  })
    .index('by_programId', ['programId'])
    .index('by_program_date', ['programId', 'date']),

  blocks: defineTable({
    dayId: v.id('days'),
    order: v.number(), // int, tri dans la journée
    title: v.string(),
    color: BLOCK_COLOR,
    contentMarkdown: v.string(),
    scoreType: v.union(v.null(), SCORE_TYPE), // schéma seulement, pas d'UI
  })
    .index('by_dayId', ['dayId'])
    .index('by_day_order', ['dayId', 'order']),
})
