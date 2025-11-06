import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./helpers";

// Query: Get all organizations for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("organizations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Query: Get organization by ID
export const get = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const organization = await ctx.db.get(args.organizationId);
    if (!organization || organization.userId !== userId) {
      return null;
    }

    return organization;
  },
});

// Query: Get organization by Apollo ID
export const getByApolloId = query({
  args: { apolloOrganizationId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("organizations")
      .withIndex("by_apollo_org_id", (q) => q.eq("apolloOrganizationId", args.apolloOrganizationId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
  },
});

// Query: Get organization by domain
export const getByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("organizations")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
  },
});

// Mutation: Create organization
export const create = mutation({
  args: {
    apolloOrganizationId: v.optional(v.string()),
    apolloAccountId: v.optional(v.string()),
    name: v.string(),
    websiteUrl: v.optional(v.string()),
    domain: v.string(),
    linkedinUrl: v.optional(v.string()),
    linkedinUid: v.optional(v.string()),
    twitterUrl: v.optional(v.string()),
    facebookUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
    alexaRanking: v.optional(v.number()),
    industry: v.optional(v.string()),
    employeeCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    return await ctx.db.insert("organizations", {
      userId,
      apolloOrganizationId: args.apolloOrganizationId,
      apolloAccountId: args.apolloAccountId,
      name: args.name,
      websiteUrl: args.websiteUrl,
      domain: args.domain,
      linkedinUrl: args.linkedinUrl,
      linkedinUid: args.linkedinUid,
      twitterUrl: args.twitterUrl,
      facebookUrl: args.facebookUrl,
      phone: args.phone,
      logoUrl: args.logoUrl,
      foundedYear: args.foundedYear,
      alexaRanking: args.alexaRanking,
      industry: args.industry,
      employeeCount: args.employeeCount,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Mutation: Update organization
export const update = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    domain: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    linkedinUid: v.optional(v.string()),
    twitterUrl: v.optional(v.string()),
    facebookUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
    alexaRanking: v.optional(v.number()),
    industry: v.optional(v.string()),
    employeeCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const organization = await ctx.db.get(args.organizationId);
    if (!organization || organization.userId !== userId) {
      throw new Error("Organization not found or unauthorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.websiteUrl !== undefined) updates.websiteUrl = args.websiteUrl;
    if (args.domain !== undefined) updates.domain = args.domain;
    if (args.linkedinUrl !== undefined) updates.linkedinUrl = args.linkedinUrl;
    if (args.linkedinUid !== undefined) updates.linkedinUid = args.linkedinUid;
    if (args.twitterUrl !== undefined) updates.twitterUrl = args.twitterUrl;
    if (args.facebookUrl !== undefined) updates.facebookUrl = args.facebookUrl;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.logoUrl !== undefined) updates.logoUrl = args.logoUrl;
    if (args.foundedYear !== undefined) updates.foundedYear = args.foundedYear;
    if (args.alexaRanking !== undefined) updates.alexaRanking = args.alexaRanking;
    if (args.industry !== undefined) updates.industry = args.industry;
    if (args.employeeCount !== undefined) updates.employeeCount = args.employeeCount;

    await ctx.db.patch(args.organizationId, updates);

    return args.organizationId;
  },
});

// Mutation: Create or update organization by Apollo ID (upsert)
export const upsertByApolloId = mutation({
  args: {
    apolloOrganizationId: v.string(),
    apolloAccountId: v.optional(v.string()),
    name: v.string(),
    websiteUrl: v.optional(v.string()),
    domain: v.string(),
    linkedinUrl: v.optional(v.string()),
    linkedinUid: v.optional(v.string()),
    twitterUrl: v.optional(v.string()),
    facebookUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
    alexaRanking: v.optional(v.number()),
    industry: v.optional(v.string()),
    employeeCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if organization already exists
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_apollo_org_id", (q) => q.eq("apolloOrganizationId", args.apolloOrganizationId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing organization
      const updates: any = {
        updatedAt: now,
      };

      if (args.name !== undefined) updates.name = args.name;
      if (args.websiteUrl !== undefined) updates.websiteUrl = args.websiteUrl;
      if (args.domain !== undefined) updates.domain = args.domain;
      if (args.linkedinUrl !== undefined) updates.linkedinUrl = args.linkedinUrl;
      if (args.linkedinUid !== undefined) updates.linkedinUid = args.linkedinUid;
      if (args.twitterUrl !== undefined) updates.twitterUrl = args.twitterUrl;
      if (args.facebookUrl !== undefined) updates.facebookUrl = args.facebookUrl;
      if (args.phone !== undefined) updates.phone = args.phone;
      if (args.logoUrl !== undefined) updates.logoUrl = args.logoUrl;
      if (args.foundedYear !== undefined) updates.foundedYear = args.foundedYear;
      if (args.alexaRanking !== undefined) updates.alexaRanking = args.alexaRanking;
      if (args.industry !== undefined) updates.industry = args.industry;
      if (args.employeeCount !== undefined) updates.employeeCount = args.employeeCount;
      if (args.apolloAccountId !== undefined) updates.apolloAccountId = args.apolloAccountId;

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      // Create new organization
      return await ctx.db.insert("organizations", {
        userId,
        apolloOrganizationId: args.apolloOrganizationId,
        apolloAccountId: args.apolloAccountId,
        name: args.name,
        websiteUrl: args.websiteUrl,
        domain: args.domain,
        linkedinUrl: args.linkedinUrl,
        linkedinUid: args.linkedinUid,
        twitterUrl: args.twitterUrl,
        facebookUrl: args.facebookUrl,
        phone: args.phone,
        logoUrl: args.logoUrl,
        foundedYear: args.foundedYear,
        alexaRanking: args.alexaRanking,
        industry: args.industry,
        employeeCount: args.employeeCount,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Mutation: Delete organization
export const remove = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const organization = await ctx.db.get(args.organizationId);
    if (!organization || organization.userId !== userId) {
      throw new Error("Organization not found or unauthorized");
    }

    await ctx.db.delete(args.organizationId);

    return { success: true };
  },
});

