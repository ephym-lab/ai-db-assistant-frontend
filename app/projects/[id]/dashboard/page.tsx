"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fakeAuth, projectManager, type Project } from "@/lib/fakeAuth"
import { ArrowLeft, Database, MessageSquare, Table, Activity, Clock, Server } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProjectDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    if (!fakeAuth.isAuthenticated()) {
      router.push("/login")
      return
    }

    const projectId = params.id as string
    const foundProject = projectManager.getProject(projectId)

    if (!foundProject) {
      toast({
        title: "Project not found",
        description: "The requested project could not be found.",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }

    setProject(foundProject)
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

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-balance">{project.name}</h1>
              <p className="text-xs text-muted-foreground">{project.databaseType}</p>
            </div>
          </div>
          <Button onClick={() => router.push(`/projects/${project.id}/chat`)} className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Open Chat
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  Total Tables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{project.tableCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Queries Executed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{project.queryCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Last Activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{formatDate(project.lastActivity)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Connection Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Connection Details
              </CardTitle>
              <CardDescription>Database connection information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Database Type</p>
                  <p className="font-mono text-sm">{project.databaseType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Created</p>
                  <p className="font-mono text-sm">{formatDate(project.createdAt)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Connection String</p>
                <p className="font-mono text-sm bg-secondary/30 px-3 py-2 rounded border border-border">
                  {maskConnectionString(project.connectionString)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Queries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Queries</CardTitle>
              <CardDescription>Last queries executed by the AI assistant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { query: "SELECT * FROM users WHERE active = true", time: "2 hours ago", status: "Success" },
                  {
                    query: "ALTER TABLE products ADD COLUMN price DECIMAL(10,2)",
                    time: "5 hours ago",
                    status: "Success",
                  },
                  { query: "CREATE INDEX idx_user_email ON users(email)", time: "1 day ago", status: "Success" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 rounded-lg bg-secondary/30 border border-border"
                  >
                    <div className="flex-1">
                      <code className="text-sm font-mono text-accent">{item.query}</code>
                      <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">{item.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to chat?</h3>
              <p className="text-muted-foreground mb-6 max-w-md text-pretty">
                Open the AI chat to start generating SQL queries and managing your database
              </p>
              <Button onClick={() => router.push(`/projects/${project.id}/chat`)} size="lg" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Open AI Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Floating Chat Button */}
      <Button
        onClick={() => router.push(`/projects/${project.id}/chat`)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    </div>
  )
}
