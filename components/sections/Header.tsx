"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Coffee } from "lucide-react"
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs"

export function Header() {
  const { isSignedIn } = useUser()

  return (
    <header className="fixed top-0 w-full z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <SignInButton mode="modal" >
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal" >
                <Button>Get Started</Button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
