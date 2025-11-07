import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./helpers";
import type { Doc } from "./_generated/dataModel";

// Query: Get all calendar events for the current user
export const list = query({
  args: {
    date: v.optional(v.string()),
    contactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (args.date) {
      return await ctx.db
        .query("calendarEvents")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date!))
        .collect();
    }

    if (args.contactId) {
      return await ctx.db
        .query("calendarEvents")
        .withIndex("by_contact", (q) => q.eq("contactId", args.contactId!))
        .collect();
    }

    return await ctx.db
      .query("calendarEvents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Query: Get events for a date range
export const listByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const allEvents = await ctx.db
      .query("calendarEvents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return allEvents.filter(
      (event) => event.date >= args.startDate && event.date <= args.endDate
    );
  },
});

// Query: Get a single event by ID
export const get = query({
  args: { eventId: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== userId) {
      return null;
    }

    return event;
  },
});

// Mutation: Create a new calendar event
export const create = mutation({
  args: {
    contactId: v.optional(v.id("contacts")),
    title: v.string(),
    date: v.string(),
    time: v.string(),
    duration: v.number(),
    type: v.union(v.literal("call"), v.literal("meeting"), v.literal("video")),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    googleCalendarEventId: v.optional(v.string()),
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

    const now = Date.now();
    const eventId = await ctx.db.insert("calendarEvents", {
      userId,
      contactId: args.contactId,
      title: args.title,
      date: args.date,
      time: args.time,
      duration: args.duration,
      type: args.type,
      location: args.location,
      notes: args.notes,
      googleCalendarEventId: args.googleCalendarEventId,
      createdAt: now,
      updatedAt: now,
    });

    // Log activity
    await ctx.db.insert("activityLog", {
      userId,
      type: "event_created",
      contactId: args.contactId,
      eventId,
      description: `Created ${args.type} event: ${args.title}`,
      createdAt: now,
    });

    return eventId;
  },
});

// Mutation: Update a calendar event
export const update = mutation({
  args: {
    eventId: v.id("calendarEvents"),
    title: v.optional(v.string()),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    duration: v.optional(v.number()),
    type: v.optional(v.union(v.literal("call"), v.literal("meeting"), v.literal("video"))),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    contactId: v.optional(v.id("contacts")),
    googleCalendarEventId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== userId) {
      throw new Error("Event not found or unauthorized");
    }

    // Verify contact belongs to user if provided
    if (args.contactId) {
      const contact = await ctx.db.get(args.contactId);
      if (!contact || contact.userId !== userId) {
        throw new Error("Contact not found or unauthorized");
      }
    }

    const updates: Partial<Doc<"calendarEvents">> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.date !== undefined) updates.date = args.date;
    if (args.time !== undefined) updates.time = args.time;
    if (args.duration !== undefined) updates.duration = args.duration;
    if (args.type !== undefined) updates.type = args.type;
    if (args.location !== undefined) updates.location = args.location;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.contactId !== undefined) updates.contactId = args.contactId;
    if (args.googleCalendarEventId !== undefined) updates.googleCalendarEventId = args.googleCalendarEventId;

    await ctx.db.patch(args.eventId, updates);

    return args.eventId;
  },
});

// Mutation: Delete a calendar event
export const remove = mutation({
  args: { eventId: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== userId) {
      throw new Error("Event not found or unauthorized");
    }

    await ctx.db.delete(args.eventId);

    return { success: true };
  },
});

// Mutation: Mark event as completed
export const markCompleted = mutation({
  args: { eventId: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== userId) {
      throw new Error("Event not found or unauthorized");
    }

    // Log activity
    await ctx.db.insert("activityLog", {
      userId,
      type: "event_completed",
      contactId: event.contactId,
      eventId: args.eventId,
      description: `Completed event: ${event.title}`,
      createdAt: Date.now(),
    });

    // Update contact's lastContacted if event has a contact
    if (event.contactId) {
      const contact = await ctx.db.get(event.contactId);
      if (contact && contact.userId === userId) {
        await ctx.db.patch(event.contactId, {
          lastContacted: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

