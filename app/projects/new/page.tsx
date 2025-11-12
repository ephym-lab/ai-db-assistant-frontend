"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { projectManager } from "@/lib/fakeAuth"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Database, Loader2, CheckCircle2 } from "lucide-react"

export default function NewProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [databaseType, setDatabaseType] = useState<"MySQL" | "PostgreSQL">("PostgreSQL")
  const [connectionString, setConnectionString] = useState("")
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionTested, setConnectionTested] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleTestConnection = async () => {
    if (!connectionString) {
      toast({
        title: "Connection string required",
        description: "Please enter a connection string to test.",
        variant: "destructive",
      })
      return
    }

    setIsTestingConnection(true)
    const success = await projectManager.testConnection(connectionString)

    if (success) {
      setConnectionTested(true)
      toast({
        title: "Connection successful",
        description: "Database connection verified successfully.",
      })
    } else {
      toast({
        title: "Connection failed",
        description: "Could not connect to the database. Please check your connection string.",
        variant: "destructive",
      })
    }

    setIsTestingConnection(false)
  }

  const handleSave = async () => {
    if (!name || !connectionString) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const project = projectManager.createProject({
        name,
        databaseType,
        connectionString,
      })

      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      })

      router.push(`/projects/${project.id}/dashboard`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-balance">Create New Project</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Configure your database connection and project settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="My Database Project"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="database-type">Database Type *</Label>
                <Select value={databaseType} onValueChange={(value: "MySQL" | "PostgreSQL") => setDatabaseType(value)}>
                  <SelectTrigger id="database-type" className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                    <SelectItem value="MySQL">MySQL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="connection-string">Connection String *</Label>
                <Input
                  id="connection-string"
                  type="password"
                  placeholder="postgresql://user:password@host:port/database"
                  value={connectionString}
                  onChange={(e) => {
                    setConnectionString(e.target.value)
                    setConnectionTested(false)
                  }}
                  className="bg-input border-border font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Your connection string is stored securely and never shared.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || !connectionString}
                  className="flex-1 bg-transparent"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : connectionTested ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-accent" />
                      Connection Verified
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !name || !connectionString} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Project"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
