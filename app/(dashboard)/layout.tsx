import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppTopbar } from "@/components/app-topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <AppSidebar />
      <AppTopbar />
      <main className="ml-64 mt-16 p-6">{children}</main>
    </div>
  )
}
