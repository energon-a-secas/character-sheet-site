import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("sheets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const save = mutation({
  args: { sheetId: v.optional(v.id("sheets")), userId: v.id("users"), name: v.string(), data: v.string() },
  handler: async (ctx, { sheetId, userId, name, data }) => {
    const now = Date.now();
    if (sheetId) {
      const existing = await ctx.db.get(sheetId);
      if (!existing || existing.userId !== userId) throw new Error("Not found");
      await ctx.db.patch(sheetId, { name, data, updatedAt: now });
      return sheetId;
    } else {
      return await ctx.db.insert("sheets", { userId, name, data, updatedAt: now });
    }
  },
});

export const remove = mutation({
  args: { sheetId: v.id("sheets"), userId: v.id("users") },
  handler: async (ctx, { sheetId, userId }) => {
    const existing = await ctx.db.get(sheetId);
    if (!existing || existing.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(sheetId);
  },
});
