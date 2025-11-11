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
          <div className="mt-16 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1200px]">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </DashboardAuthBoundary>
  )
}


