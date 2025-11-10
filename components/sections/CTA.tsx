"use client"

import { BlurFade } from "../ui/blur-fade"
import { Button } from "../ui/button"
import { ArrowRight, Coffee } from "lucide-react"
import { SignUpButton } from "@clerk/nextjs"

export function CTA() {
  return (
    <section className="py-20 px-4 md:px-6">
      <div className="container mx-auto max-w-4xl">
        <BlurFade delay={0.1}>
          <div className="relative rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-12 md:p-16 text-center space-y-8 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
                <Coffee className="h-8 w-8 text-primary" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to transform your networking?
              </h2>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Join CoffeeAgent.AI today and start building meaningful professional relationships 
                with the power of AI at your side.
              </p>
              
              <SignUpButton mode="modal" >
                <Button size="lg" className="group">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </SignUpButton>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  )
}
