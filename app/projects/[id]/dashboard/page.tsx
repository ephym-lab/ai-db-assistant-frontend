"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DatabaseSchema } from "@/components/DatabaseSchema"
import { ProjectNavigation } from "@/components/ProjectNavigation"
import { KnowledgeManagement } from "@/components/KnowledgeManagement"
import { ArrowLeft, Database, MessageSquare, Loader2, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient, type Project, type ProjectSummary, type DatabaseSchema as DatabaseSchemaType } from "@/lib/api"
import { authUtils } from "@/lib/auth"

export default function ProjectDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [summary, setSummary] = useState<ProjectSummary | null>(null)
  const [schema, setSchema] = useState<DatabaseSchemaType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  const handleConnect = async (projectId: number) => {
    setIsConnecting(true)
    try {
      const response = await apiClient.connectDatabase(projectId)
      if (response.success) {
        setIsConnected(true)
        toast.success("Connected to database successfully")
      } else {
        toast.error(response.error || "Failed to connect to database")
      }
    } catch (error) {
      toast.error("An error occurred while connecting to database")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async (projectId: number) => {
    setIsConnecting(true)
    try {
      const response = await apiClient.disconnectDatabase(projectId)
      if (response.success) {
        setIsConnected(false)
        toast.success("Disconnected from database")
      } else {
        toast.error(response.error || "Failed to disconnect from database")
      }
    } catch (error) {
      toast.error("An error occurred while disconnecting from database")
    } finally {
      setIsConnecting(false)
    }
  }

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      router.push("/login")
      return
    }

    const loadProject = async () => {
      const projectId = Number.parseInt(params.id as string)

      const projectResponse = await apiClient.getProject(projectId)
      if (!projectResponse.success || !projectResponse.data) {
        toast.error("Project not found")
        router.push("/dashboard")
        setIsLoading(false)
        return
      }

      setProject(projectResponse.data)

      // Auto-connect to database
      await handleConnect(projectId)

      const summaryResponse = await apiClient.getProjectSummary(projectId)
      if (summaryResponse.success && summaryResponse.data) {
        setSummary(summaryResponse.data)
      }

      // Fetch schema data
      const schemaResponse = await apiClient.getProjectSchema(projectId)
      if (schemaResponse.success && schemaResponse.data) {
        setSchema(schemaResponse.data)
      }

      setIsLoading(false)
    }

    loadProject()
  }, [params.id, router, toast])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const maskConnectionString = (str: string) => {
    if (str.length < 20) return "••••••••••••••••"
    return str.substring(0, 15) + "••••••••••••••••"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </div>
    )
  }

  const handleNavigate = (path: string) => {
    setIsNavigating(true)
    router.push(path)
  }

  return (
    <div className="min-h-screen bg-background">
      <ProjectNavigation project={project} isConnected={isConnected} />

      {/* Connection Controls */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-end gap-2">
          {isConnected ? (
            <Button
              onClick={() => handleDisconnect(project.id)}
              disabled={isConnecting}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={() => handleConnect(project.id)}
              disabled={isConnecting}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Connect
            </Button>
          )}
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">Tables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{schema?.table_count || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">Queries Executed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{summary?.total_queries || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">Last Activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{formatDate(project.updated_at)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Connection Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Connection Details
              </CardTitle>
              <CardDescription>Database connection information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Database Type</p>
                  <p className="font-mono text-sm capitalize">{project.database_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Created</p>
                  <p className="font-mono text-sm">{formatDate(project.created_at)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Connection String</p>
                <p className="font-mono text-sm bg-secondary/30 px-3 py-2 rounded border border-border">
                  {maskConnectionString(project.connection_string)}
                </p>
              </div>
              {project.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Queries */}
          {summary && summary.recent_queries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Queries</CardTitle>
                <CardDescription>Last queries executed by the AI assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.recent_queries.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-3 rounded-lg bg-secondary/30 border border-border"
                    >
                      <div className="flex-1">
                        <code className="text-sm font-mono text-accent">{item.query}</code>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(item.created_at)}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${item.status === "success" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                          }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Permissions */}
          {project.permission && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Permissions
                </CardTitle>
                <CardDescription>Operations allowed for this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex flex-col items-center p-3 rounded-lg border border-border">
                    <Badge variant={project.permission.allow_ddl ? "success" : "secondary"} className="mb-2">
                      {project.permission.allow_ddl ? "Enabled" : "Disabled"}
                    </Badge>
                    <span className="text-sm font-medium">DDL</span>
                    <span className="text-xs text-muted-foreground text-center">CREATE, ALTER, DROP</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg border border-border">
                    <Badge variant={project.permission.allow_write ? "success" : "secondary"} className="mb-2">
                      {project.permission.allow_write ? "Enabled" : "Disabled"}
                    </Badge>
                    <span className="text-sm font-medium">Write</span>
                    <span className="text-xs text-muted-foreground text-center">INSERT, UPDATE</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg border border-border">
                    <Badge variant={project.permission.allow_read ? "success" : "secondary"} className="mb-2">
                      {project.permission.allow_read ? "Enabled" : "Disabled"}
                    </Badge>
                    <span className="text-sm font-medium">Read</span>
                    <span className="text-xs text-muted-foreground text-center">SELECT</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg border border-border">
                    <Badge variant={project.permission.allow_delete ? "success" : "secondary"} className="mb-2">
                      {project.permission.allow_delete ? "Enabled" : "Disabled"}
                    </Badge>
                    <span className="text-sm font-medium">Delete</span>
                    <span className="text-xs text-muted-foreground text-center">DELETE, TRUNCATE</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Knowledge Management */}
          <KnowledgeManagement projectId={project.id} />

          {/* Database Schema */}
          <DatabaseSchema projectId={project.id} />

          {/* Quick Actions */}
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to chat?</h3>
              <p className="text-muted-foreground mb-6 max-w-md text-pretty">
                Open the AI chat to start generating SQL queries and managing your database
              </p>
              <Button onClick={() => handleNavigate(`/projects/${project.id}/chat`)} disabled={isNavigating} size="lg" className="gap-2">
                {isNavigating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                Open AI Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Floating Chat Button */}
      <Button
        onClick={() => handleNavigate(`/projects/${project.id}/chat`)}
        disabled={isNavigating}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl"
      >
        {isNavigating ? <Loader2 className="w-6 h-6 animate-spin" /> : <MessageSquare className="w-6 h-6" />}
      </Button>
    </div>
  )
}
