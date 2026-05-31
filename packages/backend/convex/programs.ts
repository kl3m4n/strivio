import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { type MutationCtx, mutation, type QueryCtx, query } from './_generated/server'
import { requireOrgMember } from './users'

// --- Internal helpers ----------------------------------------------------

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'program'
  )
}

async function getProgramOrThrow(ctx: QueryCtx | MutationCtx, programId: Id<'programs'>) {
  const program = await ctx.db.get(programId)
  if (!program) throw new Error('PROGRAM_NOT_FOUND')
  return program
}

/**
 * Ensures the current user is a coach/owner of the program's organization
 * and returns the program. Single entry point for every program-scoped
 * authorization check.
 */
async function requireMemberForProgram(ctx: QueryCtx | MutationCtx, programId: Id<'programs'>) {
  const program = await getProgramOrThrow(ctx, programId)
  await requireOrgMember(ctx, program.organizationId)
  return program
}

async function ensureSlugFreeInOrg(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<'organizations'>,
  slug: string,
  ignoreProgramId?: Id<'programs'>,
) {
  const existing = await ctx.db
    .query('programs')
    .withIndex('by_org_slug', (q) => q.eq('organizationId', organizationId).eq('slug', slug))
    .unique()
  if (existing && existing._id !== ignoreProgramId) {
    throw new Error(`SLUG_ALREADY_TAKEN: ${slug}`)
  }
}

// --- Queries -------------------------------------------------------------

export const listForOrg = query({
  args: { organizationId: v.id('organizations') },
  returns: v.array(
    v.object({
      _id: v.id('programs'),
      _creationTime: v.number(),
      organizationId: v.id('organizations'),
      slug: v.string(),
      name: v.string(),
      description: v.string(),
      priceCents: v.number(),
      currency: v.string(),
      isPublished: v.boolean(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, { organizationId }) => {
    await requireOrgMember(ctx, organizationId)
    return await ctx.db
      .query('programs')
      .withIndex('by_organizationId', (q) => q.eq('organizationId', organizationId))
      .collect()
  },
})

export const getById = query({
  args: { programId: v.id('programs') },
  returns: v.object({
    _id: v.id('programs'),
    _creationTime: v.number(),
    organizationId: v.id('organizations'),
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    priceCents: v.number(),
    currency: v.string(),
    isPublished: v.boolean(),
    createdAt: v.number(),
  }),
  handler: async (ctx, { programId }) => {
    return await requireMemberForProgram(ctx, programId)
  },
})

/**
 * Resolve a program by its slug WITHIN an organization (slug is unique per
 * org). Returns null if not found so the web can redirect instead of erroring.
 * Used by the `/dashboard/programs/$slug` routes.
 */
export const getBySlug = query({
  args: { organizationId: v.id('organizations'), slug: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id('programs'),
      _creationTime: v.number(),
      organizationId: v.id('organizations'),
      slug: v.string(),
      name: v.string(),
      description: v.string(),
      priceCents: v.number(),
      currency: v.string(),
      isPublished: v.boolean(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, { organizationId, slug }) => {
    await requireOrgMember(ctx, organizationId)
    return await ctx.db
      .query('programs')
      .withIndex('by_org_slug', (q) => q.eq('organizationId', organizationId).eq('slug', slug))
      .unique()
  },
})

// --- Mutations -----------------------------------------------------------

export const create = mutation({
  args: {
    organizationId: v.id('organizations'),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    priceCents: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  // Renvoie le slug (et non l'id) : c'est lui qui sert d'identifiant d'URL.
  returns: v.string(),
  handler: async (ctx, args) => {
    await requireOrgMember(ctx, args.organizationId)
    const slug = args.slug?.trim() || slugify(args.name)
    await ensureSlugFreeInOrg(ctx, args.organizationId, slug)
    await ctx.db.insert('programs', {
      organizationId: args.organizationId,
      slug,
      name: args.name,
      description: args.description ?? '',
      priceCents: args.priceCents ?? 0,
      currency: args.currency ?? 'EUR',
      isPublished: false,
      createdAt: Date.now(),
    })
    return slug
  },
})

export const update = mutation({
  args: {
    programId: v.id('programs'),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    priceCents: v.optional(v.number()),
    currency: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const program = await requireMemberForProgram(ctx, args.programId)
    const patch: Partial<Doc<'programs'>> = {}
    if (args.name !== undefined) patch.name = args.name
    if (args.slug !== undefined && args.slug !== program.slug) {
      await ensureSlugFreeInOrg(ctx, program.organizationId, args.slug, program._id)
      patch.slug = args.slug
    }
    if (args.description !== undefined) patch.description = args.description
    if (args.priceCents !== undefined) patch.priceCents = args.priceCents
    if (args.currency !== undefined) patch.currency = args.currency
    if (args.isPublished !== undefined) patch.isPublished = args.isPublished
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.programId, patch)
    }
    return null
  },
})

export const remove = mutation({
  args: { programId: v.id('programs') },
  returns: v.null(),
  handler: async (ctx, { programId }) => {
    await requireMemberForProgram(ctx, programId)
    // Cascade: blocks → days → program
    const days = await ctx.db
      .query('days')
      .withIndex('by_programId', (q) => q.eq('programId', programId))
      .collect()
    for (const day of days) {
      const blocks = await ctx.db
        .query('blocks')
        .withIndex('by_dayId', (q) => q.eq('dayId', day._id))
        .collect()
      for (const block of blocks) {
        await ctx.db.delete(block._id)
      }
      await ctx.db.delete(day._id)
    }
    await ctx.db.delete(programId)
    return null
  },
})
