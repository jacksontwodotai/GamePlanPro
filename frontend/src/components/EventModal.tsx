import { useState, useEffect, useContext } from 'react'
import { EventSchedulerContext } from '../contexts/EventSchedulerContext'
import EventForm from './EventForm'

interface Event {
  id: string
  title: string
  description: string
  event_type: 'game' | 'practice' | 'tournament'
  start_time: string
  end_time: string
  venue_id: string
  team_ids: string[]
  is_recurring: boolean
  recurrence_rule?: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

interface EventFormData {
  title: string
  description: string
  event_type: 'game' | 'practice' | 'tournament'
  start_time: string
  end_time: string
  venue_id: string
  team_ids: string[]
  is_recurring: boolean
  recurrence_rule: string
}

const EventModal = () => {
  const context = useContext(EventSchedulerContext)
  const {
    modalOpen,
    modalMode,
    selectedEventId,
    closeEventModal,
    refreshEvents
  } = context || {}

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Fetch event data when editing
  useEffect(() => {
    if (modalMode === 'edit' && selectedEventId) {
      fetchEvent(selectedEventId)
    } else {
      setEvent(null)
    }
  }, [modalMode, selectedEventId])

  const fetchEvent = async (eventId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch event')
      }
      const eventData = await response.json()
      setEvent(eventData)
    } catch (err) {
      console.error('Fetch event error:', err)
      // Handle error - maybe show a toast or alert
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: EventFormData) => {
    try {
      setSubmitLoading(true)

      let response
      if (modalMode === 'create') {
        response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        })
      } else if (modalMode === 'edit' && selectedEventId) {
        response = await fetch(`/api/events/${selectedEventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        })
      } else {
        throw new Error('Invalid modal mode')
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save event')
      }

      // Success - close modal and refresh events
      closeEventModal && closeEventModal()
      refreshEvents && refreshEvents()

    } catch (err) {
      console.error('Submit event error:', err)
      // Handle error - maybe show a toast or alert
      throw err // Re-throw to let the form handle it
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleCancel = () => {
    closeEventModal && closeEventModal()
  }

  // Don't render if modal is not open, in view mode, or context is not available
  if (!modalOpen || !context || modalMode === 'view' || modalMode === null) {
    return null
  }

  // Show loading state while fetching event data
  if (loading && modalMode === 'edit') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="text-gray-700">Loading event...</span>
        </div>
      </div>
    )
  }

  return (
    <EventForm
      mode={modalMode || 'create'}
      event={event || undefined}
      isModal={true}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={submitLoading}
    />
  )
}

export default EventModal