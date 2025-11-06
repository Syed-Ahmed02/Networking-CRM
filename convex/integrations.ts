import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./helpers";

// Query: Get all integrations for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("integrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Query: Get integration by type
export const getByType = query({
  args: {
    type: v.union(v.literal("apollo"), v.literal("google_calendar")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("integrations")
      .withIndex("by_user_type", (q) => q.eq("userId", userId).eq("type", args.type))
      .first();
  },
});

// Query: Get a single integration by ID
export const get = query({
  args: { integrationId: v.id("integrations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const integration = await ctx.db.get(args.integrationId);
    if (!integration || integration.userId !== userId) {
      return null;
    }

    // Don't return sensitive data in queries - use a separate mutation for that
    return {
      _id: integration._id,
      userId: integration.userId,
      type: integration.type,
      connected: integration.connected,
      connectedAt: integration.connectedAt,
      settings: integration.settings,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  },
});

// Mutation: Create or update integration (upsert by type)
export const upsert = mutation({
  args: {
    type: v.union(v.literal("apollo"), v.literal("google_calendar")),
    apiKey: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if integration already exists
    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_user_type", (q) => q.eq("userId", userId).eq("type", args.type))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing integration
      const updates: any = {
        updatedAt: now,
        connected: true,
        connectedAt: existing.connectedAt || now,
      };

      if (args.apiKey !== undefined) updates.apiKey = args.apiKey;
      if (args.refreshToken !== undefined) updates.refreshToken = args.refreshToken;
      if (args.accessToken !== undefined) updates.accessToken = args.accessToken;
      if (args.settings !== undefined) updates.settings = args.settings;

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      // Create new integration
      return await ctx.db.insert("integrations", {
        userId,
        type: args.type,
        apiKey: args.apiKey,
        refreshToken: args.refreshToken,
        accessToken: args.accessToken,
        connected: true,
        connectedAt: now,
        settings: args.settings,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Mutation: Update integration
export const update = mutation({
  args: {
    integrationId: v.id("integrations"),
    apiKey: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const integration = await ctx.db.get(args.integrationId);
    if (!integration || integration.userId !== userId) {
      throw new Error("Integration not found or unauthorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.apiKey !== undefined) updates.apiKey = args.apiKey;
    if (args.refreshToken !== undefined) updates.refreshToken = args.refreshToken;
    if (args.accessToken !== undefined) updates.accessToken = args.accessToken;
    if (args.settings !== undefined) updates.settings = args.settings;

    await ctx.db.patch(args.integrationId, updates);

    return args.integrationId;
  },
});

// Mutation: Disconnect integration
export const disconnect = mutation({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const integration = await ctx.db.get(args.integrationId);
    if (!integration || integration.userId !== userId) {
      throw new Error("Integration not found or unauthorized");
    }

    await ctx.db.patch(args.integrationId, {
      connected: false,
      apiKey: undefined,
      refreshToken: undefined,
      accessToken: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Mutation: Delete integration
export const remove = mutation({
  args: { integrationId: v.id("integrations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const integration = await ctx.db.get(args.integrationId);
    if (!integration || integration.userId !== userId) {
      throw new Error("Integration not found or unauthorized");
    }

    await ctx.db.delete(args.integrationId);

    return { success: true };
  },
});

// Mutation: Get API key (for secure retrieval)
export const getApiKey = mutation({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const integration = await ctx.db.get(args.integrationId);
    if (!integration || integration.userId !== userId) {
      throw new Error("Integration not found or unauthorized");
    }

    return {
      apiKey: integration.apiKey,
      accessToken: integration.accessToken,
    };
  },
});

