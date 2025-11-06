import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./helpers";

// Query: Get activity log for the current user
export const list = query({
  args: {
    limit: v.optional(v.number()),
    contactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let query = ctx.db
      .query("activityLog")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc");

    if (args.contactId) {
      query = ctx.db
        .query("activityLog")
        .withIndex("by_contact", (q) => q.eq("contactId", args.contactId!))
        .order("desc");
    }

    const activities = await query.collect();

    if (args.limit) {
      return activities.slice(0, args.limit);
    }

    return activities;
  },
});

// Query: Get recent activity (last N items)
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
      .query("activityLog")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

// Query: Get activity by date range
export const listByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const allActivities = await ctx.db
      .query("activityLog")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return allActivities.filter(
      (activity) =>
        activity.createdAt >= args.startDate && activity.createdAt <= args.endDate
    );
  },
});

// Mutation: Create activity log entry
export const create = mutation({
  args: {
    type: v.union(
      v.literal("contact_added"),
      v.literal("contact_updated"),
      v.literal("contact_moved"),
      v.literal("event_created"),
      v.literal("event_completed"),
      v.literal("email_sent"),
      v.literal("import_completed")
    ),
    contactId: v.optional(v.id("contacts")),
    eventId: v.optional(v.id("calendarEvents")),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("activityLog", {
      userId,
      type: args.type,
      contactId: args.contactId,
      eventId: args.eventId,
      description: args.description,
      createdAt: Date.now(),
    });
  },
});

