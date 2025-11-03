"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, Clock, Video, MapPin } from "lucide-react"
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

type CalendarEvent = {
  id: string
  title: string
  contact: string
  company: string
  date: string
  time: string
  duration: number
  type: "call" | "meeting" | "video"
  location?: string
  notes?: string
  avatar?: string
}

const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Product Demo",
    contact: "Sarah Johnson",
    company: "TechCorp",
    date: "2024-01-25",
    time: "10:00 AM",
    duration: 60,
    type: "video",
    location: "Zoom",
    notes: "Demo of enterprise features",
  },
  {
    id: "2",
    title: "Follow-up Call",
    contact: "Michael Chen",
    company: "StartupXYZ",
    date: "2024-01-25",
    time: "2:00 PM",
    duration: 30,
    type: "call",
  },
  {
    id: "3",
    title: "Coffee Meeting",
    contact: "Emily Rodriguez",
    company: "Enterprise Inc",
    date: "2024-01-26",
    time: "11:00 AM",
    duration: 45,
    type: "meeting",
    location: "Starbucks Downtown",
  },
  {
    id: "4",
    title: "Quarterly Review",
    contact: "David Park",
    company: "Innovation Labs",
    date: "2024-01-27",
    time: "3:00 PM",
    duration: 90,
    type: "video",
    location: "Google Meet",
  },
  {
    id: "5",
    title: "Introduction Call",
    contact: "Lisa Wang",
    company: "Global Solutions",
    date: "2024-01-29",
    time: "9:00 AM",
    duration: 30,
    type: "call",
  },
]

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

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 25)) // January 25, 2024
  const [view, setView] = useState<"month" | "week" | "day">("week")
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
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

    const week = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday)
      day.setDate(sunday.getDate() + i)
      week.push(day)
    }
    return week
  }

  const getEventsForDate = (date: Date | null) => {
    if (!date) return []
    const dateStr = date.toISOString().split("T")[0]
    return mockEvents.filter((event) => event.date === dateStr)
  }

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

  const getEventTypeIcon = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "video":
        return <Video className="h-3 w-3" />
      case "call":
        return <Clock className="h-3 w-3" />
      case "meeting":
        return <MapPin className="h-3 w-3" />
    }
  }

  const getEventTypeColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "video":
        return "bg-blue-500"
      case "call":
        return "bg-green-500"
      case "meeting":
        return "bg-purple-500"
    }
  }

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
                <Input id="event-title" placeholder="Product Demo" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Contact</Label>
                <Select>
                  <SelectTrigger id="contact">
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Sarah Johnson - TechCorp</SelectItem>
                    <SelectItem value="2">Michael Chen - StartupXYZ</SelectItem>
                    <SelectItem value="3">Emily Rodriguez - Enterprise Inc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" type="time" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select defaultValue="30">
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
                  <Select defaultValue="video">
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
                <Input id="location" placeholder="Zoom, Google Meet, or address" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" placeholder="Add any relevant notes..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsScheduleDialogOpen(false)}>Schedule</Button>
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
                  const events = getEventsForDate(date)
                  const isToday = date.toDateString() === new Date(2024, 0, 25).toDateString()

                  return (
                    <div
                      key={index}
                      className={cn("min-h-[120px] rounded-lg border p-2", isToday && "border-primary bg-primary/5")}
                    >
                      <div className={cn("mb-2 text-sm font-medium", isToday && "text-primary")}>{date.getDate()}</div>
                      <div className="space-y-1">
                        {events.map((event) => (
                          <button
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="w-full rounded border-l-2 border-primary bg-primary/10 p-1 text-left text-xs hover:bg-primary/20"
                          >
                            <div className="flex items-center gap-1">
                              {getEventTypeIcon(event.type)}
                              <span className="truncate font-medium">{event.time}</span>
                            </div>
                            <div className="truncate">{event.title}</div>
                          </button>
                        ))}
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

                  const events = getEventsForDate(date)
                  const isToday = date.toDateString() === new Date(2024, 0, 25).toDateString()

                  return (
                    <div
                      key={index}
                      className={cn("min-h-[80px] rounded-lg border p-2", isToday && "border-primary bg-primary/5")}
                    >
                      <div className={cn("mb-1 text-sm font-medium", isToday && "text-primary")}>{date.getDate()}</div>
                      <div className="space-y-1">
                        {events.slice(0, 2).map((event) => (
                          <button
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={cn(
                              "w-full rounded px-1 py-0.5 text-left text-xs",
                              getEventTypeColor(event.type),
                              "text-white hover:opacity-80",
                            )}
                          >
                            <div className="truncate">{event.title}</div>
                          </button>
                        ))}
                        {events.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{events.length - 2} more</div>
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
                  <Card
                    key={event.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={cn("h-12 w-1 rounded", getEventTypeColor(event.type))} />
                      <Avatar>
                        <AvatarImage src={event.avatar || "/placeholder.svg?height=40&width=40"} />
                        <AvatarFallback>
                          {event.contact
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
                          {event.contact} - {event.company}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{event.time}</p>
                        <p className="text-sm text-muted-foreground">{event.duration} min</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {getEventsForDate(currentDate).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No events scheduled</h3>
                    <p className="text-sm text-muted-foreground">Schedule a call to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  {selectedEvent.date} at {selectedEvent.time}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedEvent.avatar || "/placeholder.svg?height=48&width=48"} />
                    <AvatarFallback>
                      {selectedEvent.contact
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedEvent.contact}</p>
                    <p className="text-sm text-muted-foreground">{selectedEvent.company}</p>
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
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>
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
