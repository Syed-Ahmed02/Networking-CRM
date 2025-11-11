"use client"

import { BlurFade } from "../ui/blur-fade"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Building2, Users, MessageSquare, Sparkles, Calendar, TrendingUp } from "lucide-react"

const features = [
  {
    icon: Building2,
    title: "Company Research",
    description: "Get comprehensive insights about any company instantly. Understand their business, culture, and key information to make informed connections.",
  },
  {
    icon: Users,
    title: "People Discovery",
    description: "Find the right people at target companies. Discover decision-makers, influencers, and key contacts with AI-powered search.",
  },
  {
    icon: MessageSquare,
    title: "Smart Outreach",
    description: "Craft personalized outreach messages that resonate. AI helps you create compelling emails that get responses.",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    description: "Your intelligent networking companion. Ask questions, get recommendations, and automate your networking workflow.",
  },
  {
    icon: Calendar,
    title: "Follow-up Management",
    description: "Never miss an opportunity. Track conversations, schedule follow-ups, and maintain meaningful relationships.",
  },
  {
    icon: TrendingUp,
    title: "Relationship Insights",
    description: "Understand your network better. Get recommendations on who to connect with and when to reach out.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-16 sm:py-20 px-4 md:px-6 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <BlurFade delay={0.1}>
          <div className="text-center space-y-4 mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-balance">
              Everything you need to build your network
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Powerful features designed to help you connect with the right people at the right time.
            </p>
          </div>
        </BlurFade>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <BlurFade key={feature.title} delay={0.1 + index * 0.1}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  )
}
