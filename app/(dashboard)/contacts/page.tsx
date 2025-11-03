"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Upload, Mail, Linkedin, Phone, MoreVertical } from "lucide-react"
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

type Contact = {
  id: string
  name: string
  company: string
  role: string
  email: string
  phone?: string
  linkedin?: string
  lastContacted: string
  notes?: string
  avatar?: string
}

type Column = "lead" | "contacted" | "meeting" | "closed"

const mockContacts: Record<Column, Contact[]> = {
  lead: [
    {
      id: "1",
      name: "Sarah Johnson",
      company: "TechCorp",
      role: "VP of Engineering",
      email: "sarah.j@techcorp.com",
      linkedin: "linkedin.com/in/sarahjohnson",
      lastContacted: "2024-01-15",
      notes: "Interested in our enterprise solution",
    },
    {
      id: "2",
      name: "Michael Chen",
      company: "StartupXYZ",
      role: "Founder & CEO",
      email: "michael@startupxyz.com",
      phone: "+1 (555) 123-4567",
      lastContacted: "2024-01-10",
    },
  ],
  contacted: [
    {
      id: "3",
      name: "Emily Rodriguez",
      company: "Enterprise Inc",
      role: "CTO",
      email: "emily.r@enterprise.com",
      linkedin: "linkedin.com/in/emilyrodriguez",
      lastContacted: "2024-01-18",
      notes: "Sent proposal, awaiting response",
    },
    {
      id: "4",
      name: "David Park",
      company: "Innovation Labs",
      role: "Product Manager",
      email: "david@innovationlabs.com",
      lastContacted: "2024-01-17",
    },
  ],
  meeting: [
    {
      id: "5",
      name: "Lisa Wang",
      company: "Global Solutions",
      role: "Director of Operations",
      email: "lisa.wang@globalsolutions.com",
      phone: "+1 (555) 987-6543",
      lastContacted: "2024-01-20",
      notes: "Demo scheduled for next week",
    },
  ],
  closed: [
    {
      id: "6",
      name: "James Miller",
      company: "Tech Ventures",
      role: "Investment Partner",
      email: "james@techventures.com",
      linkedin: "linkedin.com/in/jamesmiller",
      lastContacted: "2024-01-22",
      notes: "Deal closed - $50k contract",
    },
  ],
}

const columns: { id: Column; title: string; color: string }[] = [
  { id: "lead", title: "Lead", color: "bg-slate-500" },
  { id: "contacted", title: "Contacted", color: "bg-blue-500" },
  { id: "meeting", title: "Meeting", color: "bg-amber-500" },
  { id: "closed", title: "Closed", color: "bg-green-500" },
]

export default function ContactsPage() {
  const [contacts, setContacts] = useState(mockContacts)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [draggedContact, setDraggedContact] = useState<{ contact: Contact; fromColumn: Column } | null>(null)

  const handleDragStart = (contact: Contact, column: Column) => {
    setDraggedContact({ contact, fromColumn: column })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (toColumn: Column) => {
    if (!draggedContact) return

    const { contact, fromColumn } = draggedContact

    if (fromColumn === toColumn) {
      setDraggedContact(null)
      return
    }

    setContacts((prev) => ({
      ...prev,
      [fromColumn]: prev[fromColumn].filter((c) => c.id !== contact.id),
      [toColumn]: [...prev[toColumn], contact],
    }))

    setDraggedContact(null)
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
                    <Input id="name" placeholder="John Doe" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" placeholder="Acme Inc" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" placeholder="CEO" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stage">Stage</Label>
                    <Select defaultValue="lead">
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
                  <Input id="email" type="email" placeholder="john@acme.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input id="phone" placeholder="+1 (555) 123-4567" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="linkedin">LinkedIn (optional)</Label>
                    <Input id="linkedin" placeholder="linkedin.com/in/johndoe" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea id="notes" placeholder="Add any relevant notes..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>Add Contact</Button>
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
                {contacts[column.id].length}
              </Badge>
            </div>

            {/* Contact Cards */}
            <div className="space-y-3">
              {contacts[column.id].map((contact) => (
                <Card
                  key={contact.id}
                  draggable
                  onDragStart={() => handleDragStart(contact, column.id)}
                  className="cursor-move transition-shadow hover:shadow-lg"
                  onClick={() => setSelectedContact(contact)}
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
                        {contact.email}
                      </div>
                      {contact.linkedin && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Linkedin className="h-3 w-3" />
                          LinkedIn
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Last contacted: {new Date(contact.lastContacted).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Detail Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
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
                    <span className="text-sm">{selectedContact.email}</span>
                  </div>
                </div>
                {selectedContact.phone && (
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Phone</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedContact.phone}</span>
                    </div>
                  </div>
                )}
                {selectedContact.linkedin && (
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">LinkedIn</Label>
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedContact.linkedin}</span>
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
                <Button variant="outline" onClick={() => setSelectedContact(null)}>
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
