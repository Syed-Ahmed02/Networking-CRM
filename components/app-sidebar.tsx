"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { LayoutDashboard, Users, Send, Calendar, Settings, MessageSquare } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { SignOutButton } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { format } from "date-fns"

// Navigation menu items
const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Contacts",
    url: "/contacts",
    icon: Users,
  },
  {
    title: "Outreach",
    url: "/outreach",
    icon: Send,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const chatSessions = useQuery(api.chat.listChatSessions) ?? []

  // Get the first message from each chat session to use as a title
  const getChatSessionTitle = (session: any) => {
    if (!session?.messages || session.messages.length === 0) {
      return "New Chat"
    }
    const firstUserMessage = session.messages.find((msg: any) => msg.role === "user")
    if (firstUserMessage) {
      const content = firstUserMessage.content || firstUserMessage.parts?.find((p: any) => p.type === "text")?.text || ""
      return content.length > 30 ? content.substring(0, 30) + "..." : content || "New Chat"
    }
    return "New Chat"
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex h-16 items-center border-b px-6 justify-center text-2xl font-bold">
        NetworkCRM
      </SidebarHeader>
      <SidebarContent className="flex flex-col overflow-y-auto overflow-x-hidden">
        {/* Navigation Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url} className="min-w-0">
                      <item.icon />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Chat Sessions Section */}
        <SidebarGroup className="flex-1 overflow-hidden flex flex-col min-w-0">
          <SidebarGroupLabel>Chat Sessions</SidebarGroupLabel>
          <SidebarGroupContent className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
            <SidebarMenu className="min-w-0">
              {/* New Chat Button */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/chat" && !searchParams.get('sessionId')}
                >
                  <Link href="/chat" className="w-full min-w-0">
                    <MessageSquare className="size-4 shrink-0" />
                    <span className="truncate">New Chat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {chatSessions.length === 0 ? (
                <SidebarMenuItem>
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    No previous sessions
                  </div>
                </SidebarMenuItem>
              ) : (
                chatSessions.map((session) => (
                  <SidebarMenuItem key={session._id} className="min-w-0">
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/chat" && searchParams.get('sessionId') === session._id}
                      className="flex flex-col items-start gap-1 h-auto py-2 min-w-0 w-full"
                    >
                      <Link href={`/chat?sessionId=${session._id}`} className="w-full min-w-0">
                        <div className="flex items-center gap-2 w-full min-w-0">
                          <MessageSquare className="size-4 shrink-0" />
                          <span className="text-xs font-medium truncate flex-1 min-w-0">
                            {getChatSessionTitle(session)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-6 truncate block">
                          {format(new Date(session.updatedAt), "MMM d, yyyy")}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Footer with Settings and Sign Out */}
        <SidebarFooter className="min-w-0">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="min-w-0">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                    <Link href="/settings" className="min-w-0">
                      <Settings />
                      <span className="truncate">Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SignOutButton>
                    <SidebarMenuButton className="w-full cursor-pointer min-w-0">
                      <span className="truncate">Sign Out</span>
                    </SidebarMenuButton>
                  </SignOutButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  )
}
