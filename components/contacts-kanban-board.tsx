'use client'

import type React from "react"
import { Loader2 } from "lucide-react"
import { ContactCard } from "@/components/contact-card"
import { Badge } from "@/components/ui/badge"
import type { Column, ContactsByStage } from "@/lib/contacts/types"
import type { Id } from "@/convex/_generated/dataModel"

type ContactsKanbanBoardProps = {
  columns: { id: Column; title: string; color: string }[]
  contactsByStage: ContactsByStage
  isLoading: boolean
  onDragOver: (event: React.DragEvent) => void
  onDrop: (columnId: Column) => void
  onDragStart: (contactId: Id<"contacts">) => void
  onContactClick: (contactId: Id<"contacts">) => void
  onContactEdit: (contactId: Id<"contacts">) => void
  onContactDelete: (contactId: Id<"contacts">) => void
}

export function ContactsKanbanBoard({
  columns,
  contactsByStage,
  isLoading,
  onDragOver,
  onDrop,
  onDragStart,
  onContactClick,
  onContactEdit,
  onContactDelete,
}: ContactsKanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card/60 p-4"
          onDragOver={onDragOver}
          onDrop={() => onDrop(column.id)}
        >
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
            <h3 className="font-semibold tracking-tight">{column.title}</h3>
            <Badge variant="secondary" className="ml-auto">
              {contactsByStage[column.id].length}
            </Badge>
          </div>

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
                <ContactCard
                  key={contact._id}
                  contact={contact}
                  draggable
                  onDragStart={() => onDragStart(contact._id)}
                  onClick={onContactClick}
                  onEdit={onContactEdit}
                  onDelete={onContactDelete}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

