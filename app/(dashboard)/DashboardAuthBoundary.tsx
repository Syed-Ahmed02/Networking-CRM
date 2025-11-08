'use client'

import type { PropsWithChildren } from "react"
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react"
import { SignInButton } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"

export function DashboardAuthBoundary({ children }: PropsWithChildren) {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-[300px] w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-4 text-center">
          <div>
            <p className="text-lg font-semibold">Sign in required</p>
            <p className="text-sm text-muted-foreground">
              Please sign in with your Clerk account to view this workspace.
            </p>
          </div>
          <SignInButton mode="modal">Sign in</SignInButton>
        </div>
      </Unauthenticated>

      <Authenticated>{children}</Authenticated>
    </>
  )
}


