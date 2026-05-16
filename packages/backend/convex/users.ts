import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { createAuth } from "./auth";

const ROLE = v.union(v.literal("owner"), v.literal("coach"));

/**
 * True iff this BetterAuth user is a coach (owner or coach) of AT LEAST one
 * organization. Used by the web's `/dashboard` loader.
 *
 * Public on purpose: the caller has the userId from the BetterAuth session.
 * The result is just a boolean. Tighten with Convex auth identity later.
 */
export const isCoach = query({
  args: { userId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { userId }) => {
    const memberships = await ctx.db
      .query("members")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return memberships.some(
      (m) => m.role === "owner" || m.role === "coach",
    );
  },
});

/**
 * List the organizations the current user is a coach of.
 * Returned shape is small and stable for the web app to render menus.
 */
export const myOrganizations = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      organizationId: v.id("organizations"),
      slug: v.string(),
      name: v.string(),
      role: ROLE,
    }),
  ),
  handler: async (ctx, { userId }) => {
    const memberships = await ctx.db
      .query("members")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const out = [];
    for (const m of memberships) {
      const org = await ctx.db.get(m.organizationId);
      if (!org) continue;
      out.push({
        organizationId: org._id,
        slug: org.slug,
        name: org.name,
        role: m.role,
      });
    }
    return out;
  },
});

/**
 * Bootstrap: creates the first user, the first organization, and links them
 * as owner. Run ONCE from the Convex dashboard:
 *
 *   internal.users.seedFirstCoach({
 *     email: "coach@example.com",
 *     password: "supersecret123",
 *     name: "Coach Demo",
 *     organizationName: "HWPO",
 *     organizationSlug: "hwpo"
 *   })
 *
 * No signup UI in the MVP.
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
    const auth = createAuth(ctx);
    await auth.api.signUpEmail({
      body: { email: args.email, password: args.password, name: args.name },
    });
    await ctx.runMutation(internal.users._linkUserToOrgAsOwner, {
      email: args.email,
      organizationName: args.organizationName,
      organizationSlug: args.organizationSlug,
    });
    return {
      email: args.email,
      organizationSlug: args.organizationSlug,
      role: "owner" as const,
    };
  },
});

/**
 * Add an EXISTING user as a coach of an existing organization.
 *
 *   internal.users.addCoachToOrganization({
 *     email: "coach2@example.com",
 *     organizationSlug: "hwpo"
 *   })
 */
export const addCoachToOrganization = internalMutation({
  args: { email: v.string(), organizationSlug: v.string() },
  handler: async (ctx, { email, organizationSlug }) => {
    const userId = await findBetterAuthUserId(ctx, email);
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", organizationSlug))
      .unique();
    if (!org) {
      throw new Error(`No organization with slug: ${organizationSlug}`);
    }
    await upsertMembership(ctx, {
      organizationId: org._id,
      userId,
      role: "coach",
    });
    return { email, organizationSlug, role: "coach" as const };
  },
});

/**
 * Internal helper used by `seedFirstCoach` after the user is signed up.
 * Creates the org (idempotent on slug) and makes the user its owner.
 */
export const _linkUserToOrgAsOwner = internalMutation({
  args: {
    email: v.string(),
    organizationName: v.string(),
    organizationSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await findBetterAuthUserId(ctx, args.email);
    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.organizationSlug))
      .unique();
    const organizationId =
      existingOrg?._id ??
      (await ctx.db.insert("organizations", {
        name: args.organizationName,
        slug: args.organizationSlug,
        createdAt: Date.now(),
      }));
    await upsertMembership(ctx, {
      organizationId,
      userId,
      role: "owner",
    });
    return { userId, organizationId, role: "owner" as const };
  },
});

// --- helpers ---------------------------------------------------------------

async function findBetterAuthUserId(
  ctx: MutationCtx,
  email: string,
): Promise<string> {
  const authUser = await ctx.runQuery(
    components.betterAuth.adapter.findOne,
    {
      model: "user",
      where: [{ field: "email", operator: "eq", value: email }],
    },
  );
  if (!authUser) {
    throw new Error(`No BetterAuth user found for email: ${email}`);
  }
  return authUser._id as string;
}

async function upsertMembership(
  ctx: MutationCtx,
  args: {
    organizationId: import("./_generated/dataModel").Id<"organizations">;
    userId: string;
    role: "owner" | "coach";
  },
) {
  const existing = await ctx.db
    .query("members")
    .withIndex("by_user_org", (q) =>
      q.eq("userId", args.userId).eq("organizationId", args.organizationId),
    )
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { role: args.role });
  } else {
    await ctx.db.insert("members", { ...args, createdAt: Date.now() });
  }
}
