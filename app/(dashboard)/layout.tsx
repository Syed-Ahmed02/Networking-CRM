import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppTopbar } from "@/components/app-topbar"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppTopbar />
        <main className="mt-16 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}


