import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./helpers";
import type { Doc } from "./_generated/dataModel";

// Query: Get current user profile
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db.get(userId);
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

    if (args.userId !== currentUserId) {
      return null;
    }

    return await ctx.db.get(args.userId);
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    if (identity.subject !== args.clerkUserId) {
      throw new Error("Unauthorized");
    }

    const existingId = await getAuthUserId(ctx);
    const existing = existingId ? await ctx.db.get(existingId) : null;

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

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User profile not found");
    }

    const updates: Partial<Doc<"users">> = {
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

    await ctx.db.patch(userId, updates);

    return userId;
  },
});



export const ensureCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called ensureCurrentUser without authentication present");
    }

    const now = Date.now();
    const clerkUserId = identity.subject;
    const nameParts =
      identity.name
        ?.trim()
        .split(/\s+/)
        .filter((part) => part.length > 0) ?? [];
    const firstName =
      identity.givenName ?? (nameParts.length > 0 ? nameParts[0] : "") ?? "";
    const lastName =
      identity.familyName ??
      (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "") ??
      "";
    const email = identity.email ?? "";
    const avatar = identity.pictureUrl ?? undefined;

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (existingUser) {
      const updates: Record<string, unknown> = { updatedAt: now };

      if (firstName && firstName !== existingUser.firstName) {
        updates.firstName = firstName;
      }
      if (lastName && lastName !== existingUser.lastName) {
        updates.lastName = lastName;
      }
      if (email && email !== existingUser.email) {
        updates.email = email;
      }
      if (avatar && avatar !== existingUser.avatar) {
        updates.avatar = avatar;
      }

      if (Object.keys(updates).length > 1) {
        await ctx.db.patch(existingUser._id, updates);
      }

      return existingUser._id;
    }

    const fallbackFirstName = firstName || nameParts[0] || "User";
    const fallbackLastName = lastName || nameParts.slice(1).join(" ");
    const fallbackEmail =
      email ||
      `${clerkUserId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}@example.com`;

    return await ctx.db.insert("users", {
      clerkUserId,
      firstName: fallbackFirstName,
      lastName: fallbackLastName,
      email: fallbackEmail,
      ...(avatar ? { avatar } : {}),
      createdAt: now,
      updatedAt: now,
    });
  },
});