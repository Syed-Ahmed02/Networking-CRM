import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import ConvexClientProvider from "@/components/ConvexClientProvider"
import { ClerkProvider } from "@clerk/nextjs"
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CoffeeAgent.AI - Your AI Networking Assistant",
  description: "AI-powered networking platform to research companies, find people, and build meaningful professional connections",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ClerkProvider
         
          >
            <ConvexClientProvider>
              {children}
            </ConvexClientProvider>
          </ClerkProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
