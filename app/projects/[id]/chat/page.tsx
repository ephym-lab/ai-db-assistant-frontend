"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChatMessage } from "@/components/ChatMessage"
import { ChatInput } from "@/components/ChatInput"
import { ConfirmModal } from "@/components/ConfirmModal"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Database, Loader2, LogOut } from "lucide-react"
import { apiClient, type Project, type ChatMessage as ChatMessageType } from "@/lib/api"
import { authUtils } from "@/lib/auth"

interface Message {
  id: string
  text: string
  isUser: boolean
  sql?: string
}

export default function ProjectChatPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingSQL, setPendingSQL] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
        toast.info("Project not found.")
        router.push("/dashboard")
        setPageLoading(false)
        return
      }

      setProject(projectResponse.data)

      // Auto-connect to database
      await handleConnect(projectId)

      const historyResponse = await apiClient.getChatHistory(projectId)
      if (historyResponse.success && historyResponse.data) {
        const formattedMessages = historyResponse.data.map((msg: ChatMessageType) => ({
          id: msg.id.toString(),
          text: msg.role === "user" ? msg.content : msg.ai_response?.content || msg.content,
          isUser: msg.role === "user",
          sql: msg.ai_response?.query,
        }))
        setMessages(formattedMessages)
      }

      setPageLoading(false)
    }

    loadProject()
  }, [params.id, router, toast])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (text: string) => {
    if (!project) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await apiClient.sendChatMessage(project.id, text)

      if (response.success && response.data) {
        const aiMessage: Message = {
          id: response.data.ai_message.id.toString(),
          text: response.data.ai_response.content,
          isUser: false,
          sql: response.data.ai_response.query,
        }
        setMessages((prev) => [...prev, aiMessage])
      } else {
        toast.error(response.error || "Failed to get response from AI.")
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunSQL = (sql: string) => {
    setPendingSQL(sql)
    setShowConfirmModal(true)
  }

  const handleConfirmRunSQL = async () => {
    if (!project) return

    setShowConfirmModal(false)
    setIsExecuting(true)

    const executingMessage: Message = {
      id: Date.now().toString(),
      text: "Executing SQL query...",
      isUser: false,
    }
    setMessages((prev) => [...prev, executingMessage])

    try {
      const response = await apiClient.executeSQL(project.id, pendingSQL)

      if (response.success && response.data) {
        const result = response.data
        let resultText = `✅ ${result.message}\n\n`

        if (result.columns && result.rows && result.rows.length > 0) {
          resultText += `Returned ${result.row_count || result.rows.length} row(s)\n\n`
          resultText += `Columns: ${result.columns.join(", ")}`
        } else if (result.affected_rows !== undefined) {
          resultText += `Rows affected: ${result.affected_rows}`
        } else if (result.row_count === 0) {
          resultText += "Query returned no results"
        }

        const successMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: resultText,
          isUser: false,
        }
        setMessages((prev) => [...prev.slice(0, -1), successMessage])
        toast.success("SQL query executed successfully")
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: `❌ Error: ${response.error || "Failed to execute query"}`,
          isUser: false,
        }
        setMessages((prev) => [...prev.slice(0, -1), errorMessage])
        toast.error(response.error || "Failed to execute SQL query")
      }
    } catch (error) {
      console.error("[v0] Error executing SQL:", error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: "❌ Error executing SQL query. Please check your query and try again.",
        isUser: false,
      }
      setMessages((prev) => [...prev.slice(0, -1), errorMessage])
      toast.error("Failed to execute SQL query")
    } finally {
      setIsExecuting(false)
      setPendingSQL("")
    }
  }

  const handleLogout = () => {
    authUtils.logout()
    router.push("/login")
  }

  if (pageLoading) {
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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-balance">{project.name}</h1>
              <p className="text-xs text-muted-foreground">AI Assistant • {project.database_type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "success" : "secondary"} className="gap-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-600" : "bg-gray-400"}`} />
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {isConnected ? (
              <Button
                onClick={() => handleDisconnect(project.id)}
                disabled={isConnecting}
                variant="ghost"
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
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Connect
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-balance">AI Assistant for {project.name}</h2>
                <p className="text-muted-foreground max-w-md text-pretty">
                  Ask me to generate SQL queries, create tables, or help with database operations for your{" "}
                  {project.database_type} database.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message.text}
                  isUser={message.isUser}
                  sql={message.sql}
                  onRunSQL={handleRunSQL}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <ChatInput onSend={handleSendMessage} disabled={isLoading || isExecuting} />
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleConfirmRunSQL}
        title="Execute SQL Query"
        description={`Are you sure you want to run this SQL query on ${project.name}?`}
        sql={pendingSQL}
      />
    </div>
  )
}
