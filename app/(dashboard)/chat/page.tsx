'use client'

import { useChat } from '@ai-sdk/react'
import { useState, useRef, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Loader2, Building2, Users, Linkedin, Twitter, Facebook, Globe, Sparkles, Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DataTable } from '@/components/ui/data-table'
import { DashboardAuthBoundary } from '../DashboardAuthBoundary'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Id } from '@/convex/_generated/dataModel'

export default function ChatPage() {
  return (
    <DashboardAuthBoundary>
      <Suspense fallback={
        <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Loading chat...</p>
        </div>
      }>
        <ChatContent />
      </Suspense>
    </DashboardAuthBoundary>
  )
}

function ChatContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId') as Id<"chatHistory"> | null
  
  const [input, setInput] = useState('')
  const [currentSessionId, setCurrentSessionId] = useState<Id<"chatHistory"> | null>(sessionId)
  
  const chatSession = useQuery(
    api.chat.getChatSession,
    sessionId ? { sessionId } : "skip"
  )
  
  // Convert stored messages to useChat format
  const initialMessages = useMemo(() => {
    if (!chatSession?.messages || chatSession.messages.length === 0) return []
    
    return chatSession.messages.map((msg: any) => ({
      id: msg.id || `msg-${Math.random()}`,
      role: msg.role,
      content: msg.content || (msg.parts?.find((p: any) => p.type === 'text')?.text || ''),
      parts: msg.parts || (msg.content ? [{ type: 'text', text: msg.content }] : []),
    }))
  }, [chatSession])
  
  const { messages, sendMessage, status, setMessages } = useChat()
  
  // Track the last loaded session ID to avoid reloading the same session
  const lastLoadedSessionId = useRef<string | null>(null)
  
  // Update currentSessionId when sessionId from URL changes
  useEffect(() => {
    setCurrentSessionId(sessionId)
  }, [sessionId])
  
  // Load messages when session changes
  useEffect(() => {
    if (chatSession && initialMessages.length > 0) {
      // Only load if this is a different session
      if (lastLoadedSessionId.current !== chatSession._id) {
        setMessages(initialMessages)
        lastLoadedSessionId.current = chatSession._id
        setCurrentSessionId(chatSession._id)
      }
    } else if (!sessionId && lastLoadedSessionId.current !== null) {
      // Reset to empty if no session selected
      setMessages([])
      lastLoadedSessionId.current = null
      setCurrentSessionId(null)
    }
  }, [chatSession?._id, initialMessages, sessionId, setMessages])
  
  const saveChatHistory = useMutation(api.chat.saveChatHistory as any)

  const scrollRef = useRef<HTMLDivElement>(null)
  const isLoading = status === 'submitted' || status === 'streaming'

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Save chat history when conversation ends (user sends a new message or conversation completes)
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      // Extract tool results from messages
      const toolResults = messages
        .filter((msg) => msg.role === 'assistant')
        .flatMap((msg) =>
          msg.parts
            ?.filter((part: any) => part.type?.startsWith('tool-'))
            .map((part: any) => ({
              toolName: part.type?.replace('tool-', ''),
              state: part.state,
              output: part.output,
              error: part.errorText,
            })) || []
        )

      // Save chat history (debounced to avoid too many saves)
      const timeoutId = setTimeout(() => {
        saveChatHistory({
          messages: messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: (msg.parts?.find((p: any) => p.type === 'text') as any)?.text || '',
            parts: msg.parts,
          })),
          toolResults,
          sessionId: currentSessionId || undefined, // Use currentSessionId (from URL or newly created)
        }).then((newSessionId) => {
          // If we created a new session, track its ID for future saves
          if (!currentSessionId && newSessionId) {
            setCurrentSessionId(newSessionId as Id<"chatHistory">)
          }
        }).catch((error) => {
          console.error('Error saving chat history:', error)
        })
      }, 2000) // Debounce for 2 seconds

      return () => clearTimeout(timeoutId)
    }
  }, [messages, isLoading, saveChatHistory, currentSessionId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage({ text: input })
      setInput('')
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground">
          Research companies, find people, and get insights powered by AI
        </p>
      </div>

      {/* Chat Container */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Start a conversation</h3>
                <p className="text-sm text-muted-foreground">
                  Ask me to research a company or find people at an organization
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about companies or people..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}

function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className={isUser ? 'bg-secondary' : 'bg-primary text-primary-foreground'}>
          {isUser ? 'U' : 'AI'}
        </AvatarFallback>
      </Avatar>
      <div className={`flex-1 space-y-2 ${isUser ? 'flex flex-col items-end' : ''}`}>
        {/* Render message parts */}
        {message.parts?.map((part: any, index: number) => {
          // Text content
          if (part.type === 'text') {
            return (
              <div
                key={index}
                className={`rounded-lg px-4 py-2 ${
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{part.text}</p>
              </div>
            )
          }

          // Tool: researchCompany
          if (part.type === 'tool-researchCompany') {
            return <CompanyResearchTool key={index} part={part} />
          }

          // Tool: searchPeople
          if (part.type === 'tool-searchPeople') {
            return <PeopleSearchTool key={index} part={part} />
          }

          return null
        })}
      </div>
    </div>
  )
}

function CompanyResearchTool({ part }: { part: any }) {
  switch (part.state) {
    case 'input-available':
      return (
        <Card className="w-full">
          <CardContent className="flex items-center gap-2 p-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Researching company...
            </span>
          </CardContent>
        </Card>
      )
    case 'output-available':
      return <CompanyResearchResult result={part.output} />
    case 'output-error':
      return (
        <Card className="w-full border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              Error: {part.errorText || 'Something went wrong'}
            </p>
          </CardContent>
        </Card>
      )
    default:
      return null
  }
}

function PeopleSearchTool({ part }: { part: any }) {
  switch (part.state) {
    case 'input-available':
      return (
        <Card className="w-full">
          <CardContent className="flex items-center gap-2 p-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Finding people...
            </span>
          </CardContent>
        </Card>
      )
    case 'output-available':
      return <PeopleSearchResult result={part.output} />
    case 'output-error':
      return (
        <Card className="w-full border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              Error: {part.errorText || 'Something went wrong'}
            </p>
          </CardContent>
        </Card>
      )
    default:
      return null
  }
}

function CompanyResearchResult({ result }: { result: any }) {
  const { companyName, data } = result

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle>{companyName}</CardTitle>
        </div>
        <CardDescription>Company Research Results</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Domain */}
        {data.domain && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <a
              href={`https://${data.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {data.domain}
            </a>
          </div>
        )}

        {/* Social Media */}
        {data.socialMedia && data.socialMedia.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Social Media</h4>
            <div className="flex flex-wrap gap-2">
              {data.socialMedia.map((social: any, index: number) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
                >
                  {social.platform === 'linkedin' && <Linkedin className="h-3 w-3" />}
                  {social.platform === 'twitter' && <Twitter className="h-3 w-3" />}
                  {social.platform === 'facebook' && <Facebook className="h-3 w-3" />}
                  {social.platform === 'other' && <Globe className="h-3 w-3" />}
                  <span>{social.platform}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Company Info */}
        {data.companyInfo && data.companyInfo.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">About</h4>
            <div className="space-y-2">
              {data.companyInfo.slice(0, 2).map((info: any, index: number) => (
                <div key={index} className="rounded-md border p-3">
                  <a
                    href={info.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline"
                  >
                    {info.title}
                  </a>
                  {info.text && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                      {info.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type PersonData = {
  name: string
  title: string
  company: string
  linkedinUrl: string
  headline?: string
}

function PeopleSearchResult({ result }: { result: any }) {
  const { companyName, people, totalFound } = result
  const saveContact = useMutation(api.chat.saveContactFromChat as any)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  // Parse LinkedIn profile data to extract structured information
  const parsePersonData = (person: any): PersonData => {
    const title = person.title || ''
    const text = person.text || ''
    
    // Helper function to truncate text
    const truncate = (str: string, maxLength: number) => {
      if (!str || str.length <= maxLength) return str
      return str.substring(0, maxLength).trim() + '...'
    }
    
    // Extract name from title (usually first part before " - " or " | ")
    // Filter out article titles (they're usually too long and don't follow name patterns)
    let name = ''
    const nameMatch = title.match(/^([^-|]+)/)
    const potentialName = nameMatch ? nameMatch[1].trim() : title.split(' - ')[0]?.trim() || ''
    
    // Check if it looks like a person name (2-4 words, reasonable length)
    const nameWords = potentialName.split(/\s+/)
    if (nameWords.length >= 1 && nameWords.length <= 4 && potentialName.length <= 60) {
      name = potentialName
    } else {
      // Try to extract from text if title doesn't work
      const nameFromText = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/)?.[1]
      name = nameFromText && nameFromText.length <= 60 ? nameFromText : truncate(potentialName, 40)
    }
    
    if (!name || name === 'Unknown') {
      name = 'Unknown Person'
    }
    
    // Extract title/role (usually after " - " or " | ")
    const titleMatch = title.match(/[-|]\s*(.+)/)
    let role = ''
    if (titleMatch) {
      role = titleMatch[1].trim()
    } else {
      // Try to extract role from text
      const roleMatch = text.match(/(?:is|as|works as|position:)\s+([^.|,]+)/i)
      role = roleMatch ? roleMatch[1].trim() : ''
    }
    
    // Limit role length
    role = truncate(role || title, 50)
    
    // Extract company from text or use the search company name
    const companyMatch = text.match(/at\s+([^.|,]+)/i) || text.match(/@\s*([^.|,]+)/i)
    let company = companyMatch?.[1]?.trim() || companyName || ''
    company = truncate(company, 40)
    
    return {
      name: truncate(name, 40),
      title: role,
      company,
      linkedinUrl: person.url || '',
      headline: text,
    }
  }

  const handleSave = async (person: PersonData, index: number) => {
    const personId = `${person.linkedinUrl}-${index}`
    
    if (savedIds.has(personId)) {
      toast.info('Contact already saved')
      return
    }

    setSavingIds((prev) => new Set(prev).add(personId))

    try {
      // Split name into first and last name
      const nameParts = person.name.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || undefined

      await saveContact({
        name: person.name,
        firstName,
        lastName,
        company: person.company,
        role: person.title,
        linkedinUrl: person.linkedinUrl,
        headline: person.headline,
      })

      setSavedIds((prev) => new Set(prev).add(personId))
      toast.success('Contact saved successfully', {
        description: `${person.name} has been added to your contacts.`,
      })
    } catch (error) {
      console.error('Error saving contact:', error)
      toast.error('Failed to save contact', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev)
        next.delete(personId)
        return next
      })
    }
  }

  const columns: ColumnDef<PersonData>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      size: 200,
      cell: ({ row }) => {
        const person = row.original
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Linkedin className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium truncate" title={person.name}>
              {person.name}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'title',
      header: 'Title',
      size: 200,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate block" title={row.original.title}>
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: 'company',
      header: 'Company',
      size: 150,
      cell: ({ row }) => (
        <span className="text-sm truncate block" title={row.original.company}>
          {row.original.company}
        </span>
      ),
    },
    {
      accessorKey: 'linkedinUrl',
      header: 'LinkedIn',
      size: 80,
      cell: ({ row }) => {
        const url = row.original.linkedinUrl
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex"
          >
            <Linkedin className="h-4 w-4" />
          </a>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 120,
      cell: ({ row }) => {
        const person = row.original
        const personId = `${person.linkedinUrl}-${row.index}`
        const isSaving = savingIds.has(personId)
        const isSaved = savedIds.has(personId)

        return (
          <Button
            size="sm"
            variant={isSaved ? 'outline' : 'default'}
            onClick={() => handleSave(person, row.index)}
            disabled={isSaving || isSaved}
            className="shrink-0"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <Check className="mr-2 h-3 w-3" />
                Saved
              </>
            ) : (
              <>
                <Save className="mr-2 h-3 w-3" />
                Save
              </>
            )}
          </Button>
        )
      },
    },
  ]

  if (!people || people.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>People at {companyName}</CardTitle>
          </div>
          <CardDescription>No people found</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const tableData: PersonData[] = people.map(parsePersonData)

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle>People at {companyName}</CardTitle>
        </div>
        <CardDescription>
          Found {totalFound} {totalFound === 1 ? 'person' : 'people'}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="w-full overflow-hidden">
          <DataTable columns={columns} data={tableData} />
        </div>
      </CardContent>
    </Card>
  )
}

