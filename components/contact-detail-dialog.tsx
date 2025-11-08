'use client'

import { Mail, Phone, Linkedin, Edit, Trash2 } from "lucide-react"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type ContactWithDetails = Doc<"contacts"> & {
  primaryEmail?: string | null
  primaryPhone?: string | null
  emails?: Doc<"contactEmails">[]
  phones?: Doc<"contactPhones">[]
}

type ContactDetailDialogProps = {
  contact: ContactWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (contactId: Id<"contacts">) => void
  onDelete?: (contactId: Id<"contacts">) => void
}

export function ContactDetailDialog({
  contact,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ContactDetailDialogProps) {
  if (!contact) return null

  const handleEdit = () => {
    if (onEdit) {
      onEdit(contact._id)
      onOpenChange(false)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(contact._id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={contact.avatar || "/placeholder.svg?height=48&width=48"} />
              <AvatarFallback>
                {contact.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle>{contact.name}</DialogTitle>
              <DialogDescription>
                {contact.role} at {contact.company}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {contact.primaryEmail && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Email</p>
                <a
                  href={`mailto:${contact.primaryEmail}`}
                  className="text-sm text-primary hover:underline"
                >
                  {contact.primaryEmail}
                </a>
              </div>
            </div>
          )}

          {contact.primaryPhone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Phone</p>
                <a
                  href={`tel:${contact.primaryPhone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {contact.primaryPhone}
                </a>
              </div>
            </div>
          )}

          {contact.linkedinUrl && (
            <div className="flex items-center gap-3">
              <Linkedin className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">LinkedIn</p>
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View Profile
                </a>
              </div>
            </div>
          )}

          {!contact.primaryEmail && !contact.primaryPhone && !contact.linkedinUrl && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No contact information available
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          {onEdit && (
            <Button variant="outline" className="flex-1" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

