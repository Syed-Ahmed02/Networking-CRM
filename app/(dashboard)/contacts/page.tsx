'use client'

import type React from "react"

import { useMemo, useState } from "react"
import { Plus, Upload, Mail, Linkedin, Phone, MoreVertical, Loader2 } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { DashboardAuthBoundary } from "../DashboardAuthBoundary"

type Stage = Doc<"contacts">["stage"]

type ContactWithDetails = Doc<"contacts"> & {
  primaryEmail: string | null
  primaryPhone: string | null
  emails: Doc<"contactEmails">[]
  phones: Doc<"contactPhones">[]
}

type Column = Stage

type ContactFormState = {
  name: string
  company: string
  role: string
  stage: Stage
  email: string
  phone: string
  linkedin: string
  notes: string
}

const initialFormState: ContactFormState = {
  name: "",
  company: "",
  role: "",
  stage: "lead",
  email: "",
  phone: "",
  linkedin: "",
  notes: "",
}

const columns: { id: Column; title: string; color: string }[] = [
  { id: "lead", title: "Lead", color: "bg-slate-500" },
  { id: "contacted", title: "Contacted", color: "bg-blue-500" },
  { id: "meeting", title: "Meeting", color: "bg-amber-500" },
  { id: "closed", title: "Closed", color: "bg-green-500" },
]

export default function ContactsPage() {
  return (
    <DashboardAuthBoundary>
      <ContactsContent />
    </DashboardAuthBoundary>
  )
}

function ContactsContent() {
  const contacts = useQuery(api.contacts.list, { stage: undefined })

  const createContact = useMutation(api.contacts.create)
  const updateContactStage = useMutation(api.contacts.updateStage)

  const [selectedContactId, setSelectedContactId] = useState<Id<"contacts"> | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [draggedContact, setDraggedContact] = useState<{ contactId: Id<"contacts">; fromColumn: Column } | null>(null)

  const [formState, setFormState] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLoading = contacts === undefined

  const contactsByStage = useMemo(() => {
    const base: Record<Stage, ContactWithDetails[]> = {
      lead: [],
      contacted: [],
      meeting: [],
      closed: [],
    }
    if (!contacts) return base
    for (const contact of contacts as ContactWithDetails[]) {
      base[contact.stage].push(contact)
    }
    return base
  }, [contacts])

  const selectedContact = useMemo(() => {
    if (!contacts || !selectedContactId) return null
    return (contacts as ContactWithDetails[]).find((contact) => contact._id === selectedContactId) ?? null
  }, [contacts, selectedContactId])

  const handleDragStart = (contactId: Id<"contacts">, column: Column) => {
    setDraggedContact({ contactId, fromColumn: column })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (toColumn: Column) => {
    if (!draggedContact) return

    const { contactId, fromColumn } = draggedContact

    if (fromColumn === toColumn) {
      setDraggedContact(null)
      return
    }

    try {
      await updateContactStage({ contactId, stage: toColumn })
    } catch (error) {
      console.error(error)
      toast("Unable to move contact", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    }
    setDraggedContact(null)
  }

  const handleAddContact = async () => {
    if (!formState.name.trim() || !formState.company.trim() || !formState.role.trim()) {
      toast("Missing details", {
        description: "Name, company, and role are required.",
      })
      return
    }

    setIsSubmitting(true)

    const nameParts = formState.name.trim().split(/\s+/)
    const firstName = nameParts[0] ?? formState.name.trim()
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined
    const sanitizedPhone = formState.phone ? formState.phone.replace(/[^\d+]/g, "") : undefined

    try {
      await createContact({
        name: formState.name.trim(),
        firstName,
        lastName,
        company: formState.company.trim(),
        role: formState.role.trim(),
        stage: formState.stage,
        notes: formState.notes.trim() ? formState.notes.trim() : undefined,
        linkedinUrl: formState.linkedin.trim() ? formState.linkedin.trim() : undefined,
        emails: formState.email.trim()
          ? [
              {
                email: formState.email.trim(),
                emailStatus: "verified",
                emailSource: "manual",
                position: 0,
                isPrimary: true,
              },
            ]
          : undefined,
        phones: formState.phone.trim()
          ? [
              {
                rawNumber: formState.phone.trim(),
                sanitizedNumber: sanitizedPhone ?? formState.phone.trim(),
                type: "mobile",
                status: "valid_number",
                position: 0,
                isPrimary: true,
              },
            ]
          : undefined,
      })

      toast("Contact added", {
        description: `${formState.name.trim()} is now in your pipeline.`,
      })

      setFormState(initialFormState)
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error(error)
      toast("Failed to add contact", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage your networking pipeline</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Contacts</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with your contacts. The file should include columns for name, company, role, and
                  email.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="csv-file">CSV File</Label>
                  <Input id="csv-file" type="file" accept=".csv" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsImportDialogOpen(false)}>Import</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>Enter the contact details to add them to your pipeline.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formState.name}
                        onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                      />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        placeholder="Acme Inc"
                        value={formState.company}
                        onChange={(event) => setFormState((prev) => ({ ...prev, company: event.target.value }))}
                      />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        placeholder="CEO"
                        value={formState.role}
                        onChange={(event) => setFormState((prev) => ({ ...prev, role: event.target.value }))}
                      />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stage">Stage</Label>
                      <Select
                        value={formState.stage}
                        onValueChange={(value: Stage) => setFormState((prev) => ({ ...prev, stage: value }))}
                      >
                        <SelectTrigger id="stage">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@acme.com"
                    value={formState.email}
                    onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      value={formState.phone}
                      onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="linkedin">LinkedIn (optional)</Label>
                    <Input
                      id="linkedin"
                      placeholder="linkedin.com/in/johndoe"
                      value={formState.linkedin}
                      onChange={(event) => setFormState((prev) => ({ ...prev, linkedin: event.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any relevant notes..."
                    value={formState.notes}
                    onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddContact} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add Contact"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex flex-col gap-4"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${column.color}`} />
              <h3 className="font-semibold">{column.title}</h3>
              <Badge variant="secondary" className="ml-auto">
                {contactsByStage[column.id].length}
              </Badge>
            </div>

            {/* Contact Cards */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center rounded-lg border py-10 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading contacts...
                </div>
              ) : contactsByStage[column.id].length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No contacts in this stage yet.
                </div>
              ) : (
                contactsByStage[column.id].map((contact) => (
                <Card
                  key={contact._id}
                  draggable
                  onDragStart={() => handleDragStart(contact._id, column.id)}
                  className="cursor-move transition-shadow hover:shadow-lg"
                  onClick={() => setSelectedContactId(contact._id)}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={contact.avatar || "/placeholder.svg?height=40&width=40"} />
                          <AvatarFallback>
                            {contact.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">{contact.role}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Move to...</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{contact.company}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {contact.primaryEmail ?? "No email recorded"}
                      </div>
                      {contact.linkedinUrl && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Linkedin className="h-3 w-3" />
                          LinkedIn Profile
                        </div>
                      )}
                      {contact.primaryPhone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {contact.primaryPhone}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Last contacted: {new Date(contact.lastContacted).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Detail Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContactId(null)}>
        <DialogContent className="max-w-2xl">
          {selectedContact && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedContact.avatar || "/placeholder.svg?height=64&width=64"} />
                    <AvatarFallback className="text-lg">
                      {selectedContact.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{selectedContact.name}</DialogTitle>
                    <DialogDescription>
                      {selectedContact.role} at {selectedContact.company}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedContact.primaryEmail ?? "No email recorded"}
                    </span>
                  </div>
                </div>
                {selectedContact.primaryPhone && (
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Phone</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedContact.primaryPhone}</span>
                    </div>
                  </div>
                )}
                {selectedContact.linkedinUrl && (
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">LinkedIn</Label>
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={selectedContact.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedContact.linkedinUrl}
                      </a>
                    </div>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Last Contacted</Label>
                  <span className="text-sm">{new Date(selectedContact.lastContacted).toLocaleDateString()}</span>
                </div>
                {selectedContact.notes && (
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm text-muted-foreground">{selectedContact.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedContactId(null)}>
                  Close
                </Button>
                <Button>Edit Contact</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
