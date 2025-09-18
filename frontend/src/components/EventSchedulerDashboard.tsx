import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { EventSchedulerProvider } from '../contexts/EventSchedulerContext'
import EventCalendarView from './EventCalendarView'
import EventErrorBoundary from './EventErrorBoundary'
import {
  Calendar,
  Plus,
  Filter,
  Download,
  ChevronLeft,
  Settings,
  List
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
        <div className="space-y-6">
          {/* Dashboard Header */}
          <Card className="border-zinc-200 shadow-xl bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">Event Scheduler</h1>
                  <p className="text-sm text-zinc-600 mt-1">
                    Manage games, practices, and tournaments
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* View Toggle */}
                <div className="flex items-center bg-zinc-100 rounded-lg p-1">
                  <Button
                    variant={isCalendarView ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => navigate('/events/calendar')}
                    className={isCalendarView ? 'bg-white shadow-sm' : ''}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar
                  </Button>
                  <Button
                    variant={isListView ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => navigate('/events/list')}
                    className={isListView ? 'bg-white shadow-sm' : ''}
                  >
                    <List className="h-4 w-4 mr-2" />
                    List
                  </Button>
                </div>

                {/* Filter Button */}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-zinc-100' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {showFilters && (
                    <span className="ml-2 text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                      2
                    </span>
                  )}
                </Button>

                {/* Export Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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

                {/* Settings */}
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>

                {/* Create Event */}
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-zinc-200">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Teams
                    </label>
                    <select className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option>All Teams</option>
                      <option>Team A</option>
                      <option>Team B</option>
                      <option>Team C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Venue
                    </label>
                    <select className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option>All Venues</option>
                      <option>Main Stadium</option>
                      <option>Training Field</option>
                      <option>Indoor Arena</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Event Type
                    </label>
                    <select className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option>All Types</option>
                      <option>Game</option>
                      <option>Practice</option>
                      <option>Tournament</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Date Range
                    </label>
                    <select className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option>This Month</option>
                      <option>Next 7 Days</option>
                      <option>Next 30 Days</option>
                      <option>Custom Range</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowFilters(false)
                    }}
                  >
                    Clear Filters
                  </Button>
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Breadcrumb Navigation */}
          {(isDetailsView || location.pathname.includes('/create') || location.pathname.includes('/edit')) && (
            <div className="flex items-center space-x-2 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/events')}
                className="text-zinc-600 hover:text-black"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Events
              </Button>
              <span className="text-zinc-400">/</span>
              <span className="text-zinc-700 font-medium">
                {location.pathname.includes('/create') && 'Create Event'}
                {location.pathname.includes('/edit') && 'Edit Event'}
                {isDetailsView && 'Event Details'}
              </span>
            </div>
          )}

          {/* Main Content Area */}
          <div className="min-h-[600px]">
            <Routes>
              <Route index element={<Navigate to="calendar" replace />} />
              <Route path="calendar" element={<EventCalendarView />} />
              <Route path="list" element={
                <Card className="border-zinc-200 shadow-xl bg-white p-6">
                  <div className="text-center py-12 text-zinc-500">
                    <List className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                    <p>Event List View</p>
                    <p className="text-sm mt-2">This view will show events in a list format</p>
                  </div>
                </Card>
              } />
              <Route path="details/:id" element={
                <Card className="border-zinc-200 shadow-xl bg-white p-6">
                  <div className="text-center py-12 text-zinc-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                    <p>Event Details</p>
                    <p className="text-sm mt-2">Detailed event information will be displayed here</p>
                  </div>
                </Card>
              } />
              <Route path="create" element={
                <Card className="border-zinc-200 shadow-xl bg-white p-6">
                  <div className="text-center py-12 text-zinc-500">
                    <Plus className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                    <p>Create New Event</p>
                    <p className="text-sm mt-2">Event creation form will be displayed here</p>
                  </div>
                </Card>
              } />
              <Route path="edit/:id" element={
                <Card className="border-zinc-200 shadow-xl bg-white p-6">
                  <div className="text-center py-12 text-zinc-500">
                    <Settings className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                    <p>Edit Event</p>
                    <p className="text-sm mt-2">Event editing form will be displayed here</p>
                  </div>
                </Card>
              } />
            </Routes>
          </div>
        </div>
      </EventErrorBoundary>
    </EventSchedulerProvider>
  )
}

export default EventSchedulerDashboard