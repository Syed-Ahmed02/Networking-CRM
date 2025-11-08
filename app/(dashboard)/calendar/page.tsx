'use client'

import { useCallback, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, Clock, Video, MapPin, Loader2 } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { DashboardAuthBoundary } from "../DashboardAuthBoundary"

type ContactDoc = Doc<"contacts"> & {
  primaryEmail?: string | null
  primaryPhone?: string | null
}

type EventWithContact = Doc<"calendarEvents"> & {
  contact?: ContactDoc
}

type EventType = Doc<"calendarEvents">["type"]
type ScheduleFormState = {
  title: string
  contactId: string
  date: string
  time: string
  duration: string
  type: EventType
  location: string
  notes: string
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDateInput = (date: Date) => formatDateKey(date)

const createInitialScheduleForm = (defaultDate: Date): ScheduleFormState => ({
  title: "",
  contactId: "",
  date: formatDateInput(defaultDate),
  time: "09:00",
  duration: "30",
  type: "call",
  location: "",
  notes: "",
})

export default function CalendarPage() {
  return (
    <DashboardAuthBoundary>
      <CalendarContent />
    </DashboardAuthBoundary>
  )
}

function CalendarContent() {
  const contacts = useQuery(api.contacts.list, { stage: undefined }) as ContactDoc[] | undefined
  const events = useQuery(api.calendarEvents.list, { date: undefined, contactId: undefined })
  const createEvent = useMutation(api.calendarEvents.create)

  const [currentDate, setCurrentDate] = useState(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  })
  const [view, setView] = useState<"month" | "week" | "day">("week")
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<Id<"calendarEvents"> | null>(null)
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(createInitialScheduleForm(new Date()))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const contactMap = useMemo(() => {
    const map = new Map<string, ContactDoc>()
    if (!contacts) return map
    for (const contact of contacts) {
      map.set(contact._id, contact)
    }
    return map
  }, [contacts])

  const enrichedEvents: EventWithContact[] = useMemo(() => {
    if (!events) return []
    return events.map((event) => ({
      ...event,
      contact: event.contactId ? contactMap.get(event.contactId) : undefined,
    }))
  }, [events, contactMap])

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null
    return enrichedEvents.find((event) => event._id === selectedEventId) ?? null
  }, [enrichedEvents, selectedEventId])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: Array<Date | null> = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getWeekDays = (date: Date) => {
    const day = date.getDay()
    const diff = date.getDate() - day
    const sunday = new Date(date)
    sunday.setDate(diff)

    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      const dayOfWeek = new Date(sunday)
      dayOfWeek.setDate(sunday.getDate() + i)
      week.push(dayOfWeek)
    }
    return week
  }

  const getEventsForDate = useCallback(
    (date: Date | null) => {
      if (!date) return []
      const dateKey = formatDateKey(date)
      return enrichedEvents.filter((event) => event.date === dateKey)
    },
    [enrichedEvents],
  )

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + direction * 7)
    setCurrentDate(newDate)
  }

  const getEventTypeIcon = (type: EventWithContact["type"]) => {
    switch (type) {
      case "video":
        return <Video className="h-3 w-3" />
      case "call":
        return <Clock className="h-3 w-3" />
      case "meeting":
        return <MapPin className="h-3 w-3" />
    }
  }

  const getEventTypeColor = (type: EventWithContact["type"]) => {
    switch (type) {
      case "video":
        return "bg-blue-500"
      case "call":
        return "bg-green-500"
      case "meeting":
        return "bg-purple-500"
    }
  }

  const handleScheduleEvent = async () => {
    if (!scheduleForm.title.trim() || !scheduleForm.date || !scheduleForm.time) {
      toast("Missing details", {
        description: "Title, date, and time are required.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await createEvent({
        title: scheduleForm.title.trim(),
        date: scheduleForm.date,
        time: scheduleForm.time,
        duration: Number(scheduleForm.duration),
        type: scheduleForm.type,
        location: scheduleForm.location.trim() ? scheduleForm.location.trim() : undefined,
        notes: scheduleForm.notes.trim() ? scheduleForm.notes.trim() : undefined,
        contactId: scheduleForm.contactId ? (scheduleForm.contactId as Id<"contacts">) : undefined,
      })

      toast("Event scheduled", {
        description: `${scheduleForm.title.trim()} has been added to your calendar.`,
      })

      const resetDate = new Date(scheduleForm.date)
      setScheduleForm(createInitialScheduleForm(resetDate))
      setIsScheduleDialogOpen(false)
    } catch (error) {
      console.error(error)
      toast("Failed to schedule event", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = events === undefined || contacts === undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">Manage your meetings and calls</p>
        </div>
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Call
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule a Call</DialogTitle>
              <DialogDescription>Schedule a meeting or call with a contact</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  placeholder="Product Demo"
                  value={scheduleForm.title}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Contact</Label>
                <Select
                  value={scheduleForm.contactId}
                  onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, contactId: value }))}
                >
                  <SelectTrigger id="contact">
                    <SelectValue placeholder={isLoading ? "Loading contacts..." : "Select a contact"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No contact</SelectItem>
                    {contacts?.map((contact) => (
                      <SelectItem key={contact._id} value={contact._id}>
                        {contact.name} - {contact.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={scheduleForm.date}
                    onChange={(event) => setScheduleForm((prev) => ({ ...prev, date: event.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduleForm.time}
                    onChange={(event) => setScheduleForm((prev) => ({ ...prev, time: event.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select
                    value={scheduleForm.duration}
                    onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, duration: value }))}
                  >
                    <SelectTrigger id="duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={scheduleForm.type}
                    onValueChange={(value: EventType) => setScheduleForm((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="meeting">In-Person Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location (optional)</Label>
                <Input
                  id="location"
                  placeholder="Zoom, Google Meet, or address"
                  value={scheduleForm.location}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, location: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any relevant notes..."
                  value={scheduleForm.notes}
                  onChange={(event) => setScheduleForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleEvent} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Schedule"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => (view === "month" ? navigateMonth(-1) : navigateWeek(-1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-lg font-semibold">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => (view === "month" ? navigateMonth(1) : navigateWeek(1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant={view === "day" ? "default" : "outline"} size="sm" onClick={() => setView("day")}>
                Day
              </Button>
              <Button variant={view === "week" ? "default" : "outline"} size="sm" onClick={() => setView("week")}>
                Week
              </Button>
              <Button variant={view === "month" ? "default" : "outline"} size="sm" onClick={() => setView("month")}>
                Month
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === "week" && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {getWeekDays(currentDate).map((date, index) => {
                  const eventsForDay = getEventsForDate(date)
                  const isToday = date.toDateString() === new Date().toDateString()

                  return (
                    <div
                      key={index}
                      className={cn("min-h-[120px] rounded-lg border p-2", isToday && "border-primary bg-primary/5")}
                    >
                      <div className={cn("mb-2 text-sm font-medium", isToday && "text-primary")}>{date.getDate()}</div>
                      <div className="space-y-1">
                        {eventsForDay.map((event) => (
                          <button
                            key={event._id}
                            onClick={() => setSelectedEventId(event._id)}
                            className="w-full rounded border-l-2 border-primary bg-primary/10 p-1 text-left text-xs hover:bg-primary/20"
                          >
                            <div className="flex items-center gap-1">
                              {getEventTypeIcon(event.type)}
                              <span className="truncate font-medium">
                                {new Date(`${event.date}T${event.time}`).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="truncate">{event.title}</div>
                          </button>
                        ))}
                        {!eventsForDay.length && (
                          <div className="text-center text-[11px] italic text-muted-foreground">No events</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {view === "month" && (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(currentDate).map((date, index) => {
                  if (!date) {
                    return <div key={index} className="min-h-[80px]" />
                  }

                  const eventsForDay = getEventsForDate(date)
                  const isToday = date.toDateString() === new Date().toDateString()

                  return (
                    <div
                      key={index}
                      className={cn("min-h-[80px] rounded-lg border p-2", isToday && "border-primary bg-primary/5")}
                    >
                      <div className={cn("mb-1 text-sm font-medium", isToday && "text-primary")}>{date.getDate()}</div>
                      <div className="space-y-1">
                        {eventsForDay.slice(0, 2).map((event) => (
                          <button
                            key={event._id}
                            onClick={() => setSelectedEventId(event._id)}
                            className={cn(
                              "w-full rounded px-1 py-0.5 text-left text-xs",
                              getEventTypeColor(event.type),
                              "text-white hover:opacity-80",
                            )}
                          >
                            <div className="truncate">{event.title}</div>
                          </button>
                        ))}
                        {eventsForDay.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{eventsForDay.length - 2} more</div>
                        )}
                        {!eventsForDay.length && (
                          <div className="text-center text-[11px] italic text-muted-foreground">No events</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {view === "day" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {daysOfWeek[currentDate.getDay()]}, {months[currentDate.getMonth()]} {currentDate.getDate()}
                </div>
              </div>
              <div className="space-y-3">
                {getEventsForDate(currentDate).map((event) => (
                  <Card key={event._id} className="cursor-pointer hover:bg-accent" onClick={() => setSelectedEventId(event._id)}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={cn("h-12 w-1 rounded", getEventTypeColor(event.type))} />
                      <Avatar>
                        <AvatarImage src={event.contact?.avatar || "/placeholder.svg?height=40&width=40"} />
                        <AvatarFallback>
                          {(event.contact?.name ?? event.title)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{event.title}</p>
                          <Badge variant="outline" className="capitalize">
                            {event.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.contact?.name ?? "No contact"} - {event.contact?.company ?? "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {new Date(`${event.date}T${event.time}`).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">{event.duration} min</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {getEventsForDate(currentDate).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Loading events</h3>
                        <p className="text-sm text-muted-foreground">Fetching your schedule...</p>
                      </>
                    ) : (
                      <>
                        <CalendarIcon className="h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No events scheduled</h3>
                        <p className="text-sm text-muted-foreground">Schedule a call to get started</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEventId(null)}>
        <DialogContent>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  {new Date(`${selectedEvent.date}T${selectedEvent.time}`).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedEvent.contact?.avatar || "/placeholder.svg?height=48&width=48"} />
                    <AvatarFallback>
                      {(selectedEvent.contact?.name ?? selectedEvent.title)
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedEvent.contact?.name ?? "No contact assigned"}</p>
                    <p className="text-sm text-muted-foreground">{selectedEvent.contact?.company ?? "N/A"}</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedEvent.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getEventTypeIcon(selectedEvent.type)}
                    <span className="text-sm capitalize">{selectedEvent.type}</span>
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedEvent.location}</span>
                    </div>
                  )}
                </div>
                {selectedEvent.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedEvent.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedEventId(null)}>
                  Close
                </Button>
                <Button>Edit Event</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

