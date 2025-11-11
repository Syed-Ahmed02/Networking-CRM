'use client'

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { Check, Upload, LinkIcon, CalendarIcon, SearchIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { DashboardAuthBoundary } from "../DashboardAuthBoundary"

type UserDoc = Doc<"users">
type IntegrationDoc = Doc<"integrations">
type ImportHistoryDoc = Doc<"importHistory">

const emptyProfile = {
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  company: "",
  location: "",
  phone: "",
  linkedin: "",
}

export default function SettingsPage() {
  return (
    <DashboardAuthBoundary>
      <SettingsContent />
    </DashboardAuthBoundary>
  )
}

function SettingsContent() {
  const user = useQuery(api.users.getCurrent, {}) as UserDoc | null | undefined
  const integrations = useQuery(api.integrations.list, {}) as IntegrationDoc[] | undefined
  const importHistory = useQuery(api.importHistory.list, {}) as ImportHistoryDoc[] | undefined

  const updateUser = useMutation(api.users.update)
  const upsertIntegration = useMutation(api.integrations.upsert)
  const disconnectIntegration = useMutation(api.integrations.disconnect)
  const createImportHistory = useMutation(api.importHistory.create)

  const [profileForm, setProfileForm] = useState(emptyProfile)
  const [apolloKey, setApolloKey] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isConnectingApollo, setIsConnectingApollo] = useState(false)
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        role: user.role ?? "",
        company: user.company ?? "",
        location: user.location ?? "",
        phone: user.phone ?? "",
        linkedin: user.linkedin ?? "",
      })
    } else if (user === null) {
      setProfileForm(emptyProfile)
    }
  }, [user])

  const apolloIntegration = useMemo(
    () => integrations?.find((integration) => integration.type === "apollo"),
    [integrations],
  )
  const googleIntegration = useMemo(
    () => integrations?.find((integration) => integration.type === "google_calendar"),
    [integrations],
  )

  const importHistorySorted = useMemo(() => {
    if (!importHistory) return []
    return [...importHistory].sort((a, b) => b.importedAt - a.importedAt)
  }, [importHistory])

  const isProfileLoading = user === undefined
  const isIntegrationLoading = integrations === undefined

  const handleSaveProfile = async () => {
    if (isProfileLoading) return

    setIsSavingProfile(true)

    try {
      await updateUser({
        firstName: profileForm.firstName.trim() || undefined,
        lastName: profileForm.lastName.trim() || undefined,
        email: profileForm.email.trim() || undefined,
        role: profileForm.role.trim() || undefined,
        company: profileForm.company.trim() || undefined,
        location: profileForm.location.trim() || undefined,
        phone: profileForm.phone.trim() || undefined,
        linkedin: profileForm.linkedin.trim() || undefined,
      })

      toast("Profile updated", {
        description: "Your profile information has been saved successfully.",
      })
    } catch (error) {
      console.error(error)
      toast("Unable to update profile", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleConnectApollo = async () => {
    setIsConnectingApollo(true)
    try {
      await upsertIntegration({
        type: "apollo",
        apiKey: apolloKey.trim() || undefined,
      })
      toast("Apollo connected", {
        description: "Your Apollo integration is now active.",
      })
    } catch (error) {
      console.error(error)
      toast("Unable to connect Apollo", {
        description: error instanceof Error ? error.message : "Please verify your API key and try again.",
      })
    } finally {
      setIsConnectingApollo(false)
    }
  }

  const handleDisconnectApollo = async () => {
    if (!apolloIntegration) return
    try {
      await disconnectIntegration({ integrationId: apolloIntegration._id })
      toast("Apollo disconnected", {
        description: "The integration has been disabled.",
      })
    } catch (error) {
      console.error(error)
      toast("Unable to disconnect Apollo", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    }
  }

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true)
    try {
      await upsertIntegration({
        type: "google_calendar",
      })
      toast("Google Calendar connected", {
        description: "Meetings will sync with Google Calendar.",
      })
    } catch (error) {
      console.error(error)
      toast("Unable to connect Google Calendar", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsConnectingGoogle(false)
    }
  }

  const handleDisconnectGoogle = async () => {
    if (!googleIntegration) return
    try {
      await disconnectIntegration({ integrationId: googleIntegration._id })
      toast("Google Calendar disconnected", {
        description: "The integration has been disabled.",
      })
    } catch (error) {
      console.error(error)
      toast("Unable to disconnect Google Calendar", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    }
  }

  const handleImportCSV = async () => {
    setIsImporting(true)
    try {
      await createImportHistory({
        fileName: "manual_import.csv",
        contactsImported: Math.floor(Math.random() * 20) + 5,
        status: "success",
      })
      toast("Import logged", {
        description: "The import record has been created.",
      })
    } catch (error) {
      console.error(error)
      toast("Unable to log import", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold leading-tight">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage your account and integrations</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="profile" className="flex-1 sm:flex-none">
            Profile
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex-1 sm:flex-none">
            Integrations
          </TabsTrigger>
          <TabsTrigger value="import" className="flex-1 sm:flex-none">
            Import Data
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatar || "/placeholder.svg?height=80&width=80"} />
                  <AvatarFallback className="text-2xl">
                    {(user?.firstName || "U")[0]}
                    {(user?.lastName || "S")[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">
                  Avatar is synced from your authentication provider.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileForm.firstName}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, firstName: event.target.value }))}
                      disabled={isProfileLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileForm.lastName}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, lastName: event.target.value }))}
                      disabled={isProfileLoading}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                    disabled={isProfileLoading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={profileForm.role}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, role: event.target.value }))}
                    disabled={isProfileLoading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profileForm.company}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, company: event.target.value }))}
                    disabled={isProfileLoading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profileForm.location}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, location: event.target.value }))}
                    disabled={isProfileLoading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                    disabled={isProfileLoading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="linkedin">LinkedIn Profile</Label>
                  <Input
                    id="linkedin"
                    value={profileForm.linkedin}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, linkedin: event.target.value }))}
                    disabled={isProfileLoading}
                  />
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile || isProfileLoading}
                  className="w-full sm:w-auto"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <SearchIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Apollo.io</CardTitle>
                    <CardDescription>Search and enrich contact data from Apollo</CardDescription>
                  </div>
                </div>
                {apolloIntegration?.connected && (
                  <Badge variant="outline" className="gap-1">
                    <Check className="h-3 w-3" />
                    Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {apolloIntegration?.connected ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-600">
                    Apollo is connected and ready to use.
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={handleDisconnectApollo} className="w-full sm:w-auto">
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Connect your Apollo account to search for contacts and enrich your existing data.
                  </p>
                  <div className="grid gap-2">
                    <Label htmlFor="apollo-api-key">API Key</Label>
                    <Input
                      id="apollo-api-key"
                      type="password"
                      placeholder="Enter your Apollo API key"
                      value={apolloKey}
                      onChange={(event) => setApolloKey(event.target.value)}
                      disabled={isIntegrationLoading}
                    />
                  </div>
                  <Button
                    onClick={handleConnectApollo}
                    disabled={isConnectingApollo || isIntegrationLoading}
                    className="w-full sm:w-auto"
                  >
                    {isConnectingApollo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Connect Apollo
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Google Calendar</CardTitle>
                    <CardDescription>Sync your meetings and calls with Google Calendar</CardDescription>
                  </div>
                </div>
                {googleIntegration?.connected && (
                  <Badge variant="outline" className="gap-1">
                    <Check className="h-3 w-3" />
                    Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {googleIntegration?.connected ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-600">
                    Google Calendar is connected and syncing meetings.
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={handleDisconnectGoogle} className="w-full sm:w-auto">
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Connect Google Calendar to sync CRM meetings and stay aligned with your schedule.
                  </p>
                  <Button
                    onClick={handleConnectGoogle}
                    disabled={isConnectingGoogle || isIntegrationLoading}
                    className="w-full sm:w-auto"
                  >
                    {isConnectingGoogle ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Connect Google Calendar
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Data */}
        <TabsContent value="import" className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Import Contacts from CSV</CardTitle>
              <CardDescription>Upload a CSV file to log contact imports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Upload CSV File</h3>
                <p className="mt-2 text-sm text-muted-foreground">Simulate an import by logging a CSV file.</p>
                <Button
                  className="mt-4 bg-transparent"
                  variant="outline"
                  onClick={handleImportCSV}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Log Import
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium">Expected CSV columns</Label>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <code className="text-sm">name, company, role, email, phone, linkedin, location, notes</code>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>Recent import activity</CardDescription>
            </CardHeader>
            <CardContent>
              {importHistorySorted.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No imports have been recorded yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {importHistorySorted.map((entry) => (
                    <div key={entry._id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{entry.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          Imported {entry.contactsImported} contacts •{" "}
                          {new Date(entry.importedAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={entry.status === "success" ? "outline" : entry.status === "processing" ? "secondary" : "destructive"}
                        className="capitalize"
                      >
                        {entry.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

