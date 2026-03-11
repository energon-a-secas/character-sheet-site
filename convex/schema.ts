import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    role: v.optional(v.string()),
  }).index("by_username", ["username"]),

  sheets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    data: v.string(), // JSON-serialized sheet state
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
