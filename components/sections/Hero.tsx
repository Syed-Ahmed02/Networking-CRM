"use client"

import { BlurFade } from "../ui/blur-fade"
import { Button } from "../ui/button"
import { HeroVideoDialog } from "../ui/hero-video-dialog"
import { Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { SignUpButton } from "@clerk/nextjs"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 md:px-6 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center space-y-8">
          <BlurFade delay={0.1}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-card/50 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered Networking Assistant</span>
            </div>
          </BlurFade>

          <BlurFade delay={0.2}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Your AI Agent for
              <br />
              <span className="text-primary">Professional Networking</span>
            </h1>
          </BlurFade>

          <BlurFade delay={0.3}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              Build meaningful connections effortlessly. Research companies, find the right people, 
              and craft personalized outreach—all powered by AI. Your networking companion, 
              always ready to help.
            </p>
          </BlurFade>

          <BlurFade delay={0.4}>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <SignUpButton mode="modal">
                <Button size="lg" className="group">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </SignUpButton>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">View Demo</Link>
              </Button>
            </div>
          </BlurFade>

          <BlurFade delay={0.5}>
            <div className="mt-12 w-full max-w-6xl">
              <div className="flex flex-col items-center justify-center mx-4 lg:mx-auto">
                <HeroVideoDialog
                  className="dark:hidden block"
                  animationStyle="from-center"
                  videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
                  thumbnailSrc="https://startup-template-sage.vercel.app/hero-light.png"
                  thumbnailAlt="CoffeeAgent.AI Demo Video"
                />
                <HeroVideoDialog
                  className="hidden dark:block"
                  animationStyle="from-center"
                  videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
                  thumbnailSrc="https://startup-template-sage.vercel.app/hero-dark.png"
                  thumbnailAlt="CoffeeAgent.AI Demo Video"
                />
              </div>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  )
}