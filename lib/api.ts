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

export interface Permission {
  id: number
  project_id: number
  allow_ddl: boolean
  allow_write: boolean
  allow_read: boolean
  allow_delete: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: number
  user_id: number
  name: string
  description: string
  database_type: "postgresql" | "mysql"
  provider: string
  connection_string: string
  created_at: string
  updated_at: string
  user?: User
  permission?: Permission
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
}

export interface TableInfo {
  name: string
  columns: ColumnInfo[]
}

export interface DatabaseInfo {
  connected: boolean
  database_type: string
  database_name: string
  tables: TableInfo[]
}

export interface DatabaseSchema {
  db_type: string
  database: string
  host: string
  port: number
  table_count: number
  tables: TableInfo[]
}

export interface QueryResult {
  columns?: string[]
  rows?: unknown[][]
  row_count?: number
  affected_rows?: number
  message: string
}

export interface ValidationResult {
  valid: boolean
  message: string
  query_type?: string
  estimated_cost?: string
}

export interface ConnectionResult {
  session_id: string
  message: string
  database_type: string
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

export interface IngestSchemaRequest {
  clear_existing?: boolean
}

export interface IngestSchemaResponse {
  success: boolean
  project_id: string
  tables_ingested?: number
  message: string
  error?: string
}

export interface QdrantSchemaResponse {
  success: boolean
  project_id: string
  db_type?: string
  table_count: number
  tables: TableInfo[]
  message: string
  error?: string
}

export interface DeleteSchemaResponse {
  success: boolean
  project_id: string
  message: string
  error?: string
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

      console.log("[v0] API Request:", { method, endpoint, body })

      const response = await fetch(url, options)
      const data = await response.json()

      console.log("[v0] API Response:", { status: response.status, data })

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        }
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
  async signup(name: string, email: string, password: string): Promise<ApiResponse<{ user: User }>> {
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
    provider: string,
    connection_string: string,
    permissions?: {
      allow_ddl?: boolean
      allow_write?: boolean
      allow_read?: boolean
      allow_delete?: boolean
    },
  ): Promise<ApiResponse<Project>> {
    return this.request("POST", "/api/projects", {
      name,
      description,
      database_type,
      provider,
      connection_string,
      allow_ddl: permissions?.allow_ddl ?? true,
      allow_write: permissions?.allow_write ?? true,
      allow_read: permissions?.allow_read ?? true,
      allow_delete: permissions?.allow_delete ?? true,
    })
  }

  async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.request("GET", "/api/projects")
  }

  async getProject(id: number): Promise<ApiResponse<Project>> {
    return this.request("GET", `/api/projects/${id}`)
  }

  async updateProject(
    id: number,
    updates: {
      name?: string
      description?: string
      connection_string?: string
      allow_ddl?: boolean
      allow_write?: boolean
      allow_read?: boolean
      allow_delete?: boolean
    },
  ): Promise<ApiResponse<Project>> {
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

  // Database operation endpoints
  async connectDatabase(projectId: number): Promise<ApiResponse<ConnectionResult>> {
    return this.request("POST", `/api/projects/${projectId}/connect-db`)
  }

  async disconnectDatabase(projectId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request("POST", `/api/projects/${projectId}/disconnect-db`)
  }

  async executeSQL(
    projectId: number,
    query: string,
    dryRun: boolean = false,
  ): Promise<ApiResponse<QueryResult>> {
    return this.request("POST", `/api/projects/${projectId}/execute-sql`, { query, dry_run: dryRun })
  }

  async validateSQL(projectId: number, query: string): Promise<ApiResponse<ValidationResult>> {
    return this.request("POST", `/api/projects/${projectId}/validate-sql`, { query })
  }

  async getDatabaseInfo(projectId: number): Promise<ApiResponse<DatabaseInfo>> {
    return this.request("GET", `/api/projects/${projectId}/db-info`)
  }

  async getProjectSchema(projectId: number): Promise<ApiResponse<DatabaseSchema>> {
    return this.request("GET", `/api/projects/${projectId}/get-schema`)
  }

  async getProjectPermissions(projectId: number): Promise<ApiResponse<Permission>> {
    return this.request("GET", `/api/projects/${projectId}/permissions`)
  }

  // Schema management endpoints (Qdrant)
  async ingestSchema(
    projectId: number,
    clearExisting: boolean = false,
  ): Promise<ApiResponse<IngestSchemaResponse>> {
    return this.request("POST", `/api/projects/${projectId}/ingest-schema`, { clear_existing: clearExisting })
  }

  async updateSchema(projectId: number): Promise<ApiResponse<IngestSchemaResponse>> {
    return this.request("POST", `/api/projects/${projectId}/update-schema`)
  }

  async getSchemaFromQdrant(projectId: number): Promise<ApiResponse<QdrantSchemaResponse>> {
    return this.request("GET", `/api/projects/${projectId}/get-schema-from-qdrant`)
  }

  async deleteSchema(projectId: number): Promise<ApiResponse<DeleteSchemaResponse>> {
    return this.request("DELETE", `/api/projects/${projectId}/delete-schema`)
  }

}

export const apiClient = new ApiClient()
