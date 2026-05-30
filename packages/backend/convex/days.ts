import { BLOCK_COLORS, SCORE_TYPES } from '@strivio/shared'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { type MutationCtx, mutation, type QueryCtx, query } from './_generated/server'
import { requireOrgMember } from './users'

const BLOCK_COLOR = v.union(...BLOCK_COLORS.map((c) => v.literal(c)))
const SCORE_TYPE = v.union(...SCORE_TYPES.map((s) => v.literal(s)))

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function assertIsoDate(date: string) {
  if (!ISO_DATE.test(date)) {
    throw new Error(`INVALID_DATE: expected YYYY-MM-DD, got ${date}`)
  }
}

async function requireMemberForProgram(ctx: QueryCtx | MutationCtx, programId: Id<'programs'>) {
  const program = await ctx.db.get(programId)
  if (!program) throw new Error('PROGRAM_NOT_FOUND')
  await requireOrgMember(ctx, program.organizationId)
  return program
}

async function requireMemberForDay(ctx: QueryCtx | MutationCtx, dayId: Id<'days'>) {
  const day = await ctx.db.get(dayId)
  if (!day) throw new Error('DAY_NOT_FOUND')
  await requireMemberForProgram(ctx, day.programId)
  return day
}

// --- Queries -------------------------------------------------------------

export const listForProgram = query({
  args: { programId: v.id('programs') },
  returns: v.array(
    v.object({
      _id: v.id('days'),
      _creationTime: v.number(),
      programId: v.id('programs'),
      date: v.string(),
      publishedAt: v.union(v.null(), v.number()),
      blocksCount: v.number(),
      blocks: v.array(
        v.object({
          _id: v.id('blocks'),
          dayId: v.id('days'),
          order: v.number(),
          title: v.string(),
          color: BLOCK_COLOR,
          contentMarkdown: v.string(),
          scoreType: v.union(v.null(), SCORE_TYPE),
        }),
      ),
    }),
  ),
  handler: async (ctx, { programId }) => {
    await requireMemberForProgram(ctx, programId)
    const days = await ctx.db
      .query('days')
      .withIndex('by_programId', (q) => q.eq('programId', programId))
      .collect()
    const out = []
    for (const day of days) {
      const blocks = await ctx.db
        .query('blocks')
        .withIndex('by_day_order', (q) => q.eq('dayId', day._id))
        .collect()
      blocks.sort((a, b) => a.order - b.order)
      out.push({
        ...day,
        blocksCount: blocks.length,
        blocks: blocks.map((b) => ({
          _id: b._id,
          dayId: b.dayId,
          order: b.order,
          title: b.title,
          color: b.color,
          contentMarkdown: b.contentMarkdown,
          scoreType: b.scoreType,
        })),
      })
    }
    return out
  },
})

/**
 * Get a day by date (returns { day, blocks } or null if no day at this date).
 * Used by the day editor.
 */
export const getByDate = query({
  args: { programId: v.id('programs'), date: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      day: v.object({
        _id: v.id('days'),
        _creationTime: v.number(),
        programId: v.id('programs'),
        date: v.string(),
        publishedAt: v.union(v.null(), v.number()),
      }),
      blocks: v.array(
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
    }),
  ),
  handler: async (ctx, { programId, date }) => {
    assertIsoDate(date)
    await requireMemberForProgram(ctx, programId)
    const day = await ctx.db
      .query('days')
      .withIndex('by_program_date', (q) => q.eq('programId', programId).eq('date', date))
      .unique()
    if (!day) return null
    const blocks = await ctx.db
      .query('blocks')
      .withIndex('by_day_order', (q) => q.eq('dayId', day._id))
      .collect()
    blocks.sort((a, b) => a.order - b.order)
    return { day, blocks }
  },
})

// --- Mutations -----------------------------------------------------------

/**
 * Get or create a day for this (program, date). Idempotent: returns the
 * existing day if there's one, otherwise inserts a new (empty) one.
 */
export const upsert = mutation({
  args: { programId: v.id('programs'), date: v.string() },
  returns: v.id('days'),
  handler: async (ctx, { programId, date }) => {
    assertIsoDate(date)
    await requireMemberForProgram(ctx, programId)
    const existing = await ctx.db
      .query('days')
      .withIndex('by_program_date', (q) => q.eq('programId', programId).eq('date', date))
      .unique()
    if (existing) return existing._id
    return await ctx.db.insert('days', { programId, date, publishedAt: null })
  },
})

/**
 * Copy a day's blocks to another date within the same program.
 * If the target date already has a day, blocks are appended after existing
 * ones (orders bumped). Otherwise creates the day.
 */
export const duplicate = mutation({
  args: { fromDayId: v.id('days'), toDate: v.string() },
  returns: v.id('days'),
  handler: async (ctx, { fromDayId, toDate }) => {
    assertIsoDate(toDate)
    const fromDay = await requireMemberForDay(ctx, fromDayId)
    if (fromDay.date === toDate) {
      throw new Error('CANNOT_DUPLICATE_TO_SAME_DATE')
    }

    const existingTarget = await ctx.db
      .query('days')
      .withIndex('by_program_date', (q) => q.eq('programId', fromDay.programId).eq('date', toDate))
      .unique()
    const toDayId =
      existingTarget?._id ??
      (await ctx.db.insert('days', { programId: fromDay.programId, date: toDate, publishedAt: null }))

    // Compute next order — append after existing blocks at destination.
    let nextOrder = 0
    if (existingTarget) {
      const existingBlocks = await ctx.db
        .query('blocks')
        .withIndex('by_dayId', (q) => q.eq('dayId', existingTarget._id))
        .collect()
      nextOrder = existingBlocks.length ? Math.max(...existingBlocks.map((b) => b.order)) + 1 : 0
    }

    const sourceBlocks = await ctx.db
      .query('blocks')
      .withIndex('by_day_order', (q) => q.eq('dayId', fromDayId))
      .collect()
    sourceBlocks.sort((a, b) => a.order - b.order)
    for (const b of sourceBlocks) {
      await ctx.db.insert('blocks', {
        dayId: toDayId,
        order: nextOrder++,
        title: b.title,
        color: b.color,
        contentMarkdown: b.contentMarkdown,
        scoreType: b.scoreType,
      })
    }

    return toDayId
  },
})

export const remove = mutation({
  args: { dayId: v.id('days') },
  returns: v.null(),
  handler: async (ctx, { dayId }) => {
    await requireMemberForDay(ctx, dayId)
    const blocks = await ctx.db
      .query('blocks')
      .withIndex('by_dayId', (q) => q.eq('dayId', dayId))
      .collect()
    for (const b of blocks) {
      await ctx.db.delete(b._id)
    }
    await ctx.db.delete(dayId)
    return null
  },
})

// Silence unused warning when only Doc<'days'> is used as a type
export type DayDoc = Doc<'days'>
