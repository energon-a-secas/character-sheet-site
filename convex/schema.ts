import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sheets: defineTable({
    /** Clerk `subject`; set on save. Legacy rows may only have `userId` until account link backfill. */
    ownerSubject: v.optional(v.string()),
    /** Legacy owner before Clerk (`users` row). Cleared after `ownerSubject` is set. */
    userId: v.optional(v.id("users")),
    name: v.string(),
    data: v.string(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerSubject"])
    .index("by_userId", ["userId"]),

  /** Legacy Neorgon accounts (optional rows; used only to verify password once at link time). */
  users: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    role: v.optional(v.string()),
  }).index("by_username", ["username"]),

  clerkAccountLinks: defineTable({
    clerkSubject: v.string(),
    legacyUsername: v.string(),
    legacyConvexUserId: v.id("users"),
    legacyRole: v.optional(v.string()),
    linkedAt: v.number(),
  })
    .index("by_subject", ["clerkSubject"])
    .index("by_legacy_username", ["legacyUsername"]),

  userSettings: defineTable({
    clerkSubject: v.string(),
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
  })
    .index("by_owner_key", ["clerkSubject", "key"])
    .index("by_subject", ["clerkSubject"]),
});
