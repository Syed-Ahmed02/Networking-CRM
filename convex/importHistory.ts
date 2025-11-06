import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./helpers";

// Query: Get all import history for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("importHistory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Query: Get recent imports
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const limit = args.limit || 10;

    return await ctx.db
      .query("importHistory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

// Query: Get a single import by ID
export const get = query({
  args: { importId: v.id("importHistory") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const importRecord = await ctx.db.get(args.importId);
    if (!importRecord || importRecord.userId !== userId) {
      return null;
    }

    return importRecord;
  },
});

// Mutation: Create import history entry
export const create = mutation({
  args: {
    fileName: v.string(),
    contactsImported: v.number(),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("processing")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const importId = await ctx.db.insert("importHistory", {
      userId,
      fileName: args.fileName,
      contactsImported: args.contactsImported,
      status: args.status,
      error: args.error,
      importedAt: Date.now(),
    });

    // Log activity if successful
    if (args.status === "success") {
      await ctx.db.insert("activityLog", {
        userId,
        type: "import_completed",
        description: `Imported ${args.contactsImported} contacts from ${args.fileName}`,
        createdAt: Date.now(),
      });
    }

    return importId;
  },
});

// Mutation: Update import status
export const updateStatus = mutation({
  args: {
    importId: v.id("importHistory"),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("processing")),
    contactsImported: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const importRecord = await ctx.db.get(args.importId);
    if (!importRecord || importRecord.userId !== userId) {
      throw new Error("Import record not found or unauthorized");
    }

    const updates: any = {
      status: args.status,
    };

    if (args.contactsImported !== undefined) updates.contactsImported = args.contactsImported;
    if (args.error !== undefined) updates.error = args.error;

    await ctx.db.patch(args.importId, updates);

    // Log activity if status changed to success
    if (args.status === "success" && importRecord.status !== "success") {
      await ctx.db.insert("activityLog", {
        userId,
        type: "import_completed",
        description: `Imported ${args.contactsImported || importRecord.contactsImported} contacts from ${importRecord.fileName}`,
        createdAt: Date.now(),
      });
    }

    return args.importId;
  },
});

// Mutation: Delete import history entry
export const remove = mutation({
  args: { importId: v.id("importHistory") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const importRecord = await ctx.db.get(args.importId);
    if (!importRecord || importRecord.userId !== userId) {
      throw new Error("Import record not found or unauthorized");
    }

    await ctx.db.delete(args.importId);

    return { success: true };
  },
});

