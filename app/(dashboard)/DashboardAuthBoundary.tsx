'use client'

import type { PropsWithChildren } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useStoreUserEffect } from "@/hooks/use-store-user"

export function DashboardAuthBoundary({ children }: PropsWithChildren) {
  const { isLoading, isAuthenticated } = useStoreUserEffect()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/sign-in')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}


