import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./helpers";

// Query: Get current user profile
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", userId))
      .first();

    return user;
  },
});

// Query: Get user by ID
export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(args.userId);
    if (!user || user.clerkUserId !== currentUserId) {
      return null;
    }

    return user;
  },
});

// Mutation: Create or update user profile (upsert based on clerkUserId)
export const upsert = mutation({
  args: {
    clerkUserId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    role: v.optional(v.string()),
    company: v.optional(v.string()),
    location: v.optional(v.string()),
    phone: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || userId !== args.clerkUserId) {
      throw new Error("Not authenticated or unauthorized");
    }

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        role: args.role,
        company: args.company,
        location: args.location,
        phone: args.phone,
        linkedin: args.linkedin,
        avatar: args.avatar,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        clerkUserId: args.clerkUserId,
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        role: args.role,
        company: args.company,
        location: args.location,
        phone: args.phone,
        linkedin: args.linkedin,
        avatar: args.avatar,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Mutation: Update user profile
export const update = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.string()),
    company: v.optional(v.string()),
    location: v.optional(v.string()),
    phone: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", userId))
      .first();

    if (!user) {
      throw new Error("User profile not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.email !== undefined) updates.email = args.email;
    if (args.role !== undefined) updates.role = args.role;
    if (args.company !== undefined) updates.company = args.company;
    if (args.location !== undefined) updates.location = args.location;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.linkedin !== undefined) updates.linkedin = args.linkedin;
    if (args.avatar !== undefined) updates.avatar = args.avatar;

    await ctx.db.patch(user._id, updates);

    return user._id;
  },
});

