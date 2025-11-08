import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./helpers";

// Mutation: Save chat history
export const saveChatHistory = mutation({
  args: {
    messages: v.array(v.any()),
    toolResults: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    // Get the most recent chat history for this user
    const existingChat = await ctx.db
      .query("chatHistory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (existingChat) {
      // Update existing chat history
      await ctx.db.patch(existingChat._id, {
        messages: args.messages,
        toolResults: args.toolResults,
        updatedAt: now,
      });
      return existingChat._id;
    } else {
      // Create new chat history
      const chatId = await ctx.db.insert("chatHistory", {
        userId,
        messages: args.messages,
        toolResults: args.toolResults,
        createdAt: now,
        updatedAt: now,
      });
      return chatId;
    }
  },
});

// Mutation: Save contact from chat
export const saveContactFromChat = mutation({
  args: {
    name: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    company: v.string(),
    role: v.string(),
    linkedinUrl: v.optional(v.string()),
    headline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    // Check if contact already exists by LinkedIn URL
    if (args.linkedinUrl) {
      const existingContact = await ctx.db
        .query("contacts")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("linkedinUrl"), args.linkedinUrl))
        .first();

      if (existingContact) {
        throw new Error("Contact already exists");
      }
    }

    // Create the contact
    const contactId = await ctx.db.insert("contacts", {
      userId,
      name: args.name,
      firstName: args.firstName,
      lastName: args.lastName,
      company: args.company,
      role: args.role,
      headline: args.headline,
      linkedinUrl: args.linkedinUrl,
      stage: "lead",
      lastContacted: now,
      createdAt: now,
      updatedAt: now,
      source: "chat",
      sourceDisplayName: "AI Chat",
    });

    // Log activity
    await ctx.db.insert("activityLog", {
      userId,
      type: "contact_added",
      contactId,
      description: `Added ${args.name} from AI chat`,
      createdAt: now,
    });

    return contactId;
  },
});

// Query: Get chat history
export const getChatHistory = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chatHistory = await ctx.db
      .query("chatHistory")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    return chatHistory;
  },
});

