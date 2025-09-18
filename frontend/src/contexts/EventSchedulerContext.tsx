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