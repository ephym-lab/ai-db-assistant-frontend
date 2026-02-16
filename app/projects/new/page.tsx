"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Database, Loader2, Shield } from "lucide-react"
import { apiClient } from "@/lib/api"
import { authUtils } from "@/lib/auth"

export default function NewProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [databaseType, setDatabaseType] = useState<"postgresql" | "mysql">("postgresql")
  const [provider, setProvider] = useState("local")
  const [customProvider, setCustomProvider] = useState("")
  const [connectionString, setConnectionString] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Permission states
  const [allowDDL, setAllowDDL] = useState(true)
  const [allowWrite, setAllowWrite] = useState(true)
  const [allowRead, setAllowRead] = useState(true)
  const [allowDelete, setAllowDelete] = useState(true)

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      router.push("/login")
    }
  }, [router])

  const handleSave = async () => {
    if (!name || !connectionString) {
      toast.error("Please fill in all required fields")
      return
    }

    if (provider === "other" && !customProvider.trim()) {
      toast.error("Please enter a custom provider name")
      return
    }

    setIsSaving(true)

    const finalProvider = provider === "other" ? customProvider.trim() : provider

    const response = await apiClient.createProject(name, description, databaseType, finalProvider, connectionString, {
      allow_ddl: allowDDL,
      allow_write: allowWrite,
      allow_read: allowRead,
      allow_delete: allowDelete,
    })

    if (response.success && response.data) {
      toast.success("Project created successfully")
      router.push(`/projects/${response.data.id}/dashboard`)
    } else {
      toast.error(`Failed to create project: ${response.error}`)
    }

    setIsSaving(false)
  }

  return (
    <div className="min-h-screen bg-background">
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your project"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-input border-border resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="database-type">Database Type *</Label>
                <Select value={databaseType} onValueChange={(value: "postgresql" | "mysql") => setDatabaseType(value)}>
                  <SelectTrigger id="database-type" className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Database Provider *</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger id="provider" className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="render">Render</SelectItem>
                    <SelectItem value="supabase">Supabase</SelectItem>
                    <SelectItem value="aws-rds">AWS RDS</SelectItem>
                    <SelectItem value="google-cloud-sql">Google Cloud SQL</SelectItem>
                    <SelectItem value="azure-database">Azure Database</SelectItem>
                    <SelectItem value="railway">Railway</SelectItem>
                    <SelectItem value="planetscale">PlanetScale</SelectItem>
                    <SelectItem value="neon">Neon</SelectItem>
                    <SelectItem value="digitalocean">DigitalOcean</SelectItem>
                    <SelectItem value="heroku">Heroku</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select where your database is hosted
                </p>
              </div>

              {provider === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-provider">Custom Provider Name *</Label>
                  <Input
                    id="custom-provider"
                    placeholder="Enter provider name (e.g., Vercel Postgres, Cockroach DB)"
                    value={customProvider}
                    onChange={(e) => setCustomProvider(e.target.value)}
                    className="bg-input border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Specify your custom database provider
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="connection-string">Connection String *</Label>
                <Input
                  id="connection-string"
                  type="password"
                  placeholder={
                    databaseType === "postgresql"
                      ? "postgresql://user:password@host:port/database"
                      : "mysql://user:password@host:port/database"
                  }
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  className="bg-input border-border font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Your connection string is stored securely and never shared.
                </p>
              </div>

              {/* Permissions Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <Label className="text-base font-semibold">Permissions</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure what operations are allowed for this project
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex-1">
                      <Label htmlFor="allow-ddl" className="font-medium">
                        Allow DDL Operations
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        CREATE, ALTER, DROP, RENAME tables and schemas
                      </p>
                    </div>
                    <Switch id="allow-ddl" checked={allowDDL} onCheckedChange={setAllowDDL} />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex-1">
                      <Label htmlFor="allow-write" className="font-medium">
                        Allow Write Operations
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">INSERT, UPDATE data in tables</p>
                    </div>
                    <Switch id="allow-write" checked={allowWrite} onCheckedChange={setAllowWrite} />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex-1">
                      <Label htmlFor="allow-read" className="font-medium">
                        Allow Read Operations
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">SELECT data from tables</p>
                    </div>
                    <Switch id="allow-read" checked={allowRead} onCheckedChange={setAllowRead} />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex-1">
                      <Label htmlFor="allow-delete" className="font-medium">
                        Allow Delete Operations
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">DELETE, TRUNCATE data from tables</p>
                    </div>
                    <Switch id="allow-delete" checked={allowDelete} onCheckedChange={setAllowDelete} />
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} disabled={isSaving || !name || !connectionString} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
