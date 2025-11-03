import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bell, TrendingUp, Users, Calendar } from "lucide-react"

const recommendations = [
  {
    id: 1,
    contact: "Sarah Johnson",
    company: "TechCorp",
    action: "Follow up on proposal discussion",
    priority: "high",
    daysAgo: 3,
  },
  {
    id: 2,
    contact: "Michael Chen",
    company: "StartupXYZ",
    action: "Schedule demo call",
    priority: "medium",
    daysAgo: 5,
  },
  {
    id: 3,
    contact: "Emily Rodriguez",
    company: "Enterprise Inc",
    action: "Send quarterly report",
    priority: "low",
    daysAgo: 7,
  },
]

const recentActivity = [
  {
    id: 1,
    contact: "David Park",
    company: "Innovation Labs",
    action: "Meeting completed",
    time: "2 hours ago",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 2,
    contact: "Lisa Wang",
    company: "Global Solutions",
    action: "Email sent",
    time: "5 hours ago",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 3,
    contact: "James Miller",
    company: "Tech Ventures",
    action: "Contact added",
    time: "1 day ago",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

const stats = [
  {
    title: "Total Contacts",
    value: "248",
    change: "+12%",
    icon: Users,
  },
  {
    title: "Meetings This Week",
    value: "12",
    change: "+3",
    icon: Calendar,
  },
  {
    title: "Response Rate",
    value: "68%",
    change: "+5%",
    icon: TrendingUp,
  },
  {
    title: "Pending Follow-ups",
    value: "8",
    change: "-2",
    icon: Bell,
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your networking overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Follow-up Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Recommendations</CardTitle>
            <CardDescription>AI-powered suggestions for your next actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="flex items-start gap-4 rounded-lg border p-4">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg?height=40&width=40" />
                    <AvatarFallback>
                      {rec.contact
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{rec.contact}</p>
                      <Badge
                        variant={
                          rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "default" : "secondary"
                        }
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.company}</p>
                    <p className="text-sm">{rec.action}</p>
                    <p className="text-xs text-muted-foreground">Last contact: {rec.daysAgo} days ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={activity.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {activity.contact
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{activity.contact}</p>
                    <p className="text-sm text-muted-foreground">{activity.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
