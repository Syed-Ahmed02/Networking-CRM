'use client'

import type React from "react"
import { Loader2, Mail, Phone, Linkedin } from "lucide-react"
import {
  ListGroup,
  ListHeader,
  ListItems,
  ListItem,
  ListProvider,
  type DragEndEvent,
} from "@/components/ui/list"
import { Badge } from "@/components/ui/badge"
import type { Column, ContactsByStage } from "@/lib/contacts/types"
import type { Id } from "@/convex/_generated/dataModel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

type ContactsListViewProps = {
  columns: { id: Column; title: string; color: string }[]
  contactsByStage: ContactsByStage
  isLoading: boolean
  onMoveContact: (payload: { contactId: Id<"contacts">; fromColumn: Column; toColumn: Column }) => Promise<void> | void
  onContactClick: (contactId: Id<"contacts">) => void
  onContactEdit: (contactId: Id<"contacts">) => void
  onContactDelete: (contactId: Id<"contacts">) => void
}

export function ContactsListView({
  columns,
  contactsByStage,
  isLoading,
  onMoveContact,
  onContactClick,
  onContactEdit,
  onContactDelete,
}: ContactsListViewProps) {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !active?.data?.current) {
      return
    }

    const fromColumn = active.data.current.parent as Column | undefined
    const toColumn = over.id as Column
    if (!fromColumn) return

    await onMoveContact({
      contactId: active.id as Id<"contacts">,
      fromColumn,
      toColumn,
    })
  }

  return (
    <ListProvider onDragEnd={handleDragEnd}>
      <div className="flex w-full gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const contacts = contactsByStage[column.id]
          const stageLabel = column.title
          const badgeClass = column.color.replace("bg-", "text-")

          return (
            <ListGroup
              key={column.id}
              id={column.id}
              className="min-w-[320px] max-w-[320px] flex-1 rounded-xl border border-border/60 bg-card/60 shadow-sm"
            >
              <ListHeader className="rounded-t-xl border-b border-border/40">
                <div className="flex w-full items-center gap-2 p-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
                  <p className="font-semibold tracking-tight">{stageLabel}</p>
                  <Badge variant="secondary" className="ml-auto">
                    {contacts.length}
                  </Badge>
                </div>
              </ListHeader>
              <ListItems className="space-y-2 p-3">
                {isLoading ? (
                  <div className="flex items-center justify-center rounded-lg border py-10 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading contacts...
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    No contacts in this stage yet.
                  </div>
                ) : (
                  contacts.map((contact, index) => (
                    <ListItem
                      key={contact._id}
                      id={contact._id}
                      name={contact.name}
                      index={index}
                      parent={column.id}
                      className="bg-background"
                    >
                      <div className="flex w-full flex-wrap items-start gap-4" onClick={() => onContactClick(contact._id)}>
                        <div className="flex min-w-[200px] flex-1 items-center gap-3">
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
                        <div className="flex flex-1 flex-col gap-1 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">{contact.company}</p>
                          <p className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {contact.primaryEmail ?? "No email recorded"}
                          </p>
                          {contact.linkedinUrl && (
                            <p className="flex items-center gap-2">
                              <Linkedin className="h-3 w-3" />
                              LinkedIn Profile
                            </p>
                          )}
                          {contact.primaryPhone && (
                            <p className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {contact.primaryPhone}
                            </p>
                          )}
                        </div>
                        <div className="ml-auto flex flex-col items-end gap-2">
                          <Badge variant="outline" className={badgeClass}>
                            {stageLabel}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            Last contacted:{" "}
                            {contact.lastContacted ? new Date(contact.lastContacted).toLocaleDateString() : "Never"}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation()
                                onContactEdit(contact._id)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation()
                                onContactDelete(contact._id)
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </ListItem>
                  ))
                )}
              </ListItems>
            </ListGroup>
          )
        })}
      </div>
    </ListProvider>
  )
}

