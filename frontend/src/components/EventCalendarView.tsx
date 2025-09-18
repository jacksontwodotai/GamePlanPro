import { useState, useContext } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, MapPin, Users } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { EventSchedulerContext } from '../contexts/EventSchedulerContext'

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

const EventCalendarView = () => {
  const context = useContext(EventSchedulerContext)
  const {
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    openEventModal,
    openEventDetails
  } = context || {}

  const [events] = useState<Event[]>([
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

  const handlePreviousMonth = () => {
    if (!currentDate || !setCurrentDate) return
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const handleNextMonth = () => {
    if (!currentDate || !setCurrentDate) return
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const handleDateClick = (day: number) => {
    if (!day || !currentDate || !setSelectedDate) return
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(newDate)
  }

  const getEventsForDate = (day: number | null) => {
    if (!day || !currentDate) return []
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(event => event.date === dateStr)
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (!context) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Loading calendar...</p>
      </div>
    )
  }

  const days = currentDate ? getDaysInMonth(currentDate) : []
  const today = new Date()
  const isToday = (day: number | null) => {
    if (!day) return false
    return (
      currentDate?.getFullYear() === today.getFullYear() &&
      currentDate?.getMonth() === today.getMonth() &&
      day === today.getDate()
    )
  }

  const isSelected = (day: number | null) => {
    if (!day || !selectedDate) return false
    return (
      currentDate?.getFullYear() === selectedDate.getFullYear() &&
      currentDate?.getMonth() === selectedDate.getMonth() &&
      day === selectedDate.getDate()
    )
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card className="border-zinc-200 shadow-xl bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CardTitle className="text-2xl font-bold text-black">
                {monthNames[currentDate?.getMonth() || 0]} {currentDate?.getFullYear() || new Date().getFullYear()}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousMonth}
                  className="h-8 w-8 border-zinc-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextMonth}
                  className="h-8 w-8 border-zinc-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode && setViewMode('month')}
                className={viewMode === 'month' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode && setViewMode('week')}
                className={viewMode === 'week' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode && setViewMode('day')}
                className={viewMode === 'day' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                Day
              </Button>
              <div className="h-4 w-px bg-zinc-300 mx-2" />
              <Button
                onClick={() => openEventModal && openEventModal('create')}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-zinc-200">
            {/* Week Day Headers */}
            {weekDays.map(day => (
              <div
                key={day}
                className="bg-zinc-50 p-3 text-center text-sm font-semibold text-zinc-700"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day)
              return (
                <div
                  key={index}
                  className={`
                    bg-white min-h-[100px] p-2 cursor-pointer transition-colors
                    ${!day ? 'bg-zinc-50' : ''}
                    ${isToday(day) ? 'bg-orange-50 ring-2 ring-orange-400' : ''}
                    ${isSelected(day) ? 'bg-blue-50 ring-2 ring-blue-400' : ''}
                    ${day && !isToday(day) && !isSelected(day) ? 'hover:bg-zinc-50' : ''}
                  `}
                  onClick={() => day && handleDateClick(day)}
                >
                  {day && (
                    <>
                      <div className={`
                        text-sm font-medium mb-1
                        ${isToday(day) ? 'text-orange-600' : 'text-zinc-700'}
                      `}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              openEventDetails && openEventDetails(event.id)
                            }}
                            className={`
                              text-xs p-1 rounded border cursor-pointer
                              transition-all hover:shadow-md
                              ${getEventTypeColor(event.type)}
                            `}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="truncate opacity-75">{event.time}</div>
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
              {events.length} events this month
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      {selectedDate && (
        <Card className="border-zinc-200 shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-orange-500" />
              Events for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getEventsForDate(selectedDate.getDate()).length > 0 ? (
                getEventsForDate(selectedDate.getDate()).map(event => (
                  <div
                    key={event.id}
                    className="p-4 border border-zinc-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                    onClick={() => openEventDetails && openEventDetails(event.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-black">{event.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${getEventTypeColor(event.type)}`}>
                            {event.type}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-zinc-600">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-zinc-400" />
                            {event.time}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-zinc-400" />
                            {event.venue}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-zinc-400" />
                            {event.teams.join(' vs ')}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEventModal && openEventModal('edit', event.id)
                        }}
                      >
                        Edit
                      </Button>
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
                    onClick={() => openEventModal && openEventModal('create')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EventCalendarView