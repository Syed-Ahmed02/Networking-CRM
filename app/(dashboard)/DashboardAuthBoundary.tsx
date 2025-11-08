'use client'

import type { PropsWithChildren } from "react"
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useConvexAuth } from "convex/react"
import { Loader2 } from "lucide-react"

export function DashboardAuthBoundary({ children }: PropsWithChildren) {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/sign-in')
    }
  }, [isLoading, isAuthenticated, router])

  return (
    <>
      <AuthLoading>
        <div className="flex min-h-[300px] w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="flex min-h-[300px] w-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Unauthenticated>

      <Authenticated>{children}</Authenticated>
    </>
  )
}


