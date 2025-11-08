import type React from "react"
import { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppTopbar } from "@/components/app-topbar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardAuthBoundary } from "./DashboardAuthBoundary"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Loader2 } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardAuthBoundary>
      <SidebarProvider>
        <Suspense
          fallback={
            <Sidebar>
              <SidebarHeader className="flex h-16 items-center border-b px-6 justify-center text-2xl font-bold">
                CoffeeAgent.AI
              </SidebarHeader>
              <SidebarContent>
                <SidebarMenuItem>
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                </SidebarMenuItem>
              </SidebarContent>
            </Sidebar>
          }
        >
          <AppSidebar />
        </Suspense>
        <SidebarInset>
          <AppTopbar />
          <main className="mt-16 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardAuthBoundary>
  )
}


