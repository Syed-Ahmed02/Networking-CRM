'use client'

import type React from "react"

import { useCallback, useMemo, useState } from "react"
import { Plus, Upload, Loader2 } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { DashboardAuthBoundary } from "../DashboardAuthBoundary"
import { EditContactDialog } from "@/components/edit-contact-dialog"
import { ContactDetailDialog } from "@/components/contact-detail-dialog"
import { ContactsKanbanBoard } from "@/components/contacts-kanban-board"
import { ContactsListView } from "@/components/contacts-list-view"
import { ContactsTableView } from "@/components/contacts-table-view"
import type { Column, ContactWithDetails, ContactsByStage, Stage as ContactStage } from "@/lib/contacts/types"

type ContactFormState = {
  name: string
  company: string
  role: string
  stage: ContactStage
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

type ContactsView = "kanban" | "list" | "table"

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

  const [editingContactId, setEditingContactId] = useState<Id<"contacts"> | null>(null)
  const [viewingContactId, setViewingContactId] = useState<Id<"contacts"> | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [draggedContact, setDraggedContact] = useState<{ contactId: Id<"contacts">; fromColumn: Column } | null>(null)
  const [activeView, setActiveView] = useState<ContactsView>("table")

  const [formState, setFormState] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLoading = contacts === undefined
  const typedContacts = (contacts as ContactWithDetails[]) ?? []

  const contactsByStage = useMemo<ContactsByStage>(() => {
    const base: ContactsByStage = {
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

  const editingContact = useMemo(() => {
    if (!contacts || !editingContactId) return null
    return (contacts as ContactWithDetails[]).find((contact) => contact._id === editingContactId) ?? null
  }, [contacts, editingContactId])

  const viewingContact = useMemo(() => {
    if (!contacts || !viewingContactId) return null
    return (contacts as ContactWithDetails[]).find((contact) => contact._id === viewingContactId) ?? null
  }, [contacts, viewingContactId])

  const moveContact = useCallback(
    async ({ contactId, fromColumn, toColumn }: { contactId: Id<"contacts">; fromColumn: Column; toColumn: Column }) => {
      if (fromColumn === toColumn) return

      try {
        await updateContactStage({ contactId, stage: toColumn })
      } catch (error) {
        console.error(error)
        toast("Unable to move contact", {
          description: error instanceof Error ? error.message : "Please try again.",
        })
      }
    },
    [updateContactStage],
  )

  const handleDragStart = (contactId: Id<"contacts">) => {
    const contact = contacts?.find((c) => c._id === contactId)
    if (contact) {
      setDraggedContact({ contactId, fromColumn: contact.stage })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (toColumn: Column) => {
    if (!draggedContact) return

    const { contactId, fromColumn } = draggedContact

    try {
      await moveContact({ contactId, fromColumn, toColumn })
    } finally {
      setDraggedContact(null)
    }
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold leading-tight">Contacts</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your networking pipeline</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
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
              <Button className="w-full sm:w-auto">
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        onValueChange={(value) =>
                          setFormState((prev) => ({ ...prev, stage: value as ContactStage }))
                        }
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as ContactsView)} className="space-y-4">
        <TabsList>
          {/* <TabsTrigger value="list">List</TabsTrigger> */}
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>

        </TabsList>
        <TabsContent value="table" className="space-y-4">
          <ContactsTableView
            contacts={typedContacts}
            isLoading={isLoading}
            onContactClick={(contactId) => setViewingContactId(contactId)}
            onContactEdit={(contactId) => setEditingContactId(contactId)}
            onContactDelete={(contactId) => setEditingContactId(contactId)}
          />
        </TabsContent>
        <TabsContent value="kanban" className="space-y-4">
          <ContactsKanbanBoard
            columns={columns}
            contactsByStage={contactsByStage}
            isLoading={isLoading}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onContactClick={(contactId) => setViewingContactId(contactId)}
            onContactEdit={(contactId) => setEditingContactId(contactId)}
            onContactDelete={(contactId) => setEditingContactId(contactId)}
          />
        </TabsContent>
        {/* <TabsContent value="list" className="space-y-4">
          <ContactsListView
            columns={columns}
            contactsByStage={contactsByStage}
            isLoading={isLoading}
            onMoveContact={moveContact}
            onContactClick={(contactId) => setViewingContactId(contactId)}
            onContactEdit={(contactId) => setEditingContactId(contactId)}
            onContactDelete={(contactId) => setEditingContactId(contactId)}
          />
        </TabsContent> */}
        
      </Tabs>

      {/* Contact Detail Dialog */}
      <ContactDetailDialog
        contact={viewingContact}
        open={!!viewingContact}
        onOpenChange={(open) => {
          if (!open) {
            setViewingContactId(null)
          }
        }}
        onEdit={(contactId) => {
          setViewingContactId(null)
          setEditingContactId(contactId)
        }}
        onDelete={(contactId) => {
          setViewingContactId(null)
          setEditingContactId(contactId)
        }}
      />

      {/* Edit Contact Dialog */}
      <EditContactDialog
        contact={editingContact}
        open={!!editingContact}
        onOpenChange={(open) => {
          if (!open) {
            setEditingContactId(null)
          }
        }}
        onSuccess={() => {
          setEditingContactId(null)
        }}
      />
    </div>
  )
}
