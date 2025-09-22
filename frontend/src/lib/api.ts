// API Configuration and Helper Functions
const API_BASE_URL = 'http://localhost:8000/api'

// Import conflict detection types
import type { ConflictCheckRequest, ConflictResponse } from '../types/conflicts'

export interface ApiEvent {
  id: string
  name: string
  description?: string
  event_type: 'Practice' | 'Game' | 'Meeting' | 'Tournament' | 'Other'
  start_time: string
  end_time: string
  venue_id?: string
  venue?: {
    id: string
    name: string
    address?: string
    city?: string
    state?: string
  }
  is_recurring: boolean
  recurrence_rule?: string
  created_by_user_id: number
  created_at: string
  updated_at: string
  team_ids: number[]
}

export interface EventFilters {
  event_type?: 'Practice' | 'Game' | 'Meeting' | 'Tournament' | 'Other'
  start_date_after?: string
  end_date_before?: string
  venue_id?: string
  team_id?: number
  skip?: number
  limit?: number
}

// Mock auth token for now - in production this would come from auth context
const getAuthHeaders = () => ({
  'Authorization': 'Bearer mock-token',
  'Content-Type': 'application/json'
})

export const api = {
  async fetchEvents(filters: EventFilters = {}): Promise<ApiEvent[]> {
    const queryParams = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })

    const url = `${API_BASE_URL}/events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

    try {
      const response = await fetch(url, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching events:', error)
      throw error
    }
  },

  async fetchEvent(eventId: string): Promise<ApiEvent> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching event:', error)
      throw error
    }
  },

  async createEvent(eventData: Partial<ApiEvent>): Promise<ApiEvent> {
    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(eventData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  },

  async updateEvent(eventId: string, eventData: Partial<ApiEvent>): Promise<ApiEvent> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(eventData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  },

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  },

  // Conflict Detection API methods
  async checkConflicts(request: ConflictCheckRequest): Promise<ConflictResponse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/scheduling/conflicts/check`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error checking conflicts:', error)
      throw error
    }
  },

  async getConflicts(params: {
    start_date_after?: string
    end_date_before?: string
    venue_id?: string
    team_id?: number
    limit?: number
    offset?: number
  } = {}): Promise<{
    conflicts: ConflictResponse[]
    total: number
    limit: number
    offset: number
    has_next: boolean
    has_prev: boolean
  }> {
    try {
      const queryParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })

      const url = `${API_BASE_URL}/scheduling/conflicts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

      const response = await fetch(url, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching conflicts:', error)
      throw error
    }
  },

  async getConflictSummary(): Promise<{
    total_conflicts: number
    resolved_conflicts: number
    unresolved_conflicts: number
    venue_conflicts: number
    team_conflicts: number
    resolution_rate: number
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/scheduling/conflicts/summary`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching conflict summary:', error)
      throw error
    }
  }
}

// Helper function to convert API event to UI event format
export const convertApiEventToUIEvent = (apiEvent: ApiEvent) => ({
  id: apiEvent.id,
  title: apiEvent.name,
  date: apiEvent.start_time.split('T')[0], // Extract date part
  time: new Date(apiEvent.start_time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }),
  endTime: new Date(apiEvent.end_time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }),
  venue: apiEvent.venue?.name || 'TBD',
  teams: [], // This would need team data from API
  type: apiEvent.event_type.toLowerCase() as 'practice' | 'game' | 'meeting' | 'tournament' | 'other',
  status: 'scheduled' as const,
  description: apiEvent.description,
  isRecurring: apiEvent.is_recurring,
  recurrenceRule: apiEvent.recurrence_rule,
  venueDetails: apiEvent.venue,
  teamIds: apiEvent.team_ids
})

// Helper function to get date range for calendar view
export const getDateRangeForView = (currentDate: Date, viewMode: 'month' | 'week' | 'day') => {
  const start = new Date(currentDate)
  const end = new Date(currentDate)

  switch (viewMode) {
    case 'month':
      start.setDate(1)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
      break
    case 'week':
      const dayOfWeek = start.getDay()
      start.setDate(start.getDate() - dayOfWeek)
      end.setDate(start.getDate() + 6)
      break
    case 'day':
      // For day view, we just fetch events for that day
      end.setDate(end.getDate())
      break
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  }
}