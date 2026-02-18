"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Database, LayoutDashboard, MessageSquare, Settings, Loader2 } from "lucide-react"
import type { Project } from "@/lib/api"

interface ProjectNavigationProps {
    project: Project
    isConnected: boolean
    isConnecting?: boolean
    onConnect?: () => void
    onDisconnect?: () => void
}

export function ProjectNavigation({ project, isConnected, isConnecting = false, onConnect, onDisconnect }: ProjectNavigationProps) {
    const router = useRouter()
    const pathname = usePathname()

    const tabs = [
        {
            name: "Dashboard",
            href: `/projects/${project.id}/dashboard`,
            icon: LayoutDashboard,
        },
        {
            name: "Chat",
            href: `/projects/${project.id}/chat`,
            icon: MessageSquare,
        },
        {
            name: "Settings",
            href: `/projects/${project.id}/settings`,
            icon: Settings,
        },
    ]

    const isActive = (href: string) => pathname === href

    return (
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="container mx-auto px-4">
                {/* Top Row: Project Info and Status */}
                <div className="h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Database className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-balance">{project.name}</h1>
                            <p className="text-xs text-muted-foreground">{project.database_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={isConnected ? "success" : "secondary"} className="gap-1">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-600" : "bg-gray-400"}`} />
                            {isConnected ? "Connected" : "Disconnected"}
                        </Badge>
                        {isConnected ? (
                            onDisconnect && (
                                <Button
                                    onClick={onDisconnect}
                                    disabled={isConnecting}
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2"
                                >
                                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Disconnect
                                </Button>
                            )
                        ) : (
                            onConnect && (
                                <Button
                                    onClick={onConnect}
                                    disabled={isConnecting}
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2"
                                >
                                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Connect
                                </Button>
                            )
                        )}
                    </div>
                </div>

                {/* Bottom Row: Navigation Tabs */}
                <div className="flex items-center gap-1 -mb-px">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const active = isActive(tab.href)
                        return (
                            <button
                                key={tab.href}
                                onClick={() => router.push(tab.href)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${active
                                    ? "border-primary text-primary font-medium"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm">{tab.name}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </header>
    )
}
