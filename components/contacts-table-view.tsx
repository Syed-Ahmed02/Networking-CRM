'use client'

import React from "react"
import { useMemo, useState, useEffect } from "react"
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { ColumnDef, Table as TanStackTable, Column } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ContactWithDetails } from "@/lib/contacts/types"
import type { Id } from "@/convex/_generated/dataModel"

type ContactsTableViewProps = {
  contacts: ContactWithDetails[]
  isLoading: boolean
  onContactClick: (contactId: Id<"contacts">) => void
  onContactEdit: (contactId: Id<"contacts">) => void
  onContactDelete: (contactId: Id<"contacts">) => void
}

function SortableHeader<TData>({ 
  column, 
  title,
  updateKey 
}: { 
  column: Column<TData>
  title: string
  updateKey?: number
}) {
  const sorted = column.getIsSorted()
  
  // Re-read sort state when updateKey changes to ensure icons update
  React.useEffect(() => {
    // This effect ensures the component re-renders when updateKey changes
  }, [updateKey, sorted])
  
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-auto p-0 font-semibold hover:bg-transparent"
    >
      {title}
      <span className="ml-2">
        {sorted === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : sorted === "desc" ? (
          <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </span>
    </Button>
  )
}

export function ContactsTableView({
  contacts,
  isLoading,
  onContactClick,
  onContactEdit,
  onContactDelete,
}: ContactsTableViewProps) {
  const [table, setTable] = useState<TanStackTable<ContactWithDetails> | null>(null)
  const [globalFilter, setGlobalFilter] = useState("")
  const [updateTrigger, setUpdateTrigger] = useState(0)

  const columns = useMemo<ColumnDef<ContactWithDetails>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Name" updateKey={updateTrigger} />,
        size: 200,
        cell: ({ row }) => {
          const contact = row.original
          return (
            <div className="flex flex-col min-w-[180px]">
              <button
                className="text-left font-semibold text-primary hover:underline"
                onClick={() => onContactClick(contact._id)}
              >
                {contact.name}
              </button>
              <span className="text-xs text-muted-foreground">{contact.role}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "company",
        header: ({ column }) => <SortableHeader column={column} title="Company" updateKey={updateTrigger} />,
        size: 150,
        cell: ({ row }) => (
          <div className="min-w-[130px]">
            {row.original.company}
          </div>
        ),
      },
      {
        accessorKey: "stage",
        header: ({ column }) => <SortableHeader column={column} title="Stage" updateKey={updateTrigger} />,
        size: 120,
        cell: ({ row }) => {
          const contact = row.original
          const stageLabel = contact.stage.charAt(0).toUpperCase() + contact.stage.slice(1)
          return <Badge variant="outline">{stageLabel}</Badge>
        },
      },
      {
        accessorKey: "primaryEmail",
        header: ({ column }) => <SortableHeader column={column} title="Email" updateKey={updateTrigger} />,
        size: 200,
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            {row.original.primaryEmail ?? "—"}
          </div>
        ),
      },
      {
        accessorKey: "primaryPhone",
        header: ({ column }) => <SortableHeader column={column} title="Phone" updateKey={updateTrigger} />,
        size: 150,
        cell: ({ row }) => (
          <div className="min-w-[130px]">
            {row.original.primaryPhone ?? "—"}
          </div>
        ),
      },
      {
        id: "lastContacted",
        accessorFn: (row) => row.lastContacted ? new Date(row.lastContacted).getTime() : 0,
        header: ({ column }) => <SortableHeader column={column} title="Last Contacted" updateKey={updateTrigger} />,
        size: 140,
        cell: ({ row }) => {
          const value = row.original.lastContacted
          return (
            <div className="min-w-[120px]">
              {value ? new Date(value).toLocaleDateString() : "Never"}
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Edit",
        size: 100,
        cell: ({ row }) => {
          const contact = row.original
          return (
            <div className="flex items-center gap-2 ">
             
              <Button size="sm" onClick={() => onContactEdit(contact._id)}>
                Edit
              </Button>

            </div>
          )
        },
      },
    ]
  }, [onContactClick, onContactEdit, onContactDelete, updateTrigger])

  // Custom filter function to search across multiple fields
  const globalFilterFn = useMemo(() => {
    return (row: any, columnId: string, filterValue: string) => {
      const search = filterValue.toLowerCase()
      const contact = row.original as ContactWithDetails
      
      return (
        contact.name?.toLowerCase().includes(search) ||
        contact.company?.toLowerCase().includes(search) ||
        contact.role?.toLowerCase().includes(search) ||
        contact.primaryEmail?.toLowerCase().includes(search) ||
        contact.primaryPhone?.toLowerCase().includes(search) ||
        false
      )
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border py-10 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading contacts...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search contacts..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        {table && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => {
                        column.toggleVisibility(!!value)
                        // Force re-render to update sort icons when visibility changes
                        setUpdateTrigger((prev) => prev + 1)
                      }}
                    >
                      {column.id === "primaryEmail"
                        ? "Email"
                        : column.id === "primaryPhone"
                        ? "Phone"
                        : column.id === "lastContacted"
                        ? "Last Contacted"
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <DataTable
        columns={columns}
        data={contacts}
        globalFilter={globalFilter}
        globalFilterFn={globalFilterFn}
        onTableReady={(tableInstance) => {
          setTable(tableInstance)
        }}
      />
    </div>
  )
}

