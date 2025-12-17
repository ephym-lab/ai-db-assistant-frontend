"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Play, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { apiClient, type QueryResult, type Permission } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface SQLExecutorProps {
    projectId: number
    sql: string
    permission?: Permission
    onExecutionComplete?: (result: QueryResult) => void
}

export function SQLExecutor({ projectId, sql, permission, onExecutionComplete }: SQLExecutorProps) {
    const { toast } = useToast()
    const [isExecuting, setIsExecuting] = useState(false)
    const [result, setResult] = useState<QueryResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    const getQueryType = (query: string): string => {
        const normalized = query.trim().toUpperCase()
        if (normalized.startsWith("SELECT")) return "SELECT"
        if (normalized.startsWith("INSERT")) return "INSERT"
        if (normalized.startsWith("UPDATE")) return "UPDATE"
        if (normalized.startsWith("DELETE") || normalized.startsWith("TRUNCATE")) return "DELETE"
        if (
            normalized.startsWith("CREATE") ||
            normalized.startsWith("ALTER") ||
            normalized.startsWith("DROP") ||
            normalized.startsWith("RENAME")
        )
            return "DDL"
        return "UNKNOWN"
    }

    const canExecute = (): { allowed: boolean; reason?: string } => {
        if (!permission) return { allowed: true }

        const queryType = getQueryType(sql)

        switch (queryType) {
            case "SELECT":
                if (!permission.allow_read) {
                    return { allowed: false, reason: "Read operations are disabled for this project" }
                }
                break
            case "INSERT":
            case "UPDATE":
                if (!permission.allow_write) {
                    return { allowed: false, reason: "Write operations are disabled for this project" }
                }
                break
            case "DELETE":
                if (!permission.allow_delete) {
                    return { allowed: false, reason: "Delete operations are disabled for this project" }
                }
                break
            case "DDL":
                if (!permission.allow_ddl) {
                    return { allowed: false, reason: "DDL operations are disabled for this project" }
                }
                break
            default:
                return { allowed: false, reason: "Unknown query type" }
        }

        return { allowed: true }
    }

    const handleExecute = async () => {
        const permissionCheck = canExecute()
        if (!permissionCheck.allowed) {
            toast.error(permissionCheck.reason || "Operation not allowed")
            setError(permissionCheck.reason || "Operation not allowed")
            return
        }

        setIsExecuting(true)
        setError(null)
        setResult(null)

        try {
            const response = await apiClient.executeSQL(projectId, sql)

            if (response.success && response.data) {
                setResult(response.data)
                toast.success(response.data.message || "Query executed successfully")
                onExecutionComplete?.(response.data)
            } else {
                const errorMsg = response.error || "Failed to execute query"
                setError(errorMsg)
                toast.error(errorMsg)
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred"
            setError(errorMsg)
            toast.error(errorMsg)
        } finally {
            setIsExecuting(false)
        }
    }

    const queryType = getQueryType(sql)
    const permissionCheck = canExecute()

    return (
        <Card className="mt-4">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">SQL Query</CardTitle>
                        <CardDescription>
                            Type: <Badge variant="outline">{queryType}</Badge>
                        </CardDescription>
                    </div>
                    <Button onClick={handleExecute} disabled={isExecuting || !permissionCheck.allowed} size="sm" className="gap-2">
                        {isExecuting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Executing...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Execute
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* SQL Code Block */}
                <div className="relative">
                    <pre className="bg-secondary/30 border border-border rounded-lg p-4 overflow-x-auto">
                        <code className="text-sm font-mono">{sql}</code>
                    </pre>
                </div>

                {/* Permission Warning */}
                {!permissionCheck.allowed && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-destructive">Permission Denied</p>
                            <p className="text-sm text-destructive/80">{permissionCheck.reason}</p>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-destructive">Execution Error</p>
                            <p className="text-sm text-destructive/80">{error}</p>
                        </div>
                    </div>
                )}

                {/* Success Result */}
                {result && !error && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">{result.message}</p>
                        </div>

                        {/* SELECT Results Table */}
                        {result.columns && result.rows && result.rows.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {result.columns.map((col, idx) => (
                                                <TableHead key={idx}>{col}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {result.rows.slice(0, 100).map((row, rowIdx) => (
                                            <TableRow key={rowIdx}>
                                                {row.map((cell, cellIdx) => (
                                                    <TableCell key={cellIdx}>
                                                        {cell === null ? (
                                                            <span className="text-muted-foreground italic">NULL</span>
                                                        ) : (
                                                            String(cell)
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {result.rows.length > 100 && (
                                    <div className="p-3 bg-muted/50 border-t text-sm text-muted-foreground text-center">
                                        Showing first 100 of {result.row_count || result.rows.length} rows
                                    </div>
                                )}
                            </div>
                        )}

                        {/* INSERT/UPDATE/DELETE Results */}
                        {result.affected_rows !== undefined && (
                            <div className="p-3 bg-secondary/30 border border-border rounded-lg">
                                <p className="text-sm">
                                    <span className="font-medium">Rows affected:</span> {result.affected_rows}
                                </p>
                            </div>
                        )}

                        {/* Empty Result Set */}
                        {result.row_count === 0 && result.columns && (
                            <div className="p-6 text-center text-muted-foreground">
                                <p className="text-sm">Query returned no results</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
