import { createContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

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
}

interface Event {
  id: string
  title: string
  date: string
  time: string
  venue: string
  teams: string[]
  type: 'game' | 'practice' | 'tournament'
  status: 'scheduled' | 'completed' | 'cancelled'
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
  getEventById: (id: string) => Event | null
  openEventModal: (mode: ModalMode, eventId?: string) => void
  closeEventModal: () => void
  openEventDetails: (eventId: string) => void
  refreshEvents: () => void
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
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Championship Game',
      date: '2025-09-20',
      time: '14:00',
      venue: 'Main Stadium',
      teams: ['Team A', 'Team B'],
      type: 'game',
      status: 'scheduled'
    },
    {
      id: '2',
      title: 'Team Practice',
      date: '2025-09-19',
      time: '16:00',
      venue: 'Training Field',
      teams: ['Team C'],
      type: 'practice',
      status: 'scheduled'
    },
    {
      id: '3',
      title: 'Weekly Training',
      date: '2025-09-21',
      time: '10:00',
      venue: 'Practice Ground',
      teams: ['Team A'],
      type: 'practice',
      status: 'scheduled'
    },
    {
      id: '4',
      title: 'Tournament Finals',
      date: '2025-09-22',
      time: '15:30',
      venue: 'Championship Arena',
      teams: ['Team A', 'Team B', 'Team C'],
      type: 'tournament',
      status: 'scheduled'
    }
  ])

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

  const refreshEvents = useCallback(() => {
    // Placeholder for refreshing events from API
    // This will trigger a re-fetch of events in components that use this context
    console.log('Refreshing events...')
  }, [])

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
    getEventById,
    openEventModal,
    closeEventModal,
    openEventDetails,
    refreshEvents
  }

  return (
    <EventSchedulerContext.Provider value={value}>
      {children}
    </EventSchedulerContext.Provider>
  )
}