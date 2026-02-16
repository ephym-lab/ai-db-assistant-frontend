"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Brain, Loader2, Database, Trash2, RefreshCw, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient, type QdrantSchemaResponse } from "@/lib/api"
import { ConfirmModal } from "@/components/ConfirmModal"

interface KnowledgeManagementProps {
    projectId: number
}

export function KnowledgeManagement({ projectId }: KnowledgeManagementProps) {
    const { toast } = useToast()
    const [isIngesting, setIsIngesting] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [clearExisting, setClearExisting] = useState(false)
    const [schemaData, setSchemaData] = useState<QdrantSchemaResponse | null>(null)
    const [showSchema, setShowSchema] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const handleIngestSchema = async () => {
        setIsIngesting(true)
        try {
            const response = await apiClient.ingestSchema(projectId, clearExisting)
            if (response.success && response.data) {
                toast.success(`Schema Ingested Successfully - ${response.data.tables_ingested || 0} tables ingested into Qdrant`)
                // Clear the schema view after ingestion
                setSchemaData(null)
                setShowSchema(false)
            } else {
                toast.error(response.error || "Failed to ingest schema")
            }
        } catch (error) {
            toast.error("An error occurred while ingesting schema")
        } finally {
            setIsIngesting(false)
        }
    }

    const handleUpdateSchema = async () => {
        setIsUpdating(true)
        try {
            const response = await apiClient.updateSchema(projectId)
            if (response.success && response.data) {
                toast.success(`Schema Updated Successfully - ${response.data.tables_ingested || 0} tables updated in Qdrant`)
                // Refresh schema view if it's currently shown
                if (showSchema) {
                    await handleViewSchema()
                }
            } else {
                toast.error(response.error || "Failed to update schema")
            }
        } catch (error) {
            toast.error("An error occurred while updating schema")
        } finally {
            setIsUpdating(false)
        }
    }

    const handleViewSchema = async () => {
        if (showSchema) {
            setShowSchema(false)
            return
        }

        setIsFetching(true)
        try {
            const response = await apiClient.getSchemaFromQdrant(projectId)
            if (response.success && response.data) {
                setSchemaData(response.data)
                setShowSchema(true)
                if (response.data.table_count === 0) {
                    toast.error("No schema data found in Qdrant. Please ingest schema first.")
                }
            } else {
                toast.error(response.error || "Failed to retrieve schema")
            }
        } catch (error) {
            toast.error("An error occurred while retrieving schema")
        } finally {
            setIsFetching(false)
        }
    }

    const handleDeleteSchema = async () => {
        setIsDeleting(true)
        try {
            const response = await apiClient.deleteSchema(projectId)
            if (response.success) {
                toast.success("Schema Deleted Successfully - All schema data removed from Qdrant")
                setSchemaData(null)
                setShowSchema(false)
            } else {
                toast.error(response.error || "Failed to delete schema")
            }
        } catch (error) {
            toast.error("An error occurred while deleting schema")
        } finally {
            setIsDeleting(false)
            setShowDeleteModal(false)
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        Knowledge Management
                    </CardTitle>
                    <CardDescription>
                        Manage database schema in Qdrant for context-aware AI SQL generation
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Ingest Schema Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-semibold mb-1">Ingest Schema</h4>
                                <p className="text-xs text-muted-foreground">
                                    Load database schema into Qdrant for AI context
                                </p>
                            </div>
                            <Button onClick={handleIngestSchema} disabled={isIngesting} className="gap-2">
                                {isIngesting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Ingesting...
                                    </>
                                ) : (
                                    <>
                                        <Database className="w-4 h-4" />
                                        Ingest
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 pl-1">
                            <Switch
                                id="clear-existing"
                                checked={clearExisting}
                                onCheckedChange={setClearExisting}
                                disabled={isIngesting}
                            />
                            <Label htmlFor="clear-existing" className="text-xs text-muted-foreground cursor-pointer">
                                Clear existing data before ingesting
                            </Label>
                        </div>
                    </div>

                    <div className="border-t border-border" />

                    {/* Update Schema Section */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-semibold mb-1">Update Schema</h4>
                            <p className="text-xs text-muted-foreground">Refresh existing schema data in Qdrant</p>
                        </div>
                        <Button onClick={handleUpdateSchema} disabled={isUpdating} variant="outline" className="gap-2">
                            {isUpdating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Update
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="border-t border-border" />

                    {/* View Schema Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-semibold mb-1">View Schema</h4>
                                <p className="text-xs text-muted-foreground">Display current schema stored in Qdrant</p>
                            </div>
                            <Button onClick={handleViewSchema} disabled={isFetching} variant="outline" className="gap-2">
                                {isFetching ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : showSchema ? (
                                    <>
                                        <EyeOff className="w-4 h-4" />
                                        Hide
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4" />
                                        View
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Schema Display */}
                        {showSchema && schemaData && schemaData.table_count > 0 && (
                            <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="gap-1">
                                            <Database className="w-3 h-3" />
                                            {schemaData.db_type}
                                        </Badge>
                                        <Badge variant="outline">{schemaData.table_count} tables</Badge>
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {schemaData.tables.map((table, idx) => (
                                        <div key={idx} className="rounded border border-border bg-card p-3 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                                <span className="font-mono text-sm font-semibold">{table.name}</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {table.columns.length} columns
                                                </Badge>
                                            </div>
                                            <div className="pl-6 space-y-1">
                                                {table.columns.map((column, colIdx) => (
                                                    <div key={colIdx} className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                                                        <span className="text-foreground">{column.name}</span>
                                                        <span className="text-primary">{column.type}</span>
                                                        {!column.nullable && <Badge variant="outline" className="text-[10px] px-1 py-0">NOT NULL</Badge>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-border" />

                    {/* Delete Schema Section */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-semibold mb-1 text-destructive">Delete Schema</h4>
                            <p className="text-xs text-muted-foreground">Remove all schema data from Qdrant</p>
                        </div>
                        <Button
                            onClick={() => setShowDeleteModal(true)}
                            disabled={isDeleting}
                            variant="destructive"
                            className="gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={showDeleteModal}
                onOpenChange={setShowDeleteModal}
                onConfirm={handleDeleteSchema}
                title="Delete Schema from Qdrant"
                description="Are you sure you want to delete all schema data from Qdrant? This action cannot be undone. You will need to re-ingest the schema to restore AI context awareness."
            />
        </>
    )
}
