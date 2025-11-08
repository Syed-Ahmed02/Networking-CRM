import { Hero } from "@/components/sections/Hero"
import { Features } from "@/components/sections/Features"
import { CTA } from "@/components/sections/CTA"
import { Header } from "@/components/sections/Header"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <CTA />
    </div>
  )
}