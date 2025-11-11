'use client'

import { useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bell, TrendingUp, Users, Calendar, Loader2 } from "lucide-react"
import { DashboardAuthBoundary } from "../DashboardAuthBoundary"

type ContactWithDetails = Doc<"contacts"> & {
  primaryEmail?: string | null
  primaryPhone?: string | null
}

export default function DashboardPage() {
  return (
    <DashboardAuthBoundary>
      <DashboardContent />
    </DashboardAuthBoundary>
  )
}

function DashboardContent() {
  const contacts = useQuery(api.contacts.list, { stage: undefined }) as ContactWithDetails[] | undefined
  const followUps = useQuery(api.followUpRecommendations.getActive, {}) ?? undefined
  const recentActivity = useQuery(api.activityLog.getRecent, { limit: 6 }) ?? undefined
  const events = useQuery(api.calendarEvents.list, { date: undefined, contactId: undefined }) ?? undefined
  const outreachMessages = useQuery(api.outreach.listMessages, { sent: undefined, contactId: undefined }) ?? undefined

  const isLoading =
    contacts === undefined ||
    followUps === undefined ||
    recentActivity === undefined ||
    events === undefined ||
    outreachMessages === undefined

  const { stats, followUpItems, activityItems } = useMemo(() => {
    const contactsList = contacts ?? []
    const followUpList = followUps ?? []
    const activityList = recentActivity ?? []
    const eventsList = events ?? []
    const outreachList = outreachMessages ?? []

    const contactMap = new Map<string, ContactWithDetails>()
    for (const contact of contactsList) {
      contactMap.set(contact._id, contact)
    }

    const now = new Date()
    const startOfWeek = (() => {
      const date = new Date(now)
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1)
      date.setDate(diff)
      date.setHours(0, 0, 0, 0)
      return date
    })()
    const endOfWeek = (() => {
      const date = new Date(startOfWeek)
      date.setDate(date.getDate() + 6)
      date.setHours(23, 59, 59, 999)
      return date
    })()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    const totalContacts = contactsList.length
    const newContactsThisMonth = contactsList.filter((contact) => contact.createdAt >= startOfMonth).length
    const meetingsThisWeek = eventsList.filter((event) => {
      const eventDate = new Date(`${event.date}T00:00:00`)
      return eventDate >= startOfWeek && eventDate <= endOfWeek
    }).length
    const upcomingMeetings = eventsList.filter((event) => new Date(`${event.date}T${event.time}`) >= now).length
    const totalMessages = outreachList.length
    const sentMessages = outreachList.filter((message) => message.sent).length
    const responseRate = totalMessages > 0 ? Math.round((sentMessages / totalMessages) * 100) : 0
    const pendingFollowUps = followUpList.length

    const statsData = [
      {
        title: "Total Contacts",
        value: totalContacts.toString(),
        change: `${newContactsThisMonth} new this month`,
        icon: Users,
      },
      {
        title: "Meetings This Week",
        value: meetingsThisWeek.toString(),
        change: `${upcomingMeetings} upcoming`,
        icon: Calendar,
      },
      {
        title: "Response Rate",
        value: `${responseRate}%`,
        change: `${sentMessages}/${totalMessages} messages sent`,
        icon: TrendingUp,
      },
      {
        title: "Pending Follow-ups",
        value: pendingFollowUps.toString(),
        change: "Active recommendations",
        icon: Bell,
      },
    ]

    const followUpItemsData = followUpList.map((rec) => ({
      ...rec,
      contact: rec.contactId ? contactMap.get(rec.contactId) : undefined,
    }))

    const activityItemsData = activityList.map((activity) => {
      const contact = activity.contactId ? contactMap.get(activity.contactId) : undefined
      return { activity, contact }
    })

    return {
      stats: statsData,
      followUpItems: followUpItemsData,
      activityItems: activityItemsData,
    }
  }, [contacts, followUps, recentActivity, events, outreachMessages])

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] w-full items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold leading-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome back! Here&apos;s your networking overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-border/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-balance">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Follow-up Recommendations */}
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Follow-up Recommendations</CardTitle>
            <CardDescription>AI-powered suggestions for your next actions</CardDescription>
          </CardHeader>
          <CardContent>
            {followUpItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                You&apos;re all caught up! No active recommendations.
              </div>
            ) : (
              <div className="space-y-4">
                {followUpItems.map((rec) => (
                  <div
                    key={rec._id}
                    className="flex flex-col gap-4 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-start"
                  >
                    <Avatar className="shrink-0">
                      <AvatarImage src={rec.contact?.avatar || "/placeholder.svg?height=40&width=40"} />
                      <AvatarFallback>
                        {(rec.contact?.name || rec.contactId)
                          ?.toString()
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium leading-tight">{rec.contact?.name ?? "Unknown contact"}</p>
                        <Badge
                          variant={
                            rec.priority === "high"
                              ? "destructive"
                              : rec.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                          className="capitalize"
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.contact?.company ?? "No company recorded"}</p>
                      <p className="text-sm leading-relaxed text-balance">{rec.action}</p>
                      <p className="text-xs font-medium text-muted-foreground">
                        Last contact: {rec.daysSinceLastContact} days ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {activityItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No recent activity recorded.
              </div>
            ) : (
              <div className="space-y-4">
                {activityItems.map(({ activity, contact }) => (
                  <div
                    key={activity._id}
                    className="flex flex-col gap-3 rounded-lg border border-border/60 p-4 sm:flex-row sm:items-center"
                  >
                    <Avatar className="shrink-0">
                      <AvatarImage src={contact?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {(contact?.name ?? "NA")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium leading-tight">{contact?.name ?? "General activity"}</p>
                      <p className="text-sm text-muted-foreground">{contact?.company ?? "No associated contact"}</p>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:text-right">
                      <p className="font-medium text-foreground">{activity.description}</p>
                      <p className="text-xs">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
