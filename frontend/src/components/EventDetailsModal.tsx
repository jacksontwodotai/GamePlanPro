import { useState, useEffect, useContext } from 'react'
import { EventSchedulerContext } from '../contexts/EventSchedulerContext'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { X, Calendar, Clock, MapPin, Users, Edit, Trash2 } from 'lucide-react'

interface Event {
  id: string
  title: string
  description?: string
  event_type: 'game' | 'practice' | 'tournament'
  start_time: string
  end_time: string
  venue_id: string
  team_ids: string[]
  is_recurring: boolean
  recurrence_rule?: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

const EventDetailsModal = () => {
  const context = useContext(EventSchedulerContext)
  const {
    modalOpen,
    modalMode,
    selectedEventId,
    closeEventModal,
    openEventModal
  } = context || {}

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch event data when viewing
  useEffect(() => {
    if (modalMode === 'view' && selectedEventId) {
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
      // Handle error - close modal if event not found
      closeEventModal && closeEventModal()
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    if (selectedEventId && openEventModal) {
      openEventModal('edit', selectedEventId)
    }
  }

  const handleDelete = async () => {
    if (!selectedEventId || !confirm('Are you sure you want to delete this event?')) {
      return
    }

    try {
      const response = await fetch(`/api/events/${selectedEventId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      closeEventModal && closeEventModal()
      // Refresh events would typically be called here
    } catch (err) {
      console.error('Delete event error:', err)
      alert('Failed to delete event. Please try again.')
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'game':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'practice':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'tournament':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  // Don't render if modal is not open, not in view mode, or context is not available
  if (!modalOpen || modalMode !== 'view' || !context) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-700">Loading event details...</span>
          </div>
        ) : event ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-black">Event Details</h2>
                  <p className="text-sm text-zinc-500">View event information</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => closeEventModal && closeEventModal()}
                className="hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Title and Type */}
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-black">{event.title}</h1>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getEventTypeColor(event.event_type)}`}>
                    {event.event_type}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                {event.description && (
                  <p className="text-zinc-600">{event.description}</p>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-zinc-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Start Date</p>
                    <p className="text-sm text-zinc-600">{formatDateTime(event.start_time).date}</p>
                    <p className="text-sm text-zinc-600">{formatDateTime(event.start_time).time}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-zinc-50 rounded-lg">
                  <Clock className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">End Time</p>
                    <p className="text-sm text-zinc-600">{formatDateTime(event.end_time).date}</p>
                    <p className="text-sm text-zinc-600">{formatDateTime(event.end_time).time}</p>
                  </div>
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-center space-x-3 p-4 bg-zinc-50 rounded-lg">
                <MapPin className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-900">Venue</p>
                  <p className="text-sm text-zinc-600">{event.venue_id}</p>
                </div>
              </div>

              {/* Teams */}
              <div className="flex items-start space-x-3 p-4 bg-zinc-50 rounded-lg">
                <Users className="h-5 w-5 text-zinc-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-zinc-900">Teams</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {event.team_ids.map((teamId, index) => (
                      <span
                        key={teamId}
                        className="text-sm px-2 py-1 bg-white border border-zinc-200 rounded"
                      >
                        {teamId}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recurring Info */}
              {event.is_recurring && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Recurring Event</p>
                  {event.recurrence_rule && (
                    <p className="text-sm text-blue-700 mt-1">{event.recurrence_rule}</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-6 border-t border-zinc-200">
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
              </Button>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => closeEventModal && closeEventModal()}
                >
                  Close
                </Button>
                <Button
                  onClick={handleEdit}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-zinc-500">Event not found</p>
            <Button
              variant="outline"
              onClick={() => closeEventModal && closeEventModal()}
              className="mt-3"
            >
              Close
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default EventDetailsModal