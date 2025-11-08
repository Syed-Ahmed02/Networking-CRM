import { internalMutation } from "./_generated/server"
import type { Id } from "./_generated/dataModel"

const DEFAULT_CLERK_USER_ID = "user_34vF6uAoNX8n0msZ7UuL82xg1SX"

type ContactSeed = {
  name: string
  firstName: string
  lastName: string
  company: string
  role: string
  stage: "lead" | "contacted" | "meeting" | "closed"
  notes?: string
  linkedinUrl?: string
  email: string
  phone?: string
  location?: {
    city?: string
    state?: string
    country?: string
    timeZone?: string
  }
}

const contactSeeds: ContactSeed[] = [
  {
    name: "Sarah Johnson",
    firstName: "Sarah",
    lastName: "Johnson",
    company: "TechCorp",
    role: "VP of Engineering",
    stage: "lead",
    notes: "Interested in enterprise solution",
    linkedinUrl: "https://linkedin.com/in/sarahjohnson",
    email: "sarah.johnson@techcorp.com",
    phone: "+1 (555) 100-2345",
    location: { city: "San Francisco", state: "CA", country: "USA", timeZone: "America/Los_Angeles" },
  },
  {
    name: "Michael Chen",
    firstName: "Michael",
    lastName: "Chen",
    company: "StartupXYZ",
    role: "Founder & CEO",
    stage: "contacted",
    notes: "Awaiting demo follow-up",
    linkedinUrl: "https://linkedin.com/in/michaelchen",
    email: "michael@startupxyz.com",
    phone: "+1 (555) 200-9876",
    location: { city: "Austin", state: "TX", country: "USA", timeZone: "America/Chicago" },
  },
  {
    name: "Emily Rodriguez",
    firstName: "Emily",
    lastName: "Rodriguez",
    company: "Enterprise Inc",
    role: "CTO",
    stage: "meeting",
    notes: "Next meeting scheduled for next week",
    linkedinUrl: "https://linkedin.com/in/emilyrodriguez",
    email: "emily.r@enterprise.com",
    phone: "+1 (555) 345-6789",
    location: { city: "New York", state: "NY", country: "USA", timeZone: "America/New_York" },
  },
  {
    name: "David Park",
    firstName: "David",
    lastName: "Park",
    company: "Innovation Labs",
    role: "Product Manager",
    stage: "contacted",
    notes: "Sent proposal, awaiting decision",
    linkedinUrl: "https://linkedin.com/in/davidpark",
    email: "david@innovationlabs.com",
    phone: "+1 (555) 789-0123",
    location: { city: "Seattle", state: "WA", country: "USA", timeZone: "America/Los_Angeles" },
  },
  {
    name: "Lisa Wang",
    firstName: "Lisa",
    lastName: "Wang",
    company: "Global Solutions",
    role: "Director of Operations",
    stage: "meeting",
    notes: "Preparing proposal for Q2 rollout",
    linkedinUrl: "https://linkedin.com/in/lisawang",
    email: "lisa.wang@globalsolutions.com",
    phone: "+1 (555) 654-3210",
    location: { city: "Chicago", state: "IL", country: "USA", timeZone: "America/Chicago" },
  },
  {
    name: "James Miller",
    firstName: "James",
    lastName: "Miller",
    company: "Tech Ventures",
    role: "Investment Partner",
    stage: "closed",
    notes: "Closed partnership for 2025 initiatives",
    linkedinUrl: "https://linkedin.com/in/jamesmiller",
    email: "james@techventures.com",
    phone: "+1 (555) 987-6543",
    location: { city: "Boston", state: "MA", country: "USA", timeZone: "America/New_York" },
  },
]

const sanitizePhone = (phone: string) => phone.replace(/[^\d+]/g, "")

export const init = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    let userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", DEFAULT_CLERK_USER_ID))
      .first()

    if (!userDoc) {
      throw new Error(
        "Default seed user not found. Ensure the provided Clerk user exists before running the seed."
      )
    }

    const userId = userDoc._id

    const existingContacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(1)

    if (existingContacts.length > 0) {
      return { status: "skipped", reason: "Contacts already seeded" }
    }

    const contactIds: Id<"contacts">[] = []

    for (let index = 0; index < contactSeeds.length; index++) {
      const seed = contactSeeds[index]
      const createdAt = now - index * 1000 * 60 * 60 * 24
      const contactId = await ctx.db.insert("contacts", {
        userId,
        name: seed.name,
        firstName: seed.firstName,
        lastName: seed.lastName,
        company: seed.company,
        role: seed.role,
        stage: seed.stage,
        notes: seed.notes,
        avatar: undefined,
        lastContacted: createdAt - 1000 * 60 * 60 * 24 * (index + 1),
        createdAt,
        updatedAt: createdAt,
        headline: undefined,
        linkedinUrl: seed.linkedinUrl,
        linkedinUid: undefined,
        twitterUrl: undefined,
        emailStatus: "verified",
        emailSource: "seed",
        location: seed.location,
        source: "seed",
        sourceDisplayName: "Seed Data",
        apolloContactId: undefined,
        apolloPersonId: undefined,
        apolloOrganizationId: undefined,
      })

      contactIds.push(contactId)

      await ctx.db.insert("contactEmails", {
        contactId,
        email: seed.email,
        emailStatus: "verified",
        emailSource: "seed",
        position: 0,
        isPrimary: true,
        createdAt,
      })

      if (seed.phone) {
        await ctx.db.insert("contactPhones", {
          contactId,
          rawNumber: seed.phone,
          sanitizedNumber: sanitizePhone(seed.phone),
          type: "mobile",
          status: "valid_number",
          position: 0,
          isPrimary: true,
          createdAt,
        })
      }
    }

    const followUpSeeds = [
      {
        contactIndex: 0,
        action: "Send product overview deck",
        priority: "high" as const,
        daysSinceLastContact: 5,
      },
      {
        contactIndex: 1,
        action: "Schedule technical demo",
        priority: "medium" as const,
        daysSinceLastContact: 3,
      },
      {
        contactIndex: 4,
        action: "Prepare pricing proposal",
        priority: "high" as const,
        daysSinceLastContact: 7,
      },
    ]

    for (const recommendation of followUpSeeds) {
      const contactId = contactIds[recommendation.contactIndex]
      if (!contactId) continue
      await ctx.db.insert("followUpRecommendations", {
        userId,
        contactId,
        action: recommendation.action,
        priority: recommendation.priority,
        daysSinceLastContact: recommendation.daysSinceLastContact,
        dismissed: false,
        createdAt: now - recommendation.daysSinceLastContact * 24 * 60 * 60 * 1000,
      })
    }

    const calendarSeeds = [
      {
        contactIndex: 2,
        title: "Discovery Call",
        date: "2025-01-15",
        time: "10:00",
        duration: 45,
        type: "video" as const,
        location: "Zoom",
        notes: "Focus on integration requirements",
      },
      {
        contactIndex: 4,
        title: "In-person Meeting",
        date: "2025-01-17",
        time: "14:00",
        duration: 60,
        type: "meeting" as const,
        location: "Global Solutions HQ",
        notes: "Prepare pricing breakdown",
      },
      {
        contactIndex: 1,
        title: "Follow-up Call",
        date: "2025-01-19",
        time: "09:00",
        duration: 30,
        type: "call" as const,
        location: undefined,
        notes: "Discuss feedback from demo",
      },
    ]

    for (const event of calendarSeeds) {
      const contactId = contactIds[event.contactIndex]
      await ctx.db.insert("calendarEvents", {
        userId,
        contactId,
        title: event.title,
        date: event.date,
        time: event.time,
        duration: event.duration,
        type: event.type,
        location: event.location,
        notes: event.notes,
        googleCalendarEventId: undefined,
        createdAt: now,
        updatedAt: now,
      })
    }

    const messageSeeds = [
      {
        contactIndex: 0,
        contactName: "Sarah Johnson",
        company: "TechCorp",
        tone: "professional" as const,
        message:
          "Hi Sarah,\n\nIt was great learning more about TechCorp's roadmap. I'd love to schedule a quick call to walk through how NetworkCRM helps engineering leaders accelerate partner onboarding.\n\nWould next Tuesday at 10am PT work?\n\nBest,\nAlex",
        sent: false,
      },
      {
        contactIndex: 1,
        contactName: "Michael Chen",
        company: "StartupXYZ",
        tone: "friendly" as const,
        message:
          "Hey Michael,\n\nLoved the demo last week! I've pulled together a tailored summary based on your feedback. Let me know when you're free for a quick sync.\n\nCheers,\nAlex",
        sent: true,
      },
      {
        contactIndex: 4,
        contactName: "Lisa Wang",
        company: "Global Solutions",
        tone: "professional" as const,
        message:
          "Hi Lisa,\n\nThanks for outlining your team's operations workflow. I've prepared a proposal that aligns with your Q2 goals.\n\nAre you available Thursday morning for a review?\n\nBest,\nAlex",
        sent: false,
      },
    ]

    for (const msg of messageSeeds) {
      const contactId = contactIds[msg.contactIndex]
      await ctx.db.insert("outreachMessages", {
        userId,
        contactId,
        contactName: msg.contactName,
        company: msg.company,
        message: msg.message,
        tone: msg.tone,
        sent: msg.sent,
        sentAt: msg.sent ? now - 2 * 24 * 60 * 60 * 1000 : undefined,
        createdAt: now - (msg.sent ? 3 : 1) * 24 * 60 * 60 * 1000,
      })

      if (msg.sent) {
        await ctx.db.insert("activityLog", {
          userId,
          type: "email_sent",
          contactId,
          eventId: undefined,
          description: `Sent outreach email to ${msg.contactName}`,
          createdAt: now - 2 * 24 * 60 * 60 * 1000,
        })
      }
    }

    const searches = [
      { query: "TechCorp", resultsCount: 3, searchedAt: now - 5 * 24 * 60 * 60 * 1000 },
      { query: "Enterprise software", resultsCount: 6, searchedAt: now - 3 * 24 * 60 * 60 * 1000 },
      { query: "Global Solutions", resultsCount: 2, searchedAt: now - 24 * 60 * 60 * 1000 },
    ]

    for (const search of searches) {
      await ctx.db.insert("outreachSearches", {
        userId,
        query: search.query,
        resultsCount: search.resultsCount,
        searchedAt: search.searchedAt,
      })
    }

    await ctx.db.insert("integrations", {
      userId,
      type: "apollo",
      apiKey: "seed-apollo-key",
      refreshToken: undefined,
      accessToken: undefined,
      connected: true,
      connectedAt: now - 7 * 24 * 60 * 60 * 1000,
      settings: undefined,
      createdAt: now - 7 * 24 * 60 * 60 * 1000,
      updatedAt: now - 7 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert("integrations", {
      userId,
      type: "google_calendar",
      apiKey: undefined,
      refreshToken: undefined,
      accessToken: undefined,
      connected: true,
      connectedAt: now - 5 * 24 * 60 * 60 * 1000,
      settings: { syncDirection: "two_way" },
      createdAt: now - 5 * 24 * 60 * 60 * 1000,
      updatedAt: now - 5 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert("importHistory", {
      userId,
      fileName: "conference_contacts.csv",
      contactsImported: 45,
      status: "success",
      error: undefined,
      importedAt: now - 10 * 24 * 60 * 60 * 1000,
    })

    await ctx.db.insert("importHistory", {
      userId,
      fileName: "meetup_leads.csv",
      contactsImported: 28,
      status: "success",
      error: undefined,
      importedAt: now - 3 * 24 * 60 * 60 * 1000,
    })

    for (let i = 0; i < contactIds.length; i++) {
      const contactId = contactIds[i]
      const contactSeed = contactSeeds[i]
      await ctx.db.insert("activityLog", {
        userId,
        type: "contact_added",
        contactId,
        eventId: undefined,
        description: `Added contact ${contactSeed.name}`,
        createdAt: now - (i + 1) * 12 * 60 * 60 * 1000,
      })
    }

    return {
      status: "ok",
      userId: userDoc?._id,
      contactsCreated: contactIds.length,
      followUpsCreated: followUpSeeds.length,
      calendarEventsCreated: calendarSeeds.length,
      outreachMessagesCreated: messageSeeds.length,
    }
  },
})

