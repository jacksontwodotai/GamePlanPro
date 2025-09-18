import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom'
import { EventSchedulerProvider } from '../contexts/EventSchedulerContext'
import EventCalendarView from './EventCalendarView'
import EventErrorBoundary from './EventErrorBoundary'
import EventModal from './EventModal'
import EventDetailsModal from './EventDetailsModal'
import EventForm from './EventForm'
import {
  Calendar,
  Plus,
  Filter,
  Download,
  ChevronLeft,
  Settings,
  List,
  Sparkles
} from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'

// Standalone Create Event Page
const CreateEventPage = () => {
  const navigate = useNavigate()

  const handleSubmit = async (formData: any) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create event')
      }

      // Success - navigate back to calendar
      navigate('/events/calendar')
    } catch (err) {
      console.error('Create event error:', err)
      throw err // Re-throw to let the form handle it
    }
  }

  const handleCancel = () => {
    navigate('/events/calendar')
  }

  return (
    <EventForm
      mode="create"
      isModal={false}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  )
}

// Standalone Edit Event Page
const EditEventPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchEvent(id)
    }
  }, [id])

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
      // Navigate back if event not found
      navigate('/events/calendar')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: any) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update event')
      }

      // Success - navigate back to calendar
      navigate('/events/calendar')
    } catch (err) {
      console.error('Update event error:', err)
      throw err // Re-throw to let the form handle it
    }
  }

  const handleCancel = () => {
    navigate('/events/calendar')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="text-gray-700">Loading event...</span>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <Calendar className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
        <p>Event not found</p>
        <Button
          variant="outline"
          onClick={() => navigate('/events/calendar')}
          className="mt-3"
        >
          Back to Calendar
        </Button>
      </div>
    )
  }

  return (
    <EventForm
      mode="edit"
      event={event}
      isModal={false}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  )
}

const EventSchedulerDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showFilters, setShowFilters] = useState(false)

  const handleExport = (format: string) => {
    console.log(`Exporting events as ${format}`)
  }

  const isCalendarView = location.pathname.includes('/calendar')
  const isListView = location.pathname.includes('/list')
  const isDetailsView = location.pathname.includes('/details')

  return (
    <EventSchedulerProvider>
      <EventErrorBoundary>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen relative overflow-hidden"
        >
          {/* Animated Background Elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-gray-200/20 to-gray-400/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -100, 0],
                y: [0, 100, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-gray-300/20 to-gray-500/20 rounded-full blur-3xl"
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Dashboard Header */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="glass-card glass-card-hover p-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-lg"
                  >
                    <Calendar className="h-7 w-7 text-white" />
                  </motion.div>
                  <div>
                    <motion.h1
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        delay: 0.2
                      }}
                      className="text-5xl font-black mb-2"
                    >
                      <span className="gradient-text">Event Scheduler</span>
                    </motion.h1>
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-gray-600 dark:text-gray-400 text-lg"
                    >
                      Manage games, practices, and tournaments
                    </motion.p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* View Toggle */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 border border-gray-200/50 dark:border-gray-700/50"
                  >
                    <Button
                      variant={isCalendarView ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => navigate('/events/calendar')}
                      className={isCalendarView ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Calendar
                    </Button>
                    <Button
                      variant={isListView ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => navigate('/events/list')}
                      className={isListView ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                    >
                      <List className="h-4 w-4 mr-2" />
                      List
                    </Button>
                  </motion.div>

                  {/* Filter Button */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-800/70 ${showFilters ? 'bg-gray-100/70' : ''}`}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {showFilters && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-2 text-xs bg-gradient-to-r from-gray-700 to-gray-900 text-white px-1.5 py-0.5 rounded-full"
                        >
                          2
                        </motion.span>
                      )}
                    </Button>
                  </motion.div>

                  {/* Export Menu */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-800/70">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card border-gray-200/50 dark:border-gray-700/50">
                        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleExport('pdf')}>
                          Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('csv')}>
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('ics')}>
                          Export as Calendar (ICS)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>

                  {/* Settings */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Button variant="outline" size="icon" className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-800/70">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </motion.div>

                  {/* Create Event */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button className="button-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      <span>Create Event</span>
                    </button>
                  </motion.div>
                </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50"
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-4 gap-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Teams
                      </label>
                      <select className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200">
                        <option>All Teams</option>
                        <option>Team A</option>
                        <option>Team B</option>
                        <option>Team C</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Venue
                      </label>
                      <select className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200">
                        <option>All Venues</option>
                        <option>Main Stadium</option>
                        <option>Training Field</option>
                        <option>Indoor Arena</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Event Type
                      </label>
                      <select className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200">
                        <option>All Types</option>
                        <option>Game</option>
                        <option>Practice</option>
                        <option>Tournament</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date Range
                      </label>
                      <select className="w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200">
                        <option>This Month</option>
                        <option>Next 7 Days</option>
                        <option>Next 30 Days</option>
                        <option>Custom Range</option>
                      </select>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-between mt-4"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowFilters(false)
                      }}
                      className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                    >
                      Clear Filters
                    </Button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="button-primary !py-2 !px-4 !text-sm"
                    >
                      <span>Apply Filters</span>
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Breadcrumb Navigation */}
          {(isDetailsView || location.pathname.includes('/create') || location.pathname.includes('/edit')) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-2 text-sm"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/events')}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Events
              </Button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {location.pathname.includes('/create') && 'Create Event'}
                {location.pathname.includes('/edit') && 'Edit Event'}
                {isDetailsView && 'Event Details'}
              </span>
            </motion.div>
          )}

          {/* Main Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="min-h-[600px]"
          >
            <Routes>
              <Route index element={<Navigate to="calendar" replace />} />
              <Route path="calendar" element={<EventCalendarView />} />
              <Route path="list" element={
                <div className="glass-card glass-card-hover p-6">
                  <div className="text-center py-12 text-gray-500">
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <List className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">Event List View</h3>
                    <p className="text-sm mt-2">This view will show events in a list format</p>
                  </div>
                </div>
              } />
              <Route path="details/:id" element={
                <div className="glass-card glass-card-hover p-6">
                  <div className="text-center py-12 text-gray-500">
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">Event Details</h3>
                    <p className="text-sm mt-2">Detailed event information will be displayed here</p>
                  </div>
                </div>
              } />
              <Route path="create" element={<CreateEventPage />} />
              <Route path="edit/:id" element={<EditEventPage />} />
            </Routes>
          </motion.div>

          {/* Event Modals */}
          <EventModal />
          <EventDetailsModal />
          </div>
        </motion.div>
      </EventErrorBoundary>
    </EventSchedulerProvider>
  )
}

export default EventSchedulerDashboard