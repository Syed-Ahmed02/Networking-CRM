import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./helpers";

// Query: Get all contacts for the current user
export const list = query({
  args: {
    stage: v.optional(v.union(v.literal("lead"), v.literal("contacted"), v.literal("meeting"), v.literal("closed"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (args.stage) {
      const stage = args.stage;
      return await ctx.db
        .query("contacts")
        .withIndex("by_user_stage", (q) => q.eq("userId", userId).eq("stage", stage))
        .collect();
    }

    return await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Query: Get a single contact by ID
export const get = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      return null;
    }

    // Get related data
    const emails = await ctx.db
      .query("contactEmails")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();

    const phones = await ctx.db
      .query("contactPhones")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();

    const employmentHistory = await ctx.db
      .query("employmentHistory")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();

    return {
      ...contact,
      emails,
      phones,
      employmentHistory,
    };
  },
});

// Mutation: Create a new contact
export const create = mutation({
  args: {
    name: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    company: v.string(),
    role: v.string(),
    headline: v.optional(v.string()),
    stage: v.union(v.literal("lead"), v.literal("contacted"), v.literal("meeting"), v.literal("closed")),
    notes: v.optional(v.string()),
    avatar: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    linkedinUid: v.optional(v.string()),
    twitterUrl: v.optional(v.string()),
    emailStatus: v.optional(v.union(v.literal("verified"), v.literal("unavailable"), v.literal("invalid"))),
    emailSource: v.optional(v.string()),
    location: v.optional(v.object({
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      country: v.optional(v.string()),
      timeZone: v.optional(v.string()),
    })),
    source: v.optional(v.string()),
    sourceDisplayName: v.optional(v.string()),
    apolloContactId: v.optional(v.string()),
    apolloPersonId: v.optional(v.string()),
    apolloOrganizationId: v.optional(v.string()),
    emails: v.optional(v.array(v.object({
      email: v.string(),
      emailStatus: v.optional(v.union(v.literal("verified"), v.literal("unavailable"), v.literal("invalid"))),
      emailSource: v.optional(v.string()),
      position: v.number(),
      isPrimary: v.boolean(),
    }))),
    phones: v.optional(v.array(v.object({
      rawNumber: v.string(),
      sanitizedNumber: v.string(),
      type: v.optional(v.union(v.literal("work_hq"), v.literal("other"), v.literal("mobile"))),
      status: v.optional(v.union(v.literal("valid_number"), v.literal("no_status"))),
      position: v.number(),
      isPrimary: v.boolean(),
    }))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();

    // Create the contact
    const contactId = await ctx.db.insert("contacts", {
      userId,
      name: args.name,
      firstName: args.firstName,
      lastName: args.lastName,
      company: args.company,
      role: args.role,
      headline: args.headline,
      stage: args.stage,
      notes: args.notes,
      avatar: args.avatar,
      lastContacted: now,
      createdAt: now,
      updatedAt: now,
      apolloContactId: args.apolloContactId,
      apolloPersonId: args.apolloPersonId,
      apolloOrganizationId: args.apolloOrganizationId,
      linkedinUrl: args.linkedinUrl,
      linkedinUid: args.linkedinUid,
      twitterUrl: args.twitterUrl,
      emailStatus: args.emailStatus,
      emailSource: args.emailSource,
      location: args.location,
      source: args.source,
      sourceDisplayName: args.sourceDisplayName,
    });

    // Create email records if provided
    if (args.emails) {
      for (const email of args.emails) {
        await ctx.db.insert("contactEmails", {
          contactId,
          email: email.email,
          emailStatus: email.emailStatus,
          emailSource: email.emailSource,
          position: email.position,
          isPrimary: email.isPrimary,
          createdAt: now,
        });
      }
    }

    // Create phone records if provided
    if (args.phones) {
      for (const phone of args.phones) {
        await ctx.db.insert("contactPhones", {
          contactId,
          rawNumber: phone.rawNumber,
          sanitizedNumber: phone.sanitizedNumber,
          type: phone.type,
          status: phone.status,
          position: phone.position,
          isPrimary: phone.isPrimary,
          createdAt: now,
        });
      }
    }

    // Log activity
    await ctx.db.insert("activityLog", {
      userId,
      type: "contact_added",
      contactId,
      description: `Added contact ${args.name}`,
      createdAt: now,
    });

    return contactId;
  },
});

// Mutation: Update a contact
export const update = mutation({
  args: {
    contactId: v.id("contacts"),
    name: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    company: v.optional(v.string()),
    role: v.optional(v.string()),
    headline: v.optional(v.string()),
    stage: v.optional(v.union(v.literal("lead"), v.literal("contacted"), v.literal("meeting"), v.literal("closed"))),
    notes: v.optional(v.string()),
    avatar: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    linkedinUid: v.optional(v.string()),
    twitterUrl: v.optional(v.string()),
    emailStatus: v.optional(v.union(v.literal("verified"), v.literal("unavailable"), v.literal("invalid"))),
    emailSource: v.optional(v.string()),
    location: v.optional(v.object({
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      country: v.optional(v.string()),
      timeZone: v.optional(v.string()),
    })),
    lastContacted: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found or unauthorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.company !== undefined) updates.company = args.company;
    if (args.role !== undefined) updates.role = args.role;
    if (args.headline !== undefined) updates.headline = args.headline;
    if (args.stage !== undefined) updates.stage = args.stage;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.avatar !== undefined) updates.avatar = args.avatar;
    if (args.linkedinUrl !== undefined) updates.linkedinUrl = args.linkedinUrl;
    if (args.linkedinUid !== undefined) updates.linkedinUid = args.linkedinUid;
    if (args.twitterUrl !== undefined) updates.twitterUrl = args.twitterUrl;
    if (args.emailStatus !== undefined) updates.emailStatus = args.emailStatus;
    if (args.emailSource !== undefined) updates.emailSource = args.emailSource;
    if (args.location !== undefined) updates.location = args.location;
    if (args.lastContacted !== undefined) updates.lastContacted = args.lastContacted;

    await ctx.db.patch(args.contactId, updates);

    // Log activity
    await ctx.db.insert("activityLog", {
      userId,
      type: args.stage && args.stage !== contact.stage ? "contact_moved" : "contact_updated",
      contactId: args.contactId,
      description: `Updated contact ${contact.name}`,
      createdAt: Date.now(),
    });

    return args.contactId;
  },
});

// Mutation: Update contact stage (move in pipeline)
export const updateStage = mutation({
  args: {
    contactId: v.id("contacts"),
    stage: v.union(v.literal("lead"), v.literal("contacted"), v.literal("meeting"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found or unauthorized");
    }

    await ctx.db.patch(args.contactId, {
      stage: args.stage,
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activityLog", {
      userId,
      type: "contact_moved",
      contactId: args.contactId,
      description: `Moved ${contact.name} to ${args.stage} stage`,
      createdAt: Date.now(),
    });

    return args.contactId;
  },
});

// Mutation: Delete a contact
export const remove = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found or unauthorized");
    }

    // Delete related emails
    const emails = await ctx.db
      .query("contactEmails")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();
    for (const email of emails) {
      await ctx.db.delete(email._id);
    }

    // Delete related phones
    const phones = await ctx.db
      .query("contactPhones")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();
    for (const phone of phones) {
      await ctx.db.delete(phone._id);
    }

    // Delete employment history
    const employmentHistory = await ctx.db
      .query("employmentHistory")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();
    for (const employment of employmentHistory) {
      await ctx.db.delete(employment._id);
    }

    // Delete the contact
    await ctx.db.delete(args.contactId);

    return { success: true };
  },
});

// Mutation: Add email to contact
export const addEmail = mutation({
  args: {
    contactId: v.id("contacts"),
    email: v.string(),
    emailStatus: v.optional(v.union(v.literal("verified"), v.literal("unavailable"), v.literal("invalid"))),
    emailSource: v.optional(v.string()),
    position: v.number(),
    isPrimary: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found or unauthorized");
    }

    return await ctx.db.insert("contactEmails", {
      contactId: args.contactId,
      email: args.email,
      emailStatus: args.emailStatus,
      emailSource: args.emailSource,
      position: args.position,
      isPrimary: args.isPrimary,
      createdAt: Date.now(),
    });
  },
});

// Mutation: Add phone to contact
export const addPhone = mutation({
  args: {
    contactId: v.id("contacts"),
    rawNumber: v.string(),
    sanitizedNumber: v.string(),
    type: v.optional(v.union(v.literal("work_hq"), v.literal("other"), v.literal("mobile"))),
    status: v.optional(v.union(v.literal("valid_number"), v.literal("no_status"))),
    position: v.number(),
    isPrimary: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found or unauthorized");
    }

    return await ctx.db.insert("contactPhones", {
      contactId: args.contactId,
      rawNumber: args.rawNumber,
      sanitizedNumber: args.sanitizedNumber,
      type: args.type,
      status: args.status,
      position: args.position,
      isPrimary: args.isPrimary,
      createdAt: Date.now(),
    });
  },
});

// Mutation: Add employment history entry
export const addEmploymentHistory = mutation({
  args: {
    contactId: v.id("contacts"),
    apolloOrganizationId: v.optional(v.string()),
    organizationName: v.string(),
    title: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    current: v.boolean(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== userId) {
      throw new Error("Contact not found or unauthorized");
    }

    return await ctx.db.insert("employmentHistory", {
      contactId: args.contactId,
      apolloOrganizationId: args.apolloOrganizationId,
      organizationName: args.organizationName,
      title: args.title,
      startDate: args.startDate,
      endDate: args.endDate,
      current: args.current,
      description: args.description,
      createdAt: Date.now(),
    });
  },
});

