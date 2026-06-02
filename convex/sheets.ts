import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

async function accountLinkForSubject(ctx: QueryCtx | MutationCtx, subject: string) {
  return await ctx.db
    .query("clerkAccountLinks")
    .withIndex("by_subject", (q) => q.eq("clerkSubject", subject))
    .first();
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const subject = identity.subject;
    const byOwner = await ctx.db
      .query("sheets")
      .withIndex("by_owner", (q) => q.eq("ownerSubject", subject))
      .collect();
    const link = await accountLinkForSubject(ctx, subject);
    if (!link) return byOwner;
    const byLegacyUser = await ctx.db
      .query("sheets")
      .withIndex("by_userId", (q) => q.eq("userId", link.legacyConvexUserId))
      .collect();
    const seen = new Set(byOwner.map((d) => d._id));
    const merged = [...byOwner];
    for (const row of byLegacyUser) {
      if (!seen.has(row._id)) merged.push(row);
    }
    return merged;
  },
});

function canAccessSheet(
  existing: { ownerSubject?: string; userId?: import("./_generated/dataModel").Id<"users"> },
  ownerSubject: string,
  legacyUserId: import("./_generated/dataModel").Id<"users"> | undefined,
) {
  if (existing.ownerSubject === ownerSubject) return true;
  return !!(legacyUserId && existing.userId === legacyUserId);
}

export const save = mutation({
  args: { sheetId: v.optional(v.id("sheets")), name: v.string(), data: v.string() },
  handler: async (ctx, { sheetId, name, data }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const ownerSubject = identity.subject;
    const link = await accountLinkForSubject(ctx, ownerSubject);
    const legacyUserId = link?.legacyConvexUserId;
    const now = Date.now();
    if (sheetId) {
      const existing = await ctx.db.get(sheetId);
      if (!existing || !canAccessSheet(existing, ownerSubject, legacyUserId)) {
        throw new Error("Not found");
      }
      if (existing.ownerSubject !== ownerSubject) {
        await ctx.db.patch(sheetId, {
          name,
          data,
          updatedAt: now,
          ownerSubject,
        });
      } else {
        await ctx.db.patch(sheetId, { name, data, updatedAt: now });
      }
      return sheetId;
    }
    return await ctx.db.insert("sheets", { ownerSubject, name, data, updatedAt: now });
  },
});

export const remove = mutation({
  args: { sheetId: v.id("sheets") },
  handler: async (ctx, { sheetId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(sheetId);
    const link = await accountLinkForSubject(ctx, identity.subject);
    if (
      !existing ||
      !canAccessSheet(existing, identity.subject, link?.legacyConvexUserId)
    ) {
      throw new Error("Not found");
    }
    await ctx.db.delete(sheetId);
  },
});
