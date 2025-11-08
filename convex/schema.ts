import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table
  users: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_user", ["clerkUserId"]),

  // Organizations table
  organizations: defineTable({
    userId: v.id("users"),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_apollo_org_id", ["apolloOrganizationId"])
    .index("by_domain", ["domain"])
    .index("by_user_apollo_org_id", ["userId", "apolloOrganizationId"])
    .index("by_user_domain", ["userId", "domain"]),

  // Contacts table
  contacts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    company: v.string(),
    role: v.string(),
    headline: v.optional(v.string()),
    stage: v.union(v.literal("lead"), v.literal("contacted"), v.literal("meeting"), v.literal("closed")),
    notes: v.optional(v.string()),
    avatar: v.optional(v.string()),
    lastContacted: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    apolloContactId: v.optional(v.string()),
    apolloPersonId: v.optional(v.string()),
    apolloOrganizationId: v.optional(v.string()),
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
  })
    .index("by_user", ["userId"])
    .index("by_user_stage", ["userId", "stage"])
    .index("by_apollo_contact_id", ["apolloContactId"])
    .index("by_apollo_organization", ["apolloOrganizationId"]),

  // Contact emails table (multiple emails per contact)
  contactEmails: defineTable({
    contactId: v.id("contacts"),
    email: v.string(),
    emailStatus: v.optional(v.union(v.literal("verified"), v.literal("unavailable"), v.literal("invalid"))),
    emailSource: v.optional(v.string()),
    position: v.number(),
    isPrimary: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_contact", ["contactId"])
    .index("by_email", ["email"]),

  // Contact phones table (multiple phones per contact)
  contactPhones: defineTable({
    contactId: v.id("contacts"),
    rawNumber: v.string(),
    sanitizedNumber: v.string(),
    type: v.optional(v.union(v.literal("work_hq"), v.literal("other"), v.literal("mobile"))),
    status: v.optional(v.union(v.literal("valid_number"), v.literal("no_status"))),
    position: v.number(),
    isPrimary: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_contact", ["contactId"]),

  // Employment history table
  employmentHistory: defineTable({
    contactId: v.id("contacts"),
    apolloOrganizationId: v.optional(v.string()),
    organizationName: v.string(),
    title: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    current: v.boolean(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_contact", ["contactId"])
    .index("by_contact_current", ["contactId", "current"]),

  // Calendar events table
  calendarEvents: defineTable({
    userId: v.id("users"),
    contactId: v.optional(v.id("contacts")),
    title: v.string(),
    date: v.string(),
    time: v.string(),
    duration: v.number(),
    type: v.union(v.literal("call"), v.literal("meeting"), v.literal("video")),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    googleCalendarEventId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_contact", ["contactId"]),

  // Outreach searches table
  outreachSearches: defineTable({
    userId: v.id("users"),
    query: v.string(),
    resultsCount: v.number(),
    searchedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "searchedAt"]),

  // Outreach messages table
  outreachMessages: defineTable({
    userId: v.id("users"),
    contactId: v.optional(v.id("contacts")),
    contactName: v.string(),
    company: v.string(),
    message: v.string(),
    tone: v.union(v.literal("professional"), v.literal("casual"), v.literal("friendly")),
    sent: v.boolean(),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_contact", ["contactId"])
    .index("by_user_sent", ["userId", "sent"]),

  // Integrations table
  integrations: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("apollo"), v.literal("google_calendar")),
    apiKey: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    connected: v.boolean(),
    connectedAt: v.optional(v.number()),
    settings: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"]),

  // Import history table
  importHistory: defineTable({
    userId: v.id("users"),
    fileName: v.string(),
    contactsImported: v.number(),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("processing")),
    error: v.optional(v.string()),
    importedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "importedAt"]),

  // Activity log table
  activityLog: defineTable({
    userId: v.id("users"),
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
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "createdAt"])
    .index("by_contact", ["contactId"]),

  // Follow-up recommendations table
  followUpRecommendations: defineTable({
    userId: v.id("users"),
    contactId: v.id("contacts"),
    action: v.string(),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    daysSinceLastContact: v.number(),
    dismissed: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "dismissed"])
    .index("by_contact", ["contactId"]),

  // Chat history table
  chatHistory: defineTable({
    userId: v.id("users"),
    messages: v.array(v.any()),
    toolResults: v.optional(v.array(v.any())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "createdAt"]),
});

