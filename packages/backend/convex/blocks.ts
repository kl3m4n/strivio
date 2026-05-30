import { BLOCK_COLORS, SCORE_TYPES } from '@strivio/shared'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { type MutationCtx, mutation, type QueryCtx, query } from './_generated/server'
import { requireOrgMember } from './users'

const BLOCK_COLOR = v.union(...BLOCK_COLORS.map((c) => v.literal(c)))
const SCORE_TYPE = v.union(...SCORE_TYPES.map((s) => v.literal(s)))

async function requireMemberForDay(ctx: QueryCtx | MutationCtx, dayId: Id<'days'>) {
  const day = await ctx.db.get(dayId)
  if (!day) throw new Error('DAY_NOT_FOUND')
  const program = await ctx.db.get(day.programId)
  if (!program) throw new Error('PROGRAM_NOT_FOUND')
  await requireOrgMember(ctx, program.organizationId)
  return day
}

async function requireMemberForBlock(ctx: QueryCtx | MutationCtx, blockId: Id<'blocks'>) {
  const block = await ctx.db.get(blockId)
  if (!block) throw new Error('BLOCK_NOT_FOUND')
  await requireMemberForDay(ctx, block.dayId)
  return block
}

// --- Queries -------------------------------------------------------------

export const listForDay = query({
  args: { dayId: v.id('days') },
  returns: v.array(
    v.object({
      _id: v.id('blocks'),
      _creationTime: v.number(),
      dayId: v.id('days'),
      order: v.number(),
      title: v.string(),
      color: BLOCK_COLOR,
      contentMarkdown: v.string(),
      scoreType: v.union(v.null(), SCORE_TYPE),
    }),
  ),
  handler: async (ctx, { dayId }) => {
    await requireMemberForDay(ctx, dayId)
    const blocks = await ctx.db
      .query('blocks')
      .withIndex('by_day_order', (q) => q.eq('dayId', dayId))
      .collect()
    blocks.sort((a, b) => a.order - b.order)
    return blocks
  },
})

// --- Mutations -----------------------------------------------------------

export const create = mutation({
  args: {
    dayId: v.id('days'),
    title: v.string(),
    color: BLOCK_COLOR,
    contentMarkdown: v.string(),
    scoreType: v.optional(v.union(v.null(), SCORE_TYPE)),
  },
  returns: v.id('blocks'),
  handler: async (ctx, args) => {
    await requireMemberForDay(ctx, args.dayId)
    const existing = await ctx.db
      .query('blocks')
      .withIndex('by_dayId', (q) => q.eq('dayId', args.dayId))
      .collect()
    const nextOrder = existing.length ? Math.max(...existing.map((b) => b.order)) + 1 : 0
    return await ctx.db.insert('blocks', {
      dayId: args.dayId,
      order: nextOrder,
      title: args.title,
      color: args.color,
      contentMarkdown: args.contentMarkdown,
      scoreType: args.scoreType ?? null,
    })
  },
})

export const update = mutation({
  args: {
    blockId: v.id('blocks'),
    title: v.optional(v.string()),
    color: v.optional(BLOCK_COLOR),
    contentMarkdown: v.optional(v.string()),
    scoreType: v.optional(v.union(v.null(), SCORE_TYPE)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireMemberForBlock(ctx, args.blockId)
    const patch: Partial<Doc<'blocks'>> = {}
    if (args.title !== undefined) patch.title = args.title
    if (args.color !== undefined) patch.color = args.color
    if (args.contentMarkdown !== undefined) patch.contentMarkdown = args.contentMarkdown
    if (args.scoreType !== undefined) patch.scoreType = args.scoreType
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.blockId, patch)
    }
    return null
  },
})

export const remove = mutation({
  args: { blockId: v.id('blocks') },
  returns: v.null(),
  handler: async (ctx, { blockId }) => {
    await requireMemberForBlock(ctx, blockId)
    await ctx.db.delete(blockId)
    return null
  },
})

/**
 * Set the order of all blocks of a day. `orderedIds` must contain exactly
 * the blocks of this day (no more, no less). Order becomes the array index.
 */
export const reorder = mutation({
  args: { dayId: v.id('days'), orderedIds: v.array(v.id('blocks')) },
  returns: v.null(),
  handler: async (ctx, { dayId, orderedIds }) => {
    await requireMemberForDay(ctx, dayId)
    const existing = await ctx.db
      .query('blocks')
      .withIndex('by_dayId', (q) => q.eq('dayId', dayId))
      .collect()
    const existingIds = new Set(existing.map((b) => b._id))
    if (orderedIds.length !== existing.length) {
      throw new Error('REORDER_LENGTH_MISMATCH')
    }
    for (const id of orderedIds) {
      if (!existingIds.has(id)) {
        throw new Error(`REORDER_FOREIGN_BLOCK: ${id}`)
      }
    }
    for (let i = 0; i < orderedIds.length; i++) {
      await ctx.db.patch(orderedIds[i] as Id<'blocks'>, { order: i })
    }
    return null
  },
})
