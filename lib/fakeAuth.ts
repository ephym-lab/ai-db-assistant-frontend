export interface User {
  name: string
  email: string
  password: string
}

export interface Project {
  id: string
  name: string
  databaseType: "MySQL" | "PostgreSQL"
  connectionString: string
  createdAt: string
  tableCount: number
  queryCount: number
  lastActivity: string
}

export const fakeAuth = {
  signup: (user: User): boolean => {
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]")

      // Check if user already exists
      if (users.some((u: User) => u.email === user.email)) {
        return false
      }

      users.push(user)
      localStorage.setItem("users", JSON.stringify(users))
      return true
    } catch (error) {
      console.error("[v0] Signup error:", error)
      return false
    }
  },

  login: (email: string, password: string): boolean => {
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const user = users.find((u: User) => u.email === email && u.password === password)

      if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user))
        return true
      }
      return false
    } catch (error) {
      console.error("[v0] Login error:", error)
      return false
    }
  },

  logout: (): void => {
    localStorage.removeItem("currentUser")
  },

  getCurrentUser: (): User | null => {
    try {
      const user = localStorage.getItem("currentUser")
      return user ? JSON.parse(user) : null
    } catch (error) {
      console.error("[v0] Get current user error:", error)
      return null
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("currentUser")
  },
}

export const projectManager = {
  createProject: (
    project: Omit<Project, "id" | "createdAt" | "tableCount" | "queryCount" | "lastActivity">,
  ): Project => {
    try {
      const currentUser = fakeAuth.getCurrentUser()
      if (!currentUser) throw new Error("Not authenticated")

      const projects = JSON.parse(localStorage.getItem(`projects_${currentUser.email}`) || "[]")

      const newProject: Project = {
        ...project,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        tableCount: Math.floor(Math.random() * 20) + 5, // Simulated
        queryCount: Math.floor(Math.random() * 100) + 10, // Simulated
        lastActivity: new Date().toISOString(),
      }

      projects.push(newProject)
      localStorage.setItem(`projects_${currentUser.email}`, JSON.stringify(projects))
      return newProject
    } catch (error) {
      console.error("[v0] Create project error:", error)
      throw error
    }
  },

  getProjects: (): Project[] => {
    try {
      const currentUser = fakeAuth.getCurrentUser()
      if (!currentUser) return []

      return JSON.parse(localStorage.getItem(`projects_${currentUser.email}`) || "[]")
    } catch (error) {
      console.error("[v0] Get projects error:", error)
      return []
    }
  },

  getProject: (id: string): Project | null => {
    try {
      const projects = projectManager.getProjects()
      return projects.find((p) => p.id === id) || null
    } catch (error) {
      console.error("[v0] Get project error:", error)
      return null
    }
  },

  updateProject: (id: string, updates: Partial<Project>): boolean => {
    try {
      const currentUser = fakeAuth.getCurrentUser()
      if (!currentUser) return false

      const projects = projectManager.getProjects()
      const index = projects.findIndex((p) => p.id === id)

      if (index === -1) return false

      projects[index] = { ...projects[index], ...updates }
      localStorage.setItem(`projects_${currentUser.email}`, JSON.stringify(projects))
      return true
    } catch (error) {
      console.error("[v0] Update project error:", error)
      return false
    }
  },

  deleteProject: (id: string): boolean => {
    try {
      const currentUser = fakeAuth.getCurrentUser()
      if (!currentUser) return false

      const projects = projectManager.getProjects()
      const filtered = projects.filter((p) => p.id !== id)

      localStorage.setItem(`projects_${currentUser.email}`, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error("[v0] Delete project error:", error)
      return false
    }
  },

  testConnection: async (connectionString: string): Promise<boolean> => {
    // Simulate connection test
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return connectionString.length > 10 // Simple validation
  },
}
