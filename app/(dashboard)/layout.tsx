import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppTopbar } from "@/components/app-topbar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { fetchMutation } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authState = await auth()
  if (!authState.userId) {
    redirect("/sign-in")
  }
  const token = await authState.getToken({ template: "convex" })
  

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


