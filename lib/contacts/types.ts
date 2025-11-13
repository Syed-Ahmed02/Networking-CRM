import type { Doc } from "@/convex/_generated/dataModel"

export type Stage = Doc<"contacts">["stage"]

export type ContactWithDetails = Doc<"contacts"> & {
  primaryEmail: string | null
  primaryPhone: string | null
  emails: Doc<"contactEmails">[]
  phones: Doc<"contactPhones">[]
}

export type Column = Stage

export type ContactsByStage = Record<Stage, ContactWithDetails[]>

