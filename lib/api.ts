const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface User {
  id: number
  name: string
  email: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: number
  user_id: number
  name: string
  description: string
  database_type: "postgresql" | "mysql"
  connection_string: string
  created_at: string
  updated_at: string
  user?: User
}

export interface ProjectSummary {
  project_id: number
  project_name: string
  database_type: string
  table_count: number
  total_queries: number
  recent_queries: Array<{
    id: number
    project_id: number
    query: string
    status: "success" | "error"
    result?: string
    error?: string
    created_at: string
  }>
}

export interface DashboardData {
  total_projects: number
  total_queries: number
  total_messages: number
}

export interface ChatMessage {
  id: number
  project_id: number
  role: "user" | "assistant"
  content: string
  ai_response?: {
    content: string
    query?: string
  }
  created_at: string
}

export interface ChatResponse {
  user_message: ChatMessage
  ai_message: ChatMessage
  ai_response: {
    content: string
    query?: string
  }
}

class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token")
    }
    return null
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    const token = this.getAuthToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    return headers
  }

  private async request<T>(method: string, endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      }

      if (body) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(url, options)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("[v0] API error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  // Auth endpoints
  async signup(name: string, email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request("POST", "/api/auth/signup", { name, email, password })
  }

  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request("POST", "/api/auth/login", { email, password })
  }

  // Project endpoints
  async createProject(
    name: string,
    description: string,
    database_type: "postgresql" | "mysql",
    connection_string: string,
  ): Promise<ApiResponse<Project>> {
    return this.request("POST", "/api/projects", { name, description, database_type, connection_string })
  }

  async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.request("GET", "/api/projects")
  }

  async getProject(id: number): Promise<ApiResponse<Project>> {
    return this.request("GET", `/api/projects/${id}`)
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<ApiResponse<Project>> {
    return this.request("PUT", `/api/projects/${id}`, updates)
  }

  async deleteProject(id: number): Promise<ApiResponse<null>> {
    return this.request("DELETE", `/api/projects/${id}`)
  }

  // Dashboard endpoints
  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    return this.request("GET", "/api/dashboard")
  }

  async getProjectSummary(id: number): Promise<ApiResponse<ProjectSummary>> {
    return this.request("GET", `/api/projects/${id}/summary`)
  }

  // Chat endpoints
  async sendChatMessage(projectId: number, content: string): Promise<ApiResponse<ChatResponse>> {
    return this.request("POST", `/api/chat/${projectId}`, { content })
  }

  async getChatHistory(projectId: number): Promise<ApiResponse<ChatMessage[]>> {
    return this.request("GET", `/api/chat/${projectId}/history`)
  }
}

export const apiClient = new ApiClient()
