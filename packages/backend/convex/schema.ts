import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// BetterAuth's user/session/account/verification tables live inside the
// `betterAuth` Convex component (see convex.config.ts) — they're managed
// for us. The tables below are OUR tables; they reference BetterAuth users
// by their string id (`userId: v.string()`).
//
// Modèle métier (à terme) :
//   - organizations : une "Programmation" (HWPO, Mayhem, ...).
//   - members       : les COACHS d'une programmation (role: "owner" | "coach").
//                     PAS les athlètes — les athlètes sont des users qui ont
//                     une `subscription` à un `program`, pas un membership.
//   - programs      : les produits vendus par une programmation
//                     (60-Minutes, Flagship, Hyrox, ...). Non implémenté en
//                     phase 0/1.
//   - days, blocks  : contenu d'un programme. Non implémenté.
//   - subscriptions : un user × un program. Non implémenté.
//   - sessionLogs   : logs d'entraînement côté mobile. Non implémenté.

const ROLE = v.union(v.literal('owner'), v.literal('coach'))

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
})
