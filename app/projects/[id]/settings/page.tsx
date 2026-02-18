"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ProjectNavigation } from "@/components/ProjectNavigation"
import { KnowledgeManagement } from "@/components/KnowledgeManagement"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Database, Loader2, Shield, Trash2, Save } from "lucide-react"
import { apiClient, type Project } from "@/lib/api"
import { authUtils } from "@/lib/auth"
import { connectionStateManager } from "@/lib/connectionState"

export default function ProjectSettingsPage() {
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()
    const [project, setProject] = useState<Project | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)

    // Form state
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [connectionString, setConnectionString] = useState("")
    const [allowDDL, setAllowDDL] = useState(true)
    const [allowWrite, setAllowWrite] = useState(true)
    const [allowRead, setAllowRead] = useState(true)
    const [allowDelete, setAllowDelete] = useState(true)

    useEffect(() => {
        if (!authUtils.isAuthenticated()) {
            router.push("/login")
            return
        }

        const loadProject = async () => {
            const projectId = Number.parseInt(params.id as string)

            const response = await apiClient.getProject(projectId)
            if (!response.success || !response.data) {
                toast.error("Project not found")
                router.push("/dashboard")
                setIsLoading(false)
                return
            }

            const proj = response.data
            setProject(proj)
            setName(proj.name)
            setDescription(proj.description)
            setConnectionString(proj.connection_string)

            // Fetch permissions from dedicated endpoint
            const permissionsResponse = await apiClient.getProjectPermissions(projectId)
            if (permissionsResponse.success && permissionsResponse.data) {
                const perms = permissionsResponse.data
                setAllowDDL(perms.allow_ddl)
                setAllowWrite(perms.allow_write)
                setAllowRead(perms.allow_read)
                setAllowDelete(perms.allow_delete)
            } else if (proj.permission) {
                // Fallback to project.permission if dedicated endpoint fails
                setAllowDDL(proj.permission.allow_ddl)
                setAllowWrite(proj.permission.allow_write)
                setAllowRead(proj.permission.allow_read)
                setAllowDelete(proj.permission.allow_delete)
            }

            setIsLoading(false)
        }

        loadProject()
    }, [params.id, router, toast])

    useEffect(() => {
        if (!project) return

        const projectId = project.id

        // Check if already connected from previous navigation
        const wasConnected = connectionStateManager.getConnectionState(projectId)
        if (wasConnected) {
            // Silently restore connection state
            setIsConnected(true)
        } else {
            // First time loading this project - auto-connect
            const autoConnect = async () => {
                try {
                    const response = await apiClient.connectDatabase(projectId)
                    if (response.success) {
                        setIsConnected(true)
                        connectionStateManager.setConnectionState(projectId, true)
                        toast.success("Connected to database successfully")
                    }
                } catch (error) {
                    // Silent fail on settings page
                }
            }
            autoConnect()
        }
    }, [project, toast])

    const handleConnect = async (projectId: number) => {
        setIsConnecting(true)
        try {
            const response = await apiClient.connectDatabase(projectId)
            if (response.success) {
                setIsConnected(true)
                connectionStateManager.setConnectionState(projectId, true)
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
                connectionStateManager.setConnectionState(projectId, false)
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

    const handleSave = async () => {
        if (!project || !name) {
            toast.error("Project name is required")
            return
        }

        setIsSaving(true)

        const response = await apiClient.updateProject(project.id, {
            name,
            description,
            connection_string: connectionString,
            allow_ddl: allowDDL,
            allow_write: allowWrite,
            allow_read: allowRead,
            allow_delete: allowDelete,
        })

        if (response.success && response.data) {
            setProject(response.data)
            toast.success("Project updated successfully")
        } else {
            toast.error(response.error || "Failed to update project")
        }

        setIsSaving(false)
    }

    const handleDelete = async () => {
        if (!project) return

        setIsDeleting(true)

        const response = await apiClient.deleteProject(project.id)

        if (response.success) {
            toast.success("Project deleted successfully")
            router.push("/dashboard")
        } else {
            toast.error(response.error || "Failed to delete project")
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground">Loading project settings...</p>
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

    return (
        <div className="min-h-screen bg-background">
            <ProjectNavigation
                project={project}
                isConnected={isConnected}
                isConnecting={isConnecting}
                onConnect={() => handleConnect(project.id)}
                onDisconnect={() => handleDisconnect(project.id)}
            />

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Project Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Details</CardTitle>
                            <CardDescription>Update your project information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                <Label htmlFor="connection-string">Connection String *</Label>
                                <Input
                                    id="connection-string"
                                    type="password"
                                    placeholder={
                                        project.database_type === "postgresql"
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

                            <div className="space-y-2">
                                <Label>Database Type</Label>
                                <div className="p-3 bg-secondary/30 border border-border rounded-lg">
                                    <p className="text-sm font-mono capitalize">{project.database_type}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Database type cannot be changed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permissions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Permissions
                            </CardTitle>
                            <CardDescription>Configure what operations are allowed for this project</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                                <div className="flex-1">
                                    <Label htmlFor="allow-ddl" className="font-medium">
                                        Allow DDL Operations
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-1">CREATE, ALTER, DROP, RENAME tables and schemas</p>
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
                        </CardContent>
                    </Card>

                    {/* Knowledge Management */}
                    <KnowledgeManagement projectId={project.id} />

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <Button onClick={handleSave} disabled={isSaving || !name} className="flex-1 gap-2">
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Danger Zone */}
                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            <CardDescription>Irreversible actions for this project</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="gap-2" disabled={isDeleting}>
                                        <Trash2 className="w-4 h-4" />
                                        Delete Project
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the project &quot;{project.name}&quot;
                                            and remove all associated data including chat history and query logs.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                                            {isDeleting ? "Deleting..." : "Delete Project"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
