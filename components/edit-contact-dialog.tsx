'use client'

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { Loader2, Wand2, Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

type Stage = Doc<"contacts">["stage"]

type ContactWithDetails = Doc<"contacts"> & {
  primaryEmail?: string | null
  primaryPhone?: string | null
  emails?: Doc<"contactEmails">[]
  phones?: Doc<"contactPhones">[]
}

type EditContactDialogProps = {
  contact: ContactWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditContactDialog({
  contact,
  open,
  onOpenChange,
  onSuccess,
}: EditContactDialogProps) {
  const updateContact = useMutation(api.contacts.update)
  const deleteContact = useMutation(api.contacts.remove)
  const createMessage = useMutation(api.outreach.createMessage)
  
  // Fetch full contact details if we only have an ID
  const fullContact = useQuery(
    api.contacts.get,
    contact?._id ? { contactId: contact._id } : "skip"
  )
  
  // Use full contact if available, otherwise fall back to passed contact
  // If we're fetching and don't have the passed contact, show loading
  const isLoadingContact = contact?._id && !fullContact && !contact
  const contactData = fullContact || contact

  const [formState, setFormState] = useState({
    name: "",
    firstName: "",
    lastName: "",
    company: "",
    role: "",
    headline: "",
    stage: "lead" as Stage,
    notes: "",
    linkedinUrl: "",
    email: "",
    phone: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false)
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; message: string } | null>(null)
  const [emailPurpose, setEmailPurpose] = useState("")
  const [emailTone, setEmailTone] = useState<"professional" | "casual" | "friendly">("professional")
  const [showEmailGenerator, setShowEmailGenerator] = useState(false)

  useEffect(() => {
    if (contactData && open) {
      const primaryEmail = contactData.emails?.find((e) => e.isPrimary) ?? contactData.emails?.[0]
      const primaryPhone = contactData.phones?.find((p) => p.isPrimary) ?? contactData.phones?.[0]

      setFormState({
        name: contactData.name,
        firstName: contactData.firstName ?? "",
        lastName: contactData.lastName ?? "",
        company: contactData.company,
        role: contactData.role,
        headline: contactData.headline ?? "",
        stage: contactData.stage,
        notes: contactData.notes ?? "",
        linkedinUrl: contactData.linkedinUrl ?? "",
        email: primaryEmail?.email ?? "",
        phone: primaryPhone?.sanitizedNumber ?? primaryPhone?.rawNumber ?? "",
      })
      setGeneratedEmail(null)
      setEmailPurpose("")
      setShowEmailGenerator(false)
    }
  }, [contactData, open])

  const handleSubmit = async () => {
    if (!contactData) return

    if (!formState.name.trim() || !formState.company.trim() || !formState.role.trim()) {
      toast("Missing details", {
        description: "Name, company, and role are required.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await updateContact({
        contactId: contactData._id,
        name: formState.name.trim(),
        firstName: formState.firstName.trim() || undefined,
        lastName: formState.lastName.trim() || undefined,
        company: formState.company.trim(),
        role: formState.role.trim(),
        headline: formState.headline.trim() || undefined,
        stage: formState.stage,
        notes: formState.notes.trim() || undefined,
        linkedinUrl: formState.linkedinUrl.trim() || undefined,
      })

      toast("Contact updated", {
        description: `${formState.name.trim()} has been updated.`,
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast("Failed to update contact", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!contactData) return

    if (!confirm(`Are you sure you want to delete ${contactData.name}? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteContact({ contactId: contactData._id })
      toast("Contact deleted", {
        description: `${contactData.name} has been removed from your CRM.`,
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast("Failed to delete contact", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleGenerateEmail = async () => {
    if (!contactData) return

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
            name: contactData.name,
            firstName: contactData.firstName,
            company: contactData.company,
            role: contactData.role,
            headline: contactData.headline,
            linkedinUrl: contactData.linkedinUrl,
            location: contactData.location,
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
      try {
        await createMessage({
          contactId: contactData._id,
          contactName: contactData.name,
          company: contactData.company,
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
    } catch (error) {
      console.error("Error generating email:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate email", {
        description: "Please try again or check your connection.",
      })
    } finally {
      setIsGeneratingEmail(false)
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

  if (isLoadingContact) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Loading contact details...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!contactData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update contact information and generate outreach emails.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Form */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="John Doe"
                  value={formState.name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-company">Company *</Label>
                <Input
                  id="edit-company"
                  placeholder="Acme Inc"
                  value={formState.company}
                  onChange={(e) => setFormState((prev) => ({ ...prev, company: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role *</Label>
                <Input
                  id="edit-role"
                  placeholder="CEO"
                  value={formState.role}
                  onChange={(e) => setFormState((prev) => ({ ...prev, role: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-stage">Stage *</Label>
                <Select
                  value={formState.stage}
                  onValueChange={(value: Stage) => setFormState((prev) => ({ ...prev, stage: value }))}
                >
                  <SelectTrigger id="edit-stage">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-first-name">First Name</Label>
                <Input
                  id="edit-first-name"
                  placeholder="John"
                  value={formState.firstName}
                  onChange={(e) => setFormState((prev) => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-last-name">Last Name</Label>
                <Input
                  id="edit-last-name"
                  placeholder="Doe"
                  value={formState.lastName}
                  onChange={(e) => setFormState((prev) => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-headline">Headline</Label>
              <Input
                id="edit-headline"
                placeholder="Senior Software Engineer"
                value={formState.headline}
                onChange={(e) => setFormState((prev) => ({ ...prev, headline: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-linkedin">LinkedIn URL</Label>
              <Input
                id="edit-linkedin"
                placeholder="linkedin.com/in/johndoe"
                value={formState.linkedinUrl}
                onChange={(e) => setFormState((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Add any relevant notes..."
                value={formState.notes}
                onChange={(e) => setFormState((prev) => ({ ...prev, notes: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          {/* Email Generator Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Generate AI Email</h3>
                <p className="text-sm text-muted-foreground">
                  Create a personalized outreach email for this contact
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmailGenerator(!showEmailGenerator)}
              >
                {showEmailGenerator ? "Hide" : "Show"} Generator
              </Button>
            </div>

            {showEmailGenerator && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-purpose">Email Purpose</Label>
                  <Textarea
                    id="email-purpose"
                    placeholder="e.g., Introduce our B2B SaaS platform that helps engineering teams..."
                    value={emailPurpose}
                    onChange={(e) => setEmailPurpose(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-tone">Tone</Label>
                  <Select
                    value={emailTone}
                    onValueChange={(value: "professional" | "casual" | "friendly") => setEmailTone(value)}
                  >
                    <SelectTrigger id="email-tone">
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
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Contact"
            )}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

