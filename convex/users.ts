import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./helpers";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

type IdentityInput = {
  subject: string;
  tokenIdentifier?: string | null;
  issuer?: string | null;
  name?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  email?: string | null;
  pictureUrl?: string | null;
};

async function persistUserFromIdentity(
  ctx: MutationCtx,
  identity: IdentityInput,
) {
  const tokenIdentifier =
    identity.tokenIdentifier ??
    `${identity.subject}#${identity.issuer ?? "clerk"}`;
  const now = Date.now();

  const existing = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();

  const nameParts =
    identity.name
      ?.trim()
      .split(/\s+/)
      .filter((part) => part.length > 0) ?? [];

  const firstName =
    identity.givenName ?? (nameParts.length > 0 ? nameParts[0] : "") ?? "User";
  const lastName =
    identity.familyName ??
    (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "") ??
    "";
  const email =
    identity.email ??
    `${identity.subject.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}@example.com`;
  const avatar = identity.pictureUrl ?? undefined;

  if (existing) {
    const updates: Partial<Doc<"users">> = { updatedAt: now };

    if (existing.clerkUserId !== identity.subject) {
      updates.clerkUserId = identity.subject;
    }
    if (existing.firstName !== firstName) {
      updates.firstName = firstName;
    }
    if (existing.lastName !== lastName) {
      updates.lastName = lastName;
    }
    if (existing.email !== email) {
      updates.email = email;
    }
    if (existing.avatar !== avatar) {
      updates.avatar = avatar;
    }
    if (existing.tokenIdentifier !== tokenIdentifier) {
      updates.tokenIdentifier = tokenIdentifier;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(existing._id, updates);
    }

    return existing._id;
  }

  return await ctx.db.insert("users", {
    clerkUserId: identity.subject,
    tokenIdentifier,
    firstName,
    lastName,
    email,
    avatar,
    createdAt: now,
    updatedAt: now,
  });
}

// Mutation: Persist the current authenticated user (called from client after sign-in)
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called store without authentication");
    }

    return persistUserFromIdentity(ctx, {
      subject: identity.subject,
      tokenIdentifier: identity.tokenIdentifier ?? undefined,
      issuer: identity.issuer ?? undefined,
      name: identity.name ?? undefined,
      givenName: identity.givenName ?? undefined,
      familyName: identity.familyName ?? undefined,
      email: identity.email ?? undefined,
      pictureUrl: identity.pictureUrl ?? undefined,
    });
  },
});

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

    return persistUserFromIdentity(ctx, {
      subject: identity.subject,
      tokenIdentifier: identity.tokenIdentifier ?? undefined,
      issuer: identity.issuer ?? undefined,
      name: identity.name ?? undefined,
      givenName: identity.givenName ?? undefined,
      familyName: identity.familyName ?? undefined,
      email: identity.email ?? undefined,
      pictureUrl: identity.pictureUrl ?? undefined,
    });
  },
});