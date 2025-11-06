import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./helpers";

// Query: Get all follow-up recommendations for the current user
export const list = query({
  args: {
    dismissed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (args.dismissed !== undefined) {
      return await ctx.db
        .query("followUpRecommendations")
        .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("dismissed", args.dismissed!))
        .collect();
    }

    return await ctx.db
      .query("followUpRecommendations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Query: Get active (not dismissed) recommendations
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("followUpRecommendations")
      .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("dismissed", false))
      .collect();
  },
});

// Query: Get recommendations for a specific contact
export const getByContact = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("followUpRecommendations")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();
  },
});

// Mutation: Create follow-up recommendation
export const create = mutation({
  args: {
    contactId: v.id("contacts"),
    action: v.string(),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    daysSinceLastContact: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify contact belongs to user
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found or unauthorized");
    }

    return await ctx.db.insert("followUpRecommendations", {
      userId,
      contactId: args.contactId,
      action: args.action,
      priority: args.priority,
      daysSinceLastContact: args.daysSinceLastContact,
      dismissed: false,
      createdAt: Date.now(),
    });
  },
});

// Mutation: Dismiss recommendation
export const dismiss = mutation({
  args: { recommendationId: v.id("followUpRecommendations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const recommendation = await ctx.db.get(args.recommendationId);
    if (!recommendation || recommendation.userId !== userId) {
      throw new Error("Recommendation not found or unauthorized");
    }

    await ctx.db.patch(args.recommendationId, {
      dismissed: true,
    });

    return { success: true };
  },
});

// Mutation: Delete recommendation
export const remove = mutation({
  args: { recommendationId: v.id("followUpRecommendations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const recommendation = await ctx.db.get(args.recommendationId);
    if (!recommendation || recommendation.userId !== userId) {
      throw new Error("Recommendation not found or unauthorized");
    }

    await ctx.db.delete(args.recommendationId);

    return { success: true };
  },
});

