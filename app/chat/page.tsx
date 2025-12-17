"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChatMessage } from "@/components/ChatMessage"
import { ChatInput } from "@/components/ChatInput"
import { ConfirmModal } from "@/components/ConfirmModal"
import { fakeAuth } from "@/lib/fakeAuth"
import { useToast } from "@/hooks/use-toast"
import { Database, LogOut, Loader2 } from "lucide-react"

interface Message {
  id: string
  text: string
  isUser: boolean
}

export default function ChatPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingSQL, setPendingSQL] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check authentication
    if (!fakeAuth.isAuthenticated()) {
      router.push("/login")
    }
  }, [router])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleLogout = () => {
    fakeAuth.logout()
    toast.success("Logged out successfully.")
    router.push("/login")
  }

  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI thinking time
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate different responses based on keywords
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes("create") || lowerMessage.includes("table")) {
      return `Here's the SQL to create a table:\n\n\`\`\`sql\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  email VARCHAR(255) UNIQUE NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\`\`\`\n\nThis will create a users table with id, name, email, and created_at columns.`
    }

    if (lowerMessage.includes("alter") || lowerMessage.includes("add column")) {
      return `I can help you alter the table. Here's the SQL:\n\n\`\`\`sql\nALTER TABLE users ADD COLUMN age INT;\n\`\`\`\n\nThis adds an age column to the users table.`
    }

    if (lowerMessage.includes("select") || lowerMessage.includes("query") || lowerMessage.includes("get")) {
      return `Here's a SELECT query for you:\n\n\`\`\`sql\nSELECT id, name, email, created_at\nFROM users\nWHERE created_at > NOW() - INTERVAL '7 days'\nORDER BY created_at DESC\nLIMIT 10;\n\`\`\`\n\nThis retrieves the 10 most recent users from the last 7 days.`
    }

    if (lowerMessage.includes("update")) {
      return `Here's an UPDATE statement:\n\n\`\`\`sql\nUPDATE users\nSET name = 'John Doe'\nWHERE email = 'john@example.com';\n\`\`\`\n\nThis updates the name for a specific user.`
    }

    if (lowerMessage.includes("delete")) {
      return `Here's a DELETE statement:\n\n\`\`\`sql\nDELETE FROM users\nWHERE created_at < NOW() - INTERVAL '1 year';\n\`\`\`\n\n⚠️ Be careful with DELETE operations! This removes users older than 1 year.`
    }

    // Default response
    return `I can help you with SQL queries! Here's an example:\n\n\`\`\`sql\nSELECT * FROM users WHERE active = true;\n\`\`\`\n\nTry asking me to create tables, write queries, or modify your database schema.`
  }

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const aiResponse = await simulateAIResponse(text)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("[v0] Error generating AI response:", error)
      toast.error("Failed to get response from AI assistant.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunSQL = (sql: string) => {
    setPendingSQL(sql)
    setShowConfirmModal(true)
  }

  const handleConfirmRunSQL = async () => {
    setShowConfirmModal(false)
    setIsExecuting(true)

    // Show executing message
    const executingMessage: Message = {
      id: Date.now().toString(),
      text: "Executing SQL query...",
      isUser: false,
    }
    setMessages((prev) => [...prev, executingMessage])

    // Simulate SQL execution
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Show success message
    const successMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: "✅ SQL executed successfully on database.\n\nQuery completed in 0.23s. Rows affected: 1",
      isUser: false,
    }
    setMessages((prev) => [...prev.slice(0, -1), successMessage])

    toast.success("SQL query executed successfully.")

    setIsExecuting(false)
    setPendingSQL("")
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-balance">AI Database Assistant</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
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
                <h2 className="text-2xl font-bold text-balance">Welcome to AI Database Assistant</h2>
                <p className="text-muted-foreground max-w-md text-pretty">
                  Ask me to generate SQL queries, create tables, or help with database operations.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message.text} isUser={message.isUser} onRunSQL={handleRunSQL} />
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
        description="Are you sure you want to run this SQL query on your database?"
        sql={pendingSQL}
      />
    </div>
  )
}
