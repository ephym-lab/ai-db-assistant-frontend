"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, RefreshCw, ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { apiClient, type DatabaseSchema as DatabaseSchemaType, type TableInfo } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface DatabaseSchemaProps {
    projectId: number
}

export function DatabaseSchema({ projectId }: DatabaseSchemaProps) {
    const { toast } = useToast()
    const [dbInfo, setDbInfo] = useState<DatabaseSchemaType | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())

    const loadSchema = async () => {
        setIsLoading(true)
        try {
            const response = await apiClient.getProjectSchema(projectId)

            if (response.success && response.data) {
                setDbInfo(response.data)
                // Auto-expand first table
                if (response.data.tables.length > 0) {
                    setExpandedTables(new Set([response.data.tables[0].name]))
                }
            } else {
                // Don't show error toast for connection issues, just set dbInfo to null
                // The UI will show a friendly message
                setDbInfo(null)
            }
        } catch {
            // Silently handle errors - the UI will show appropriate message
            setDbInfo(null)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadSchema()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId])

    const toggleTable = (tableName: string) => {
        setExpandedTables((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(tableName)) {
                newSet.delete(tableName)
            } else {
                newSet.add(tableName)
            }
            return newSet
        })
    }

    if (isLoading && !dbInfo) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Loading database schema...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!dbInfo) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">Database schema not available</p>
                        <Button onClick={loadSchema} disabled={isLoading} size="sm" variant="outline" className="gap-2">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            Database Schema
                        </CardTitle>
                        <CardDescription>
                            {dbInfo.database} • {dbInfo.table_count} {dbInfo.table_count === 1 ? "table" : "tables"}
                        </CardDescription>
                    </div>
                    <Button onClick={loadSchema} disabled={isLoading} size="sm" variant="outline" className="gap-2">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>


                {dbInfo.tables.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No tables found in this database</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {dbInfo.tables.map((table: TableInfo) => {
                            const isExpanded = expandedTables.has(table.name)
                            return (
                                <div key={table.name} className="border border-border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => toggleTable(table.name)}
                                        className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                            )}
                                            <span className="font-mono text-sm font-medium">{table.name}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {table.columns.length} {table.columns.length === 1 ? "column" : "columns"}
                                            </Badge>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-border bg-secondary/20">
                                            <div className="p-3 space-y-1">
                                                {table.columns.map((column, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between py-2 px-3 rounded hover:bg-secondary/50"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-mono text-sm">{column.name}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {column.type}
                                                            </Badge>
                                                        </div>
                                                        {!column.nullable && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                NOT NULL
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
