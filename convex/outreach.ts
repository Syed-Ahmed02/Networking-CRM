import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./helpers";
import type { Doc } from "./_generated/dataModel";

// Query: Get all outreach searches for the current user
export const listSearches = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("outreachSearches")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Query: Get all outreach messages for the current user
export const listMessages = query({
  args: {
    sent: v.optional(v.boolean()),
    contactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (args.sent !== undefined) {
      return await ctx.db
        .query("outreachMessages")
        .withIndex("by_user_sent", (q) => q.eq("userId", userId).eq("sent", args.sent!))
        .order("desc")
        .collect();
    }

    if (args.contactId) {
      return await ctx.db
        .query("outreachMessages")
        .withIndex("by_contact", (q) => q.eq("contactId", args.contactId!))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("outreachMessages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Query: Get a single message by ID
export const getMessage = query({
  args: { messageId: v.id("outreachMessages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message || message.userId !== userId) {
      return null;
    }

    return message;
  },
});

// Mutation: Create a new outreach search record
export const createSearch = mutation({
  args: {
    query: v.string(),
    resultsCount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("outreachSearches", {
      userId,
      query: args.query,
      resultsCount: args.resultsCount,
      searchedAt: Date.now(),
    });
  },
});

// Mutation: Create a new outreach message
export const createMessage = mutation({
  args: {
    contactId: v.optional(v.id("contacts")),
    contactName: v.string(),
    company: v.string(),
    message: v.string(),
    tone: v.union(v.literal("professional"), v.literal("casual"), v.literal("friendly")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify contact belongs to user if provided
    if (args.contactId) {
      const contact = await ctx.db.get(args.contactId);
      if (!contact || contact.userId !== userId) {
        throw new Error("Contact not found or unauthorized");
      }
    }

    return await ctx.db.insert("outreachMessages", {
      userId,
      contactId: args.contactId,
      contactName: args.contactName,
      company: args.company,
      message: args.message,
      tone: args.tone,
      sent: false,
      createdAt: Date.now(),
    });
  },
});

// Mutation: Mark message as sent
export const markMessageSent = mutation({
  args: { messageId: v.id("outreachMessages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message || message.userId !== userId) {
      throw new Error("Message not found or unauthorized");
    }

    await ctx.db.patch(args.messageId, {
      sent: true,
      sentAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activityLog", {
      userId,
      type: "email_sent",
      contactId: message.contactId,
      description: `Sent outreach email to ${message.contactName}`,
      createdAt: Date.now(),
    });

    // Update contact's lastContacted if message has a contact
    if (message.contactId) {
      await ctx.db.patch(message.contactId, {
        lastContacted: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Mutation: Update an outreach message
export const updateMessage = mutation({
  args: {
    messageId: v.id("outreachMessages"),
    message: v.optional(v.string()),
    tone: v.optional(v.union(v.literal("professional"), v.literal("casual"), v.literal("friendly"))),
    contactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message || message.userId !== userId) {
      throw new Error("Message not found or unauthorized");
    }

    // Verify contact belongs to user if provided
    if (args.contactId) {
      const contact = await ctx.db.get(args.contactId);
      if (!contact || contact.userId !== userId) {
        throw new Error("Contact not found or unauthorized");
      }
    }

    const updates: Partial<Doc<"outreachMessages">> = {};
    if (args.message !== undefined) updates.message = args.message;
    if (args.tone !== undefined) updates.tone = args.tone;
    if (args.contactId !== undefined) updates.contactId = args.contactId;

    await ctx.db.patch(args.messageId, updates);

    return args.messageId;
  },
});

// Mutation: Delete an outreach message
export const deleteMessage = mutation({
  args: { messageId: v.id("outreachMessages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message || message.userId !== userId) {
      throw new Error("Message not found or unauthorized");
    }

    await ctx.db.delete(args.messageId);

    return { success: true };
  },
});

