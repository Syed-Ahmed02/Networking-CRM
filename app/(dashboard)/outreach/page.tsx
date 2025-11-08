'use client'

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { Search, Plus, Loader2, Sparkles, Mail, Linkedin, MapPin, Edit, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { DashboardAuthBoundary } from "../DashboardAuthBoundary"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ContactDoc = Doc<"contacts"> & {
  primaryEmail?: string | null
  primaryPhone?: string | null
}

type OutreachMessageDoc = Doc<"outreachMessages">

export default function OutreachPage() {
  return (
    <DashboardAuthBoundary>
      <OutreachContent />
    </DashboardAuthBoundary>
  )
}

function OutreachContent() {
  const contacts = useQuery(api.contacts.list, { stage: undefined }) as ContactDoc[] | undefined
  const outreachMessages = useQuery(api.outreach.listMessages, { sent: undefined, contactId: undefined })

  const createSearch = useMutation(api.outreach.createSearch)
  const markMessageSent = useMutation(api.outreach.markMessageSent)
  const createMessage = useMutation(api.outreach.createMessage)
  const updateMessage = useMutation(api.outreach.updateMessage)

  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchResults, setSearchResults] = useState<ContactDoc[]>([])
  const [editingContact, setEditingContact] = useState<ContactDoc | null>(null)
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false)
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; message: string } | null>(null)
  const [emailPurpose, setEmailPurpose] = useState("")
  const [emailTone, setEmailTone] = useState<"professional" | "casual" | "friendly">("professional")
  const [editingMessageId, setEditingMessageId] = useState<Doc<"outreachMessages">["_id"] | null>(null)
  const [editingMessageText, setEditingMessageText] = useState("")
  const [editingMessageTone, setEditingMessageTone] = useState<"professional" | "casual" | "friendly">("professional")

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) {
      toast("Search query required", {
        description: "Please enter a company name or contact to search.",
      })
      return
    }

    if (!contacts) {
      toast("Contacts still loading", {
        description: "Please wait a moment and try again.",
      })
      return
    }

    setIsSearching(true)
    setHasSearched(false)

    const queryLower = trimmedQuery.toLowerCase()
    const filteredContacts = contacts.filter((contact) => {
      const nameMatches = contact.name.toLowerCase().includes(queryLower)
      const companyMatches = contact.company.toLowerCase().includes(queryLower)
      return nameMatches || companyMatches
    })

    try {
      await createSearch({
        query: trimmedQuery,
        resultsCount: filteredContacts.length,
      })
    } catch (error) {
      console.error(error)
      toast("Unable to record search", {
        description: error instanceof Error ? error.message : "Please try again later.",
      })
    }

    setSearchResults(filteredContacts)
    setIsSearching(false)
    setHasSearched(true)
  }

  const handleAddToContacts = (contact: ContactDoc) => {
    toast("Contact ready", {
      description: `${contact.name} is already in your workspace.`,
    })
  }

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message)
    toast("Message copied", {
      description: "The outreach message has been copied to your clipboard.",
    })
  }

  const handleMarkSent = async (message: OutreachMessageDoc) => {
    try {
      await markMessageSent({ messageId: message._id })
      toast("Marked as sent", {
        description: `Logged outreach to ${message.contactName}.`,
      })
    } catch (error) {
      console.error(error)
      toast("Unable to update message", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    }
  }

  const suggestions = useMemo(() => {
    if (!outreachMessages) return []
    return outreachMessages.map((message) => ({
      ...message,
      statusLabel: message.sent ? "Sent" : "Draft",
    }))
  }, [outreachMessages])

  const isSuggestionsLoading = outreachMessages === undefined
  const isContactsLoading = contacts === undefined
  const hasResults = hasSearched && searchResults.length > 0

  const getLocationDisplay = (contact: ContactDoc) => {
    const parts = [
      contact.location?.city,
      contact.location?.state,
      contact.location?.country,
    ].filter(Boolean)
    return parts.join(", ") || "Unknown"
  }

  const handleGenerateEmail = async () => {
    if (!editingContact) return

    if (!emailPurpose.trim()) {
      toast.error("Please enter a purpose for the email", {
        description: "The email purpose is required to generate a personalized message.",
      })
      return
    }

    setIsGeneratingEmail(true)
    setGeneratedEmail(null)

    try {
      const response = await fetch("/api/outreach/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact: {
            name: editingContact.name,
            firstName: editingContact.firstName,
            company: editingContact.company,
            role: editingContact.role,
            headline: editingContact.headline,
            linkedinUrl: editingContact.linkedinUrl,
            location: editingContact.location,
          },
          tone: emailTone,
          purpose: emailPurpose,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate email")
      }

      const data = await response.json()
      const emailData = {
        subject: data.email.subject,
        message: data.email.message,
      }
      setGeneratedEmail(emailData)
      
      // Auto-save the generated email
      if (editingContact) {
        try {
          await createMessage({
            contactId: editingContact._id,
            contactName: editingContact.name,
            company: editingContact.company,
            message: `Subject: ${emailData.subject}\n\n${emailData.message}`,
            tone: emailTone,
          })
          toast.success("Email generated and saved!", {
            description: "Your personalized outreach email has been saved to Outreach Messages.",
          })
        } catch (saveError) {
          console.error("Error auto-saving email:", saveError)
          toast.success("Email generated successfully!", {
            description: "Your personalized outreach email is ready. You can save it manually.",
          })
        }
      } else {
        toast.success("Email generated successfully!", {
          description: "Your personalized outreach email is ready.",
        })
      }
    } catch (error) {
      console.error("Error generating email:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate email", {
        description: "Please try again or check your connection.",
      })
    } finally {
      setIsGeneratingEmail(false)
    }
  }

  const handleSaveEmail = async () => {
    if (!editingContact || !generatedEmail) return

    try {
      await createMessage({
        contactId: editingContact._id,
        contactName: editingContact.name,
        company: editingContact.company,
        message: `Subject: ${generatedEmail.subject}\n\n${generatedEmail.message}`,
        tone: emailTone,
      })
      toast.success("Email saved to outreach messages", {
        description: "The email has been added to your outreach drafts.",
      })
      setEditingContact(null)
      setGeneratedEmail(null)
      setEmailPurpose("")
    } catch (error) {
      console.error("Error saving email:", error)
      toast.error("Failed to save email", {
        description: "Please try again.",
      })
    }
  }

  const handleCopyEmail = () => {
    if (!generatedEmail) return
    const fullEmail = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.message}`
    navigator.clipboard.writeText(fullEmail)
    toast.success("Email copied to clipboard", {
      description: "The email has been copied to your clipboard.",
    })
  }

  const columns: ColumnDef<ContactDoc>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const contact = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={contact.avatar || "/placeholder.svg?height=32&width=32"} />
              <AvatarFallback>
                {contact.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{contact.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }) => row.original.company,
    },
    {
      accessorKey: "primaryEmail",
      header: "Email",
      cell: ({ row }) => {
        const email = row.original.primaryEmail
        return email ? (
          <a href={`mailto:${email}`} className="text-primary hover:underline">
            {email}
          </a>
        ) : (
          <span className="text-muted-foreground">No email</span>
        )
      },
    },
    {
      id: "actions",
      header: "Edit",
      cell: ({ row }) => {
        const contact = row.original
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingContact(contact)
              setGeneratedEmail(null)
              setEmailPurpose("")
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Outreach</h1>
        <p className="text-muted-foreground">Find and connect with potential contacts</p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Contacts</CardTitle>
          <CardDescription>
            Search through your contact list by company or name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search company or contact (e.g., TechCorp)"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching || isContactsLoading}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isSearching && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-3 w-[200px]" />
                  </div>
                  <Skeleton className="h-9 w-[120px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {hasResults && !isSearching && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {searchResults.length} contact{searchResults.length === 1 ? "" : "s"} for &quot;{searchQuery}&quot;
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={searchResults} />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {hasSearched && !isSearching && !hasResults && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No matching contacts</h3>
            <p className="text-sm text-muted-foreground">Try refining your search terms.</p>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Outreach Messages</CardTitle>
          </div>
          <CardDescription>Saved outreach drafts generated for your contacts</CardDescription>
        </CardHeader>
        <CardContent>
          {isSuggestionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <Card key={item}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-2 h-3 w-40" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No outreach messages yet. Generate an email for a contact to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => {
                const isEditing = editingMessageId === suggestion._id
                return (
                  <Card key={suggestion._id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{suggestion.contactName}</CardTitle>
                          <CardDescription>{suggestion.company}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isEditing && (
                            <>
                              <Badge variant="outline" className="capitalize">
                                {suggestion.tone}
                              </Badge>
                              <Badge variant={suggestion.sent ? "default" : "secondary"}>
                                {suggestion.statusLabel}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Message</Label>
                            <Textarea
                              value={editingMessageText}
                              onChange={(e) => setEditingMessageText(e.target.value)}
                              rows={8}
                              className="font-mono text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tone</Label>
                            <Select
                              value={editingMessageTone}
                              onValueChange={(value: "professional" | "casual" | "friendly") =>
                                setEditingMessageTone(value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="friendly">Friendly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  await updateMessage({
                                    messageId: suggestion._id,
                                    message: editingMessageText,
                                    tone: editingMessageTone,
                                  })
                                  toast.success("Message updated", {
                                    description: "Your changes have been saved.",
                                  })
                                  setEditingMessageId(null)
                                } catch (error) {
                                  console.error("Error updating message:", error)
                                  toast.error("Failed to update message", {
                                    description: "Please try again.",
                                  })
                                }
                              }}
                            >
                              Save Changes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingMessageId(null)
                                setEditingMessageText("")
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                            {suggestion.message}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingMessageId(suggestion._id)
                                setEditingMessageText(suggestion.message)
                                setEditingMessageTone(suggestion.tone)
                              }}
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleCopyMessage(suggestion.message)}>
                              Copy Message
                            </Button>
                            <Button size="sm" onClick={() => handleMarkSent(suggestion)} disabled={suggestion.sent}>
                              <Mail className="mr-1 h-3 w-3" />
                              {suggestion.sent ? "Sent" : "Mark as Sent"}
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Outreach Email Dialog */}
      <Dialog
        open={!!editingContact}
        onOpenChange={(open) => {
          if (!open) {
            setEditingContact(null)
            setGeneratedEmail(null)
            setEmailPurpose("")
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Outreach Email</DialogTitle>
            <DialogDescription>
              {editingContact && `Create a personalized email for ${editingContact.name} at ${editingContact.company}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editingContact && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p className="text-sm font-medium">{editingContact.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Company</Label>
                    <p className="text-sm font-medium">{editingContact.company}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <p className="text-sm font-medium">{editingContact.role}</p>
                  </div>
                  {editingContact.primaryEmail && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm font-medium">{editingContact.primaryEmail}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purpose">Email Purpose</Label>
                <Textarea
                  id="purpose"
                  placeholder="e.g., Introduce our B2B SaaS platform that helps engineering teams..."
                  value={emailPurpose}
                  onChange={(e) => setEmailPurpose(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={emailTone} onValueChange={(value: "professional" | "casual" | "friendly") => setEmailTone(value)}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateEmail}
                disabled={isGeneratingEmail || !emailPurpose.trim()}
                className="w-full"
              >
                {isGeneratingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Outreach Email with AI
                  </>
                )}
              </Button>
            </div>

            {generatedEmail && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Generated Email</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Subject</Label>
                    <p className="text-sm font-medium">{generatedEmail.subject}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Message</Label>
                    <p className="text-sm whitespace-pre-line text-muted-foreground">{generatedEmail.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCopyEmail}>
                      <Mail className="mr-2 h-4 w-4" />
                      Copy Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

