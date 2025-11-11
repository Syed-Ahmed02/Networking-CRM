"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Coffee, Menu } from "lucide-react"
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader as SheetContentHeader,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Header() {
  const { isSignedIn } = useUser()

  return (
    <header className="fixed top-0 w-full z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">CoffeeAgent.AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
            How It Works
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {isSignedIn ? (
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Get Started</Button>
              </SignUpButton>
            </>
          )}
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border border-border/60 text-foreground shadow-sm"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0">
              <div className="flex h-full flex-col">
                <SheetContentHeader className="flex items-center justify-between border-b px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">CoffeeAgent.AI</span>
                  </div>
                </SheetContentHeader>
                <nav className="flex flex-1 flex-col gap-3 px-6 py-6 text-base font-medium">
                  <SheetClose asChild>
                    <Link href="#features" className="rounded-md px-3 py-2 hover:bg-muted">
                      Features
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="#how-it-works" className="rounded-md px-3 py-2 hover:bg-muted">
                      How It Works
                    </Link>
                  </SheetClose>
                </nav>
                <div className="flex flex-col gap-3 border-t px-6 py-6">
                  {isSignedIn ? (
                    <SheetClose asChild>
                      <Button asChild size="lg" className="w-full">
                        <Link href="/dashboard">Go to Dashboard</Link>
                      </Button>
                    </SheetClose>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <SignInButton mode="modal">
                          <Button variant="outline" size="lg" className="w-full">
                            Sign In
                          </Button>
                        </SignInButton>
                      </SheetClose>
                      <SheetClose asChild>
                        <SignUpButton mode="modal">
                          <Button size="lg" className="w-full">
                            Get Started
                          </Button>
                        </SignUpButton>
                      </SheetClose>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
