import { createContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { api, convertApiEventToUIEvent, getDateRangeForView, type ApiEvent } from '../lib/api'

export type ViewMode = 'month' | 'week' | 'day'
export type ModalMode = 'create' | 'edit' | 'view'

interface EventFilters {
  teams?: string[]
  venues?: string[]
  types?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  teamId?: number
}

interface Event {
  id: string
  title: string
  date: string
  time: string
  endTime?: string
  venue: string
  teams: string[]
  type: 'practice' | 'game' | 'meeting' | 'tournament' | 'other'
  status: 'scheduled' | 'completed' | 'cancelled'
  description?: string
  isRecurring?: boolean
  recurrenceRule?: string
  venueDetails?: any
  teamIds?: number[]
}

interface EventSchedulerContextType {
  currentDate: Date
  setCurrentDate: (date: Date) => void
  selectedDate: Date | null
  setSelectedDate: (date: Date | null) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  filters: EventFilters
  setFilters: (filters: EventFilters) => void
  modalOpen: boolean
  modalMode: ModalMode | null
  selectedEventId: string | null
  events: Event[]
  setEvents: (events: Event[]) => void
  loading: boolean
  error: string | null
  getEventById: (id: string) => Event | null
  openEventModal: (mode: ModalMode, eventId?: string) => void
  closeEventModal: () => void
  openEventDetails: (eventId: string) => void
  refreshEvents: () => Promise<void>
  fetchEventsForCurrentView: () => Promise<void>
}

export const EventSchedulerContext = createContext<EventSchedulerContextType | null>(null)

interface EventSchedulerProviderProps {
  children: ReactNode
}

export const EventSchedulerProvider = ({ children }: EventSchedulerProviderProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [filters, setFilters] = useState<EventFilters>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openEventModal = useCallback((mode: ModalMode, eventId?: string) => {
    setModalMode(mode)
    setSelectedEventId(eventId || null)
    setModalOpen(true)
  }, [])

  const closeEventModal = useCallback(() => {
    setModalOpen(false)
    setModalMode(null)
    setSelectedEventId(null)
  }, [])

  const getEventById = useCallback((id: string): Event | null => {
    return events.find(event => event.id === id) || null
  }, [events])

  const openEventDetails = useCallback((eventId: string) => {
    openEventModal('view', eventId)
  }, [openEventModal])

  // Fetch events for current view based on date range and filters
  const fetchEventsForCurrentView = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const dateRange = getDateRangeForView(currentDate, viewMode)
      const apiFilters = {
        start_date_after: dateRange.start,
        end_date_before: dateRange.end,
        team_id: filters.teamId,
        limit: 1000 // Get plenty of events for the view
      }

      const apiEvents = await api.fetchEvents(apiFilters)
      const uiEvents = apiEvents.map(convertApiEventToUIEvent)
      setEvents(uiEvents)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch events'
      setError(errorMessage)
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }, [currentDate, viewMode, filters])

  const refreshEvents = useCallback(async () => {
    await fetchEventsForCurrentView()
  }, [fetchEventsForCurrentView])

  // Auto-fetch events when view changes
  useEffect(() => {
    fetchEventsForCurrentView()
  }, [fetchEventsForCurrentView])

  // Fetch events when date or view mode changes
  useEffect(() => {
    fetchEventsForCurrentView()
  }, [currentDate, viewMode, filters.teamId])

  const value: EventSchedulerContextType = {
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    modalOpen,
    modalMode,
    selectedEventId,
    events,
    setEvents,
    loading,
    error,
    getEventById,
    openEventModal,
    closeEventModal,
    openEventDetails,
    refreshEvents,
    fetchEventsForCurrentView
  }

  return (
    <EventSchedulerContext.Provider value={value}>
      {children}
    </EventSchedulerContext.Provider>
  )
}