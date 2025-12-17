"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Play, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ChatMessageProps {
  message: string
  isUser: boolean
  sql?: string
  onRunSQL?: (sql: string) => void
}

export function ChatMessage({ message, isUser, sql, onRunSQL }: ChatMessageProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const hasSql = !!sql

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql || "")
    setCopied(true)
    toast.success("SQL copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRunSQL = () => {
    if (onRunSQL && sql) {
      onRunSQL(sql)
    }
  }

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${isUser ? "bg-primary text-primary-foreground" : "bg-card border border-border"
          }`}
      >
        {/* User message */}
        {isUser && <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>}

        {/* AI message with optional SQL block */}
        {!isUser && (
          <>
            {message && <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>}

            {hasSql && (
              <div className="mt-3 space-y-3">
                <div className="rounded-lg bg-secondary/20 border border-border/50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-border/50 bg-secondary/30 flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">SQL</span>
                  </div>
                  <pre className="p-3 overflow-x-auto">
                    <code className="text-sm font-mono text-accent">{sql}</code>
                  </pre>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy} className="flex-1 gap-2 bg-transparent">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy SQL"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRunSQL}
                    className="flex-1 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Play className="w-4 h-4" />
                    Run SQL
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}