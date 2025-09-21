import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit3,
  Trash2,
  Eye,
  AlertTriangle
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog'
import { useApi } from '../hooks/useApi'

interface Event {
  id: string
  title: string
  description?: string
  event_type: 'game' | 'practice' | 'tournament'
  start_time: string
  end_time: string
  venue_id?: string
  venues?: {
    id: string
    name: string
    address?: string
    city?: string
    state?: string
  }
  created_by_user_id?: number
  is_recurring: boolean
  recurrence_rule?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

interface EventsResponse {
  events: Event[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

type ViewMode = 'month' | 'week' | 'day'

interface EventCalendarProps {
  className?: string
  onCreateEvent?: (date?: Date) => void
  onEditEvent?: (eventId: string) => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3
    }
  }
}

export default function EventCalendar({
  className = '',
  onCreateEvent,
  onEditEvent
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)

  const { data: eventsData, loading, error, execute: fetchEvents } = useApi<EventsResponse>()
  const { execute: deleteEvent, loading: deleting } = useApi()

  // Calculate date range for current view
  const getDateRange = useCallback(() => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    switch (viewMode) {
      case 'month':
        start.setDate(1)
        end.setMonth(end.getMonth() + 1, 0)
        break
      case 'week':
        const dayOfWeek = start.getDay()
        start.setDate(start.getDate() - dayOfWeek)
        end.setDate(start.getDate() + 6)
        break
      case 'day':
        // Same day
        break
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }, [currentDate, viewMode])

  // Fetch events for current date range
  const loadEvents = useCallback(async () => {
    try {
      const { start, end } = getDateRange()
      const params = new URLSearchParams({
        start_date_after: start,
        end_date_before: end + 'T23:59:59',
        limit: '100'
      })

      await fetchEvents(`/api/events?${params}`)
    } catch (err) {
      console.error('Failed to load events:', err)
    }
  }, [fetchEvents, getDateRange])

  // Load events when date range changes
  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Handle event deletion
  const handleDeleteEvent = async () => {
    if (!eventToDelete) return

    try {
      await deleteEvent(`/api/events/${eventToDelete}`, { method: 'DELETE' })
      setShowDeleteConfirm(false)
      setEventToDelete(null)
      setShowEventDetails(false)
      setSelectedEvent(null)
      await loadEvents() // Refresh events
    } catch (err) {
      console.error('Failed to delete event:', err)
    }
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    if (!eventsData?.events) return []

    const dateStr = date.toISOString().split('T')[0]
    return eventsData.events.filter(event => {
      const eventDate = new Date(event.start_time).toISOString().split('T')[0]
      return eventDate === dateStr
    })
  }

  // Get events for a specific hour
  const getEventsForHour = (date: Date, hour: number): Event[] => {
    const dayEvents = getEventsForDate(date)
    return dayEvents.filter(event => {
      const eventHour = new Date(event.start_time).getHours()
      return eventHour === hour
    })
  }

  // Event type color mapping
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'game':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
      case 'practice':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
      case 'tournament':
        return 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
    }
  }

  // Navigation handlers
  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1)
        break
      case 'week':
        newDate.setDate(newDate.getDate() - 7)
        break
      case 'day':
        newDate.setDate(newDate.getDate() - 1)
        break
    }
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1)
        break
      case 'week':
        newDate.setDate(newDate.getDate() + 7)
        break
      case 'day':
        newDate.setDate(newDate.getDate() + 1)
        break
    }
    setCurrentDate(newDate)
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)

    const week = []
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(startOfWeek)
      weekDay.setDate(startOfWeek.getDate() + i)
      week.push(weekDay)
    }
    return week
  }

  // Date comparison helpers
  const isToday = (date: Date | number | null) => {
    const today = new Date()
    if (typeof date === 'number') {
      return (
        currentDate.getFullYear() === today.getFullYear() &&
        currentDate.getMonth() === today.getMonth() &&
        date === today.getDate()
      )
    } else if (date instanceof Date) {
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      )
    }
    return false
  }

  const isSelected = (date: Date | number | null) => {
    if (!selectedDate) return false

    if (typeof date === 'number') {
      return (
        currentDate.getFullYear() === selectedDate.getFullYear() &&
        currentDate.getMonth() === selectedDate.getMonth() &&
        date === selectedDate.getDate()
      )
    } else if (date instanceof Date) {
      return (
        date.getFullYear() === selectedDate.getFullYear() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getDate() === selectedDate.getDate()
      )
    }
    return false
  }

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(newDate)
  }

  const handleEmptySlotClick = (date?: Date) => {
    if (onCreateEvent) {
      onCreateEvent(date)
    }
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const handleEditClick = (eventId: string) => {
    if (onEditEvent) {
      onEditEvent(eventId)
    }
    setShowEventDetails(false)
  }

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId)
    setShowDeleteConfirm(true)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (startTime: string, endTime: string) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }

  // Constants
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const days = getDaysInMonth(currentDate)
  const weekDays = getWeekDays(currentDate)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`space-y-6 ${className}`}
    >
      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Calendar Header */}
      <motion.div variants={itemVariants}>
        <Card className="border-zinc-200 shadow-lg bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {viewMode === 'month' && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                  {viewMode === 'week' && `Week of ${weekDays[0]?.toLocaleDateString()}`}
                  {viewMode === 'day' && currentDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevious}
                    className="h-8 w-8"
                    disabled={loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNext}
                    className="h-8 w-8"
                    disabled={loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className={viewMode === 'month' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  Month
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className={viewMode === 'week' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                  className={viewMode === 'day' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  Day
                </Button>
                <div className="h-4 w-px bg-zinc-300 mx-2" />
                <Button
                  onClick={() => handleEmptySlotClick()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Event
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading events...</span>
              </div>
            )}

            {!loading && (
              <>
                {/* Month View */}
                {viewMode === 'month' && (
                  <div className="grid grid-cols-7 gap-px bg-zinc-200 rounded-lg overflow-hidden">
                    {/* Week Day Headers */}
                    {weekDayNames.map(day => (
                      <div
                        key={day}
                        className="bg-zinc-50 p-3 text-center text-sm font-semibold text-zinc-700"
                      >
                        {day}
                      </div>
                    ))}

                    {/* Calendar Days */}
                    {days.map((day, index) => {
                      const dayEvents = day ? getEventsForDate(
                        new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                      ) : []

                      return (
                        <div
                          key={index}
                          className={`
                            bg-white min-h-[100px] p-2 cursor-pointer transition-all
                            ${!day ? 'bg-zinc-50' : ''}
                            ${isToday(day) ? 'bg-blue-50 ring-2 ring-blue-400' : ''}
                            ${isSelected(day) ? 'bg-green-50 ring-2 ring-green-400' : ''}
                            ${day && !isToday(day) && !isSelected(day) ? 'hover:bg-zinc-50' : ''}
                          `}
                          onClick={() => {
                            if (day) {
                              handleDateClick(day)
                              if (dayEvents.length === 0) {
                                handleEmptySlotClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
                              }
                            }
                          }}
                        >
                          {day && (
                            <>
                              <div className={`
                                text-sm font-medium mb-1
                                ${isToday(day) ? 'text-blue-600' : 'text-zinc-700'}
                              `}>
                                {day}
                              </div>
                              <div className="space-y-1">
                                {dayEvents.slice(0, 2).map(event => (
                                  <div
                                    key={event.id}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEventClick(event)
                                    }}
                                    className={`
                                      text-xs p-1 rounded border cursor-pointer
                                      transition-all hover:shadow-md
                                      ${getEventTypeColor(event.event_type)}
                                    `}
                                  >
                                    <div className="font-medium truncate">{event.title}</div>
                                    <div className="truncate opacity-75">{formatTime(event.start_time)}</div>
                                  </div>
                                ))}
                                {dayEvents.length > 2 && (
                                  <div className="text-xs text-zinc-500 text-center">
                                    +{dayEvents.length - 2} more
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Week View */}
                {viewMode === 'week' && (
                  <div className="grid grid-cols-8 gap-px bg-zinc-200 rounded-lg overflow-hidden">
                    {/* Time column header */}
                    <div className="bg-zinc-50 p-3 text-center text-sm font-semibold text-zinc-700">
                      Time
                    </div>
                    {/* Week day headers */}
                    {weekDays.map(date => (
                      <div
                        key={date.toISOString()}
                        className={`
                          bg-zinc-50 p-3 text-center text-sm font-semibold cursor-pointer transition-colors
                          ${isToday(date) ? 'bg-blue-100 text-blue-600' : 'text-zinc-700'}
                          ${isSelected(date) ? 'bg-green-100 text-green-600' : ''}
                        `}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div>{weekDayNames[date.getDay()]}</div>
                        <div className="text-lg font-bold">{date.getDate()}</div>
                      </div>
                    ))}

                    {/* Time slots */}
                    {Array.from({ length: 18 }, (_, i) => i + 6).map(hour => (
                      <React.Fragment key={hour}>
                        <div className="bg-white p-2 text-xs text-zinc-500 border-r border-zinc-200">
                          {hour}:00
                        </div>
                        {weekDays.map(date => {
                          const hourEvents = getEventsForHour(date, hour)
                          return (
                            <div
                              key={`${date.toISOString()}-${hour}`}
                              className={`
                                bg-white min-h-[40px] p-1 cursor-pointer transition-colors border-b border-zinc-100
                                ${isToday(date) ? 'bg-blue-50/30' : ''}
                                hover:bg-zinc-50
                              `}
                              onClick={() => {
                                setSelectedDate(date)
                                if (hourEvents.length === 0) {
                                  const clickDate = new Date(date)
                                  clickDate.setHours(hour, 0, 0, 0)
                                  handleEmptySlotClick(clickDate)
                                }
                              }}
                            >
                              {hourEvents.map(event => (
                                <div
                                  key={event.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEventClick(event)
                                  }}
                                  className={`
                                    text-xs p-1 rounded border cursor-pointer mb-1
                                    transition-all hover:shadow-md
                                    ${getEventTypeColor(event.event_type)}
                                  `}
                                >
                                  <div className="font-medium truncate">{event.title}</div>
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Day View */}
                {viewMode === 'day' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-px bg-zinc-200 rounded-lg overflow-hidden">
                      <div className="bg-zinc-50 p-2 text-sm font-semibold text-zinc-700">Time</div>
                      <div className="bg-zinc-50 p-2 text-sm font-semibold text-zinc-700">Events</div>

                      {Array.from({ length: 18 }, (_, i) => i + 6).map(hour => {
                        const hourEvents = getEventsForHour(currentDate, hour)

                        return (
                          <React.Fragment key={hour}>
                            <div className="bg-white p-3 text-sm text-zinc-600 border-r border-zinc-200">
                              {hour}:00
                            </div>
                            <div
                              className="bg-white min-h-[60px] p-2 cursor-pointer hover:bg-zinc-50 transition-colors"
                              onClick={() => {
                                if (hourEvents.length === 0) {
                                  const clickDate = new Date(currentDate)
                                  clickDate.setHours(hour, 0, 0, 0)
                                  handleEmptySlotClick(clickDate)
                                }
                              }}
                            >
                              {hourEvents.length > 0 ? (
                                <div className="space-y-2">
                                  {hourEvents.map(event => (
                                    <div
                                      key={event.id}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEventClick(event)
                                      }}
                                      className={`
                                        p-2 rounded border cursor-pointer
                                        transition-all hover:shadow-md
                                        ${getEventTypeColor(event.event_type)}
                                      `}
                                    >
                                      <div className="font-medium">{event.title}</div>
                                      <div className="text-sm opacity-75">{formatDuration(event.start_time, event.end_time)}</div>
                                      {event.venues && (
                                        <div className="text-sm opacity-75">{event.venues.name}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center text-zinc-400 text-sm py-4">
                                  Click to add event
                                </div>
                              )}
                            </div>
                          </React.Fragment>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300" />
                      <span className="text-zinc-600">Game</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-green-200 border border-green-300" />
                      <span className="text-zinc-600">Practice</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-purple-200 border border-purple-300" />
                      <span className="text-zinc-600">Tournament</span>
                    </div>
                  </div>
                  <div className="text-sm text-zinc-500">
                    {eventsData?.events?.length || 0} events {
                      viewMode === 'month' ? 'this month' :
                      viewMode === 'week' ? 'this week' :
                      'today'
                    }
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Selected Date Events */}
      {selectedDate && !loading && (
        <motion.div variants={itemVariants}>
          <Card className="border-zinc-200 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                Events for {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getEventsForDate(selectedDate).length > 0 ? (
                  getEventsForDate(selectedDate).map(event => (
                    <div
                      key={event.id}
                      className="p-4 border border-zinc-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getEventTypeColor(event.event_type)}`}>
                              {event.event_type}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-zinc-600">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-zinc-400" />
                              {formatDuration(event.start_time, event.end_time)}
                            </div>
                            {event.venues && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-zinc-400" />
                                {event.venues.name}
                                {event.venues.city && `, ${event.venues.city}`}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEventClick(event)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditClick(event.id)
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                    <p>No events scheduled for this date</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => handleEmptySlotClick(selectedDate)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Event Details Modal */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              Event Details
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-semibold">{selectedEvent.title}</h3>
                <span className={`text-sm px-3 py-1 rounded-full ${getEventTypeColor(selectedEvent.event_type)}`}>
                  {selectedEvent.event_type}
                </span>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  selectedEvent.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                  selectedEvent.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedEvent.status}
                </span>
              </div>

              {selectedEvent.description && (
                <p className="text-gray-600">{selectedEvent.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-zinc-400" />
                  <span>{formatDuration(selectedEvent.start_time, selectedEvent.end_time)}</span>
                </div>

                {selectedEvent.venues && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-zinc-400" />
                    <span>
                      {selectedEvent.venues.name}
                      {selectedEvent.venues.address && (
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedEvent.venues.address}
                          {selectedEvent.venues.city && `, ${selectedEvent.venues.city}`}
                          {selectedEvent.venues.state && `, ${selectedEvent.venues.state}`}
                        </div>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {selectedEvent.is_recurring && selectedEvent.recurrence_rule && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Recurring Event:</strong> {selectedEvent.recurrence_rule}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowEventDetails(false)}
            >
              Close
            </Button>
            {selectedEvent && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleEditClick(selectedEvent.id)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteClick(selectedEvent.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Event
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}