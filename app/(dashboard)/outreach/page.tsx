"use client"

import { useState } from "react"
import { Search, Plus, Loader2, Sparkles, Mail, Linkedin, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
type SearchResult = {
  id: string
  name: string
  title: string
  company: string
  location: string
  email?: string
  linkedin?: string
  avatar?: string
}

type AISuggestion = {
  id: string
  contact: string
  company: string
  message: string
  tone: "professional" | "casual" | "friendly"
}

const mockSearchResults: SearchResult[] = [
  {
    id: "1",
    name: "Jennifer Smith",
    title: "VP of Sales",
    company: "Walmart",
    location: "Bentonville, AR",
    email: "jennifer.smith@walmart.com",
    linkedin: "linkedin.com/in/jennifersmith",
  },
  {
    id: "2",
    name: "Robert Johnson",
    title: "Director of Operations",
    company: "Walmart",
    location: "Dallas, TX",
    linkedin: "linkedin.com/in/robertjohnson",
  },
  {
    id: "3",
    name: "Maria Garcia",
    title: "Senior Buyer",
    company: "Walmart",
    location: "San Francisco, CA",
    email: "maria.garcia@walmart.com",
  },
  {
    id: "4",
    name: "David Lee",
    title: "Supply Chain Manager",
    company: "Walmart",
    location: "Chicago, IL",
    email: "david.lee@walmart.com",
    linkedin: "linkedin.com/in/davidlee",
  },
  {
    id: "5",
    name: "Sarah Williams",
    title: "Marketing Director",
    company: "Walmart",
    location: "New York, NY",
    linkedin: "linkedin.com/in/sarahwilliams",
  },
]

const mockAISuggestions: AISuggestion[] = [
  {
    id: "1",
    contact: "Jennifer Smith",
    company: "Walmart",
    tone: "professional",
    message:
      "Hi Jennifer, I noticed your impressive track record in retail sales leadership at Walmart. I'd love to connect and discuss how our solutions have helped similar organizations optimize their sales processes. Would you be open to a brief 15-minute call next week?",
  },
  {
    id: "2",
    contact: "Robert Johnson",
    company: "Walmart",
    tone: "professional",
    message:
      "Hello Robert, Your experience in operations management caught my attention. I believe our platform could significantly streamline your operational workflows. I'd appreciate the opportunity to share some relevant case studies. Are you available for a quick chat?",
  },
  {
    id: "3",
    contact: "Maria Garcia",
    company: "Walmart",
    tone: "friendly",
    message:
      "Hi Maria! I came across your profile and was impressed by your procurement expertise. I think you'd find our vendor management tools particularly valuable. Would you be interested in seeing a quick demo tailored to your needs?",
  },
]

export default function OutreachPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast("Search query required",{
        description: "Please enter a company name to search",
      })
      return
    }

    setIsSearching(true)
    setHasSearched(false)

    // Simulate API call
    setTimeout(() => {
      setSearchResults(mockSearchResults)
      setIsSearching(false)
      setHasSearched(true)
    }, 1500)
  }

  const handleAddToContacts = (result: SearchResult) => {
    toast("Contact added",{
      description: `${result.name} has been added to your contacts`,
    })
  }

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message)
    toast("Message copied",{
      description: "The outreach message has been copied to your clipboard",
    })
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
          <CardDescription>Search for professionals by company name (e.g., Walmart, Google, Microsoft)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search company (e.g., Walmart)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
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
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
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
      {hasSearched && !isSearching && searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {searchResults.length} professionals at {searchQuery}
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
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={result.avatar || "/placeholder.svg?height=40&width=40"} />
                          <AvatarFallback>
                            {result.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-muted-foreground">{result.company}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{result.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {result.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {result.email && (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        {result.linkedin && (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Linkedin className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleAddToContacts(result)}>
                        <Plus className="mr-1 h-3 w-3" />
                        Add to Contacts
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
      {hasSearched && !isSearching && searchResults.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No results found</h3>
            <p className="text-sm text-muted-foreground">Try searching for a different company name</p>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI-Powered Outreach Suggestions</CardTitle>
          </div>
          <CardDescription>Personalized message templates generated for your search results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAISuggestions.map((suggestion) => (
              <Card key={suggestion.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{suggestion.contact}</CardTitle>
                      <CardDescription>{suggestion.company}</CardDescription>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {suggestion.tone}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{suggestion.message}</p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleCopyMessage(suggestion.message)}>
                      Copy Message
                    </Button>
                    <Button size="sm">
                      <Mail className="mr-1 h-3 w-3" />
                      Send Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
