// Connection state management utility
const CONNECTION_STATE_KEY = 'db_connection_state'

interface ConnectionState {
    projectId: number
    isConnected: boolean
    timestamp: number
}

export const connectionStateManager = {
    // Get connection state for a project
    getConnectionState: (projectId: number): boolean => {
        if (typeof window === 'undefined') return false

        try {
            const stored = localStorage.getItem(CONNECTION_STATE_KEY)
            if (!stored) return false

            const state: ConnectionState = JSON.parse(stored)

            // Check if it's for the same project and not too old (1 hour)
            const isValid = state.projectId === projectId &&
                (Date.now() - state.timestamp) < 3600000

            return isValid ? state.isConnected : false
        } catch {
            return false
        }
    },

    // Set connection state for a project
    setConnectionState: (projectId: number, isConnected: boolean) => {
        if (typeof window === 'undefined') return

        const state: ConnectionState = {
            projectId,
            isConnected,
            timestamp: Date.now()
        }

        localStorage.setItem(CONNECTION_STATE_KEY, JSON.stringify(state))
    },

    // Clear connection state
    clearConnectionState: () => {
        if (typeof window === 'undefined') return
        localStorage.removeItem(CONNECTION_STATE_KEY)
    }
}
