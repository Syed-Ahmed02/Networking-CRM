'use client'

import { Mail, Linkedin, Phone, MoreVertical } from "lucide-react"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

type ContactWithDetails = Doc<"contacts"> & {
  primaryEmail?: string | null
  primaryPhone?: string | null
  emails?: Doc<"contactEmails">[]
  phones?: Doc<"contactPhones">[]
}

type ContactCardProps = {
  contact: ContactWithDetails
  onEdit?: (contactId: Id<"contacts">) => void
  onDelete?: (contactId: Id<"contacts">) => void
  draggable?: boolean
  onDragStart?: (contactId: Id<"contacts">) => void
  onClick?: (contactId: Id<"contacts">) => void
}

export function ContactCard({
  contact,
  onEdit,
  onDelete,
  draggable = false,
  onDragStart,
  onClick,
}: ContactCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (draggable && onDragStart) {
      onDragStart(contact._id)
      e.dataTransfer.effectAllowed = "move"
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick(contact._id)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(contact._id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(contact._id)
    }
  }

  return (
    <Card
      draggable={draggable}
      onDragStart={handleDragStart}
      className={`w-full transition-shadow hover:shadow-lg ${onClick ? "cursor-pointer" : ""} ${draggable ? "cursor-move" : ""}`}
      onClick={handleClick}
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
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
  )
}

