"use client"

import { Search, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserButton } from "@clerk/nextjs"
export function AppTopbar() {
  const { theme, setTheme } = useTheme()
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <SidebarTrigger className="shrink-0 rounded-full border border-border/70 bg-background/80 shadow-sm hover:bg-muted" />
          <div className="hidden md:block h-6 w-px bg-border/80" aria-hidden="true" />
          <div className="relative hidden sm:flex flex-1 min-w-0 md:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search contacts, companies..."
              className="h-10 w-full rounded-full border border-border/70 bg-background/80 pl-9 shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-transparent hover:border-border/80"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden rounded-full border border-transparent hover:border-border/80">
                <Search className="h-5 w-5" />
                <span className="sr-only">Open search</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Quick search</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search contacts, companies..."
                  className="pl-9"
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <UserButton />
        </div>
      </div>
    </header>
  )
}
