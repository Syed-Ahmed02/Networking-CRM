"use client"

import { useState } from "react"
import { Check, Upload, LinkIcon, CalendarIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function SettingsPage() {
  const [isApolloConnected, setIsApolloConnected] = useState(false)
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)

  const handleSaveProfile = () => {
    toast("Profile updated",{
      description: "Your profile settings have been saved successfully",
    })
  }

  const handleConnectApollo = () => {
    setIsApolloConnected(true)
    toast("Apollo connected",{
      description: "Your Apollo account has been connected successfully",
    })
  }

  const handleConnectGoogle = () => {
    setIsGoogleConnected(true)
    toast("Google Calendar connected",{
      description: "Your Google Calendar has been connected successfully",
    })
  }

  const handleImportCSV = () => {
    toast("Import started",{
      description: "Your CSV file is being processed",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and integrations</p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder.svg?height=80&width=80" />
                  <AvatarFallback className="text-2xl">JD</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Change Photo
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="John" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Doe" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="john@example.com" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" defaultValue="Sales Manager" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" defaultValue="Acme Inc" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" defaultValue="San Francisco, CA" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="linkedin">LinkedIn Profile</Label>
                  <Input id="linkedin" defaultValue="linkedin.com/in/johndoe" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          {/* Apollo Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <SearchIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Apollo.io</CardTitle>
                    <CardDescription>Search and enrich contact data from Apollo</CardDescription>
                  </div>
                </div>
                {isApolloConnected && (
                  <Badge variant="outline" className="gap-1">
                    <Check className="h-3 w-3" />
                    Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!isApolloConnected ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Connect your Apollo account to search for contacts and enrich your existing data with company
                    information, email addresses, and more.
                  </p>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="apollo-api-key">API Key</Label>
                      <Input id="apollo-api-key" type="password" placeholder="Enter your Apollo API key" />
                    </div>
                  </div>
                  <Button onClick={handleConnectApollo}>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Connect Apollo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-600">Apollo is connected and ready to use</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Test Connection</Button>
                    <Button variant="destructive" onClick={() => setIsApolloConnected(false)}>
                      Disconnect
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Google Calendar Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Google Calendar</CardTitle>
                    <CardDescription>Sync your meetings and events with Google Calendar</CardDescription>
                  </div>
                </div>
                {isGoogleConnected && (
                  <Badge variant="outline" className="gap-1">
                    <Check className="h-3 w-3" />
                    Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!isGoogleConnected ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Connect your Google Calendar to automatically sync your meetings, receive reminders, and manage your
                    schedule seamlessly.
                  </p>
                  <Button onClick={handleConnectGoogle}>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Connect Google Calendar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-600">Google Calendar is connected and syncing</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sync Settings</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Two-way sync (CRM ↔ Google Calendar)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Send meeting reminders</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Auto-create calendar events for new meetings</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Sync Now</Button>
                    <Button variant="destructive" onClick={() => setIsGoogleConnected(false)}>
                      Disconnect
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Data */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Contacts from CSV</CardTitle>
              <CardDescription>Upload a CSV file to bulk import your contacts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Upload CSV File</h3>
                <p className="mt-2 text-sm text-muted-foreground">Drag and drop your file here, or click to browse</p>
                <Button className="mt-4 bg-transparent" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
              </div>

              {/* CSV Format Guide */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Required CSV Format</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your CSV file should include the following columns:
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <code className="text-sm">name, company, role, email, phone, linkedin, location, notes</code>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Example:</p>
                  <div className="overflow-x-auto rounded-lg border bg-muted/50 p-4">
                    <code className="text-xs">
                      John Doe, Acme Inc, CEO, john@acme.com, +1-555-0100, linkedin.com/in/johndoe, San Francisco CA,
                      Met at conference
                    </code>
                  </div>
                </div>
              </div>

              {/* Import Options */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Import Options</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Skip duplicate contacts</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Update existing contacts with new data</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Send welcome email to new contacts</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Download Template</Button>
                <Button onClick={handleImportCSV}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Contacts
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import History */}
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>View your recent import activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">contacts_jan_2024.csv</p>
                    <p className="text-sm text-muted-foreground">Imported 150 contacts • January 20, 2024</p>
                  </div>
                  <Badge variant="outline">Success</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">leads_dec_2023.csv</p>
                    <p className="text-sm text-muted-foreground">Imported 89 contacts • December 15, 2023</p>
                  </div>
                  <Badge variant="outline">Success</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">conference_contacts.csv</p>
                    <p className="text-sm text-muted-foreground">Imported 45 contacts • November 28, 2023</p>
                  </div>
                  <Badge variant="outline">Success</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
