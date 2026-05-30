import { v } from 'convex/values'
import { components, internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import { internalAction, internalMutation, type MutationCtx, type QueryCtx, query } from './_generated/server'
import { authComponent, createAuth } from './auth'

const ROLE = v.union(v.literal('owner'), v.literal('coach'))

// --- Auth helpers (server-side only) -------------------------------------

/**
 * Resolves the current user, looks up their membership in `organizationId`,
 * and returns both. Throws if the user is not authenticated or not a member.
 *
 * Every program/day/block mutation in phase 2 goes through this guard —
 * the web route guards are UX confort, this is the security barrier.
 */
export async function requireOrgMember(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<'organizations'>,
): Promise<{ user: Awaited<ReturnType<typeof authComponent.safeGetAuthUser>>; member: Doc<'members'> }> {
  const user = await authComponent.safeGetAuthUser(ctx)
  if (!user) {
    throw new Error('UNAUTHENTICATED')
  }
  const member = await ctx.db
    .query('members')
    .withIndex('by_user_org', (q) => q.eq('userId', user._id as string).eq('organizationId', organizationId))
    .unique()
  if (!member) {
    throw new Error('NOT_A_MEMBER_OF_ORGANIZATION')
  }
  return { user, member }
}

// --- Public queries ------------------------------------------------------

/** Current user from auth identity, or null. Doesn't throw. */
export const me = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      id: v.string(),
      email: v.string(),
      name: v.union(v.null(), v.string()),
    }),
  ),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) return null
    return {
      id: user._id as string,
      email: user.email as string,
      name: ((user.name as string | undefined) ?? null) as string | null,
    }
  },
})

/**
 * True iff the current user is a member of at least one organization with
 * role "owner" or "coach". Reads identity server-side — no args.
 */
export const isCoach = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) return false
    const memberships = await ctx.db
      .query('members')
      .withIndex('by_userId', (q) => q.eq('userId', user._id as string))
      .collect()
    return memberships.some((m) => m.role === 'owner' || m.role === 'coach')
  },
})

/** Organizations (programmations) the current user is a coach/owner of. */
export const myOrganizations = query({
  args: {},
  returns: v.array(
    v.object({
      organizationId: v.id('organizations'),
      slug: v.string(),
      name: v.string(),
      role: ROLE,
    }),
  ),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) return []
    const memberships = await ctx.db
      .query('members')
      .withIndex('by_userId', (q) => q.eq('userId', user._id as string))
      .collect()
    const out: Array<{
      organizationId: Id<'organizations'>
      slug: string
      name: string
      role: 'owner' | 'coach'
    }> = []
    for (const m of memberships) {
      const org = await ctx.db.get(m.organizationId)
      if (!org) continue
      out.push({
        organizationId: org._id,
        slug: org.slug,
        name: org.name,
        role: m.role,
      })
    }
    return out
  },
})

// --- Bootstrap / admin mutations -----------------------------------------

/**
 * Bootstrap: creates the first user + the first organization + the owner
 * membership. Run ONCE from the Convex dashboard.
 */
export const seedFirstCoach = internalAction({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    organizationName: v.string(),
    organizationSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = createAuth(ctx)
    await auth.api.signUpEmail({
      body: { email: args.email, password: args.password, name: args.name },
    })
    await ctx.runMutation(internal.users._linkUserToOrgAsOwner, {
      email: args.email,
      organizationName: args.organizationName,
      organizationSlug: args.organizationSlug,
    })
    return {
      email: args.email,
      organizationSlug: args.organizationSlug,
      role: 'owner' as const,
    }
  },
})

/** Add an EXISTING user as coach of an existing organization. */
export const addCoachToOrganization = internalMutation({
  args: { email: v.string(), organizationSlug: v.string() },
  handler: async (ctx, { email, organizationSlug }) => {
    const userId = await findBetterAuthUserId(ctx, email)
    const org = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', organizationSlug))
      .unique()
    if (!org) {
      throw new Error(`No organization with slug: ${organizationSlug}`)
    }
    await upsertMembership(ctx, {
      organizationId: org._id,
      userId,
      role: 'coach',
    })
    return { email, organizationSlug, role: 'coach' as const }
  },
})

/** Internal: split out so `seedFirstCoach` (an action) can call it. */
export const _linkUserToOrgAsOwner = internalMutation({
  args: {
    email: v.string(),
    organizationName: v.string(),
    organizationSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await findBetterAuthUserId(ctx, args.email)
    const existingOrg = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', args.organizationSlug))
      .unique()
    const organizationId =
      existingOrg?._id ??
      (await ctx.db.insert('organizations', {
        name: args.organizationName,
        slug: args.organizationSlug,
        createdAt: Date.now(),
      }))
    await upsertMembership(ctx, {
      organizationId,
      userId,
      role: 'owner',
    })
    return { userId, organizationId, role: 'owner' as const }
  },
})

// --- Private DB helpers --------------------------------------------------

async function findBetterAuthUserId(ctx: MutationCtx, email: string): Promise<string> {
  const authUser = await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: 'user',
    where: [{ field: 'email', operator: 'eq', value: email }],
  })
  if (!authUser) {
    throw new Error(`No BetterAuth user found for email: ${email}`)
  }
  return authUser._id as string
}

async function upsertMembership(
  ctx: MutationCtx,
  args: {
    organizationId: Id<'organizations'>
    userId: string
    role: 'owner' | 'coach'
  },
) {
  const existing = await ctx.db
    .query('members')
    .withIndex('by_user_org', (q) => q.eq('userId', args.userId).eq('organizationId', args.organizationId))
    .unique()
  if (existing) {
    await ctx.db.patch(existing._id, { role: args.role })
  } else {
    await ctx.db.insert('members', { ...args, createdAt: Date.now() })
  }
}
