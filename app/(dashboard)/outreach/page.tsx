"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { Search, Plus, Loader2, Sparkles, Mail, Linkedin, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

type ContactDoc = Doc<"contacts"> & {
  primaryEmail?: string | null
  primaryPhone?: string | null
}

type OutreachMessageDoc = Doc<"outreachMessages">

export default function OutreachPage() {
  const contacts = useQuery(api.contacts.list, { stage: undefined }) as ContactDoc[] | undefined
  const outreachMessages = useQuery(api.outreach.listMessages, { sent: undefined, contactId: undefined })
  const outreachSearches = useQuery(api.outreach.listSearches, {})

  const createSearch = useMutation(api.outreach.createSearch)
  const markMessageSent = useMutation(api.outreach.markMessageSent)

  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchResults, setSearchResults] = useState<ContactDoc[]>([])

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Stage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((contact) => (
                  <TableRow key={contact._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={contact.avatar || "/placeholder.svg?height=40&width=40"} />
                          <AvatarFallback>
                            {contact.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">{contact.company}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{contact.role}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {getLocationDisplay(contact)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {contact.primaryEmail && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toast("Email copied", { description: contact.primaryEmail! })}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        {contact.linkedinUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <a href={contact.linkedinUrl} target="_blank" rel="noreferrer">
                              <Linkedin className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handleAddToContacts(contact)}>
                        <Plus className="mr-1 h-3 w-3" />
                        Add to Sequence
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

      {/* Outreach History */}
      {outreachSearches && outreachSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Searches</CardTitle>
            <CardDescription>Your latest outreach lookups</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {outreachSearches.slice(0, 6).map((search) => (
              <div key={search._id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{search.query}</span>
                  <Badge variant="outline">{search.resultsCount} results</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(search.searchedAt).toLocaleString()}
                </p>
              </div>
            ))}
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
              No outreach drafts yet. Run a search to generate suggestions.
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion._id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{suggestion.contactName}</CardTitle>
                        <CardDescription>{suggestion.company}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {suggestion.tone}
                        </Badge>
                        <Badge variant={suggestion.sent ? "default" : "secondary"}>
                          {suggestion.statusLabel}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{suggestion.message}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleCopyMessage(suggestion.message)}>
                        Copy Message
                      </Button>
                      <Button size="sm" onClick={() => handleMarkSent(suggestion)} disabled={suggestion.sent}>
                        <Mail className="mr-1 h-3 w-3" />
                        {suggestion.sent ? "Sent" : "Mark as Sent"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

