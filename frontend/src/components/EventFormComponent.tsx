import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  MapPin,
  Repeat,
  AlertTriangle,
  Search,
  Check,
  X,
  Settings,
  Users,
  Trophy
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
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

interface Venue {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  capacity?: number
  description?: string
  is_active?: boolean
}

interface VenuesResponse {
  venues: Venue[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface Event {
  id: string
  title: string
  description?: string
  event_type: 'game' | 'practice' | 'tournament'
  start_time: string
  end_time: string
  venue_id?: string
  venues?: Venue
  created_by_user_id?: number
  is_recurring: boolean
  recurrence_rule?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

interface EventFormData {
  name: string
  description: string
  event_type: 'game' | 'practice' | 'tournament'
  start_time: string
  end_time: string
  venue_id: string
  created_by_user_id?: number
  is_recurring: boolean
  recurrence_rule: string
}

interface EventFormComponentProps {
  mode: 'create' | 'edit'
  eventId?: string
  initialDate?: Date
  onSuccess?: (event: Event) => void
  onCancel?: () => void
  isModal?: boolean
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

export default function EventFormComponent({
  mode = 'create',
  eventId,
  initialDate,
  onSuccess,
  onCancel,
  isModal = false
}: EventFormComponentProps) {
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    event_type: 'practice',
    start_time: '',
    end_time: '',
    venue_id: '',
    created_by_user_id: undefined,
    is_recurring: false,
    recurrence_rule: ''
  })

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EventFormData, string>>>({})
  const [venueSearch, setVenueSearch] = useState('')
  const [showVenueDropdown, setShowVenueDropdown] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // API hooks
  const { data: venuesData, loading: venuesLoading, execute: fetchVenues } = useApi<VenuesResponse>()
  const { data: eventData, loading: eventLoading, execute: fetchEvent } = useApi<Event>()
  const { loading: submitting, error: submitError, execute: submitEvent } = useApi<Event>()

  // Initialize form with initial date if provided
  useEffect(() => {
    if (initialDate && mode === 'create') {
      const startDateTime = new Date(initialDate)
      const endDateTime = new Date(initialDate)
      endDateTime.setHours(startDateTime.getHours() + 1)

      setFormData(prev => ({
        ...prev,
        start_time: startDateTime.toISOString().slice(0, 16),
        end_time: endDateTime.toISOString().slice(0, 16)
      }))
    }
  }, [initialDate, mode])

  // Fetch event data for edit mode
  useEffect(() => {
    if (mode === 'edit' && eventId) {
      fetchEvent(`/api/events/${eventId}`)
    }
  }, [mode, eventId, fetchEvent])

  // Populate form when event data is loaded
  useEffect(() => {
    if (eventData && mode === 'edit') {
      setFormData({
        name: eventData.title,
        description: eventData.description || '',
        event_type: eventData.event_type,
        start_time: new Date(eventData.start_time).toISOString().slice(0, 16),
        end_time: new Date(eventData.end_time).toISOString().slice(0, 16),
        venue_id: eventData.venue_id || '',
        created_by_user_id: eventData.created_by_user_id,
        is_recurring: eventData.is_recurring,
        recurrence_rule: eventData.recurrence_rule || ''
      })

      if (eventData.venues) {
        setVenueSearch(eventData.venues.name)
      }
    }
  }, [eventData, mode])

  // Fetch venues
  useEffect(() => {
    fetchVenues('/api/venues?limit=100')
  }, [fetchVenues])

  // Filter venues based on search
  const filteredVenues = venuesData?.venues?.filter(venue =>
    venue.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
    venue.city?.toLowerCase().includes(venueSearch.toLowerCase()) ||
    venue.address?.toLowerCase().includes(venueSearch.toLowerCase())
  ) || []

  // Validation
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof EventFormData, string>> = {}

    // Required fields
    if (!formData.name.trim()) {
      errors.name = 'Event name is required'
    }
    if (!formData.event_type) {
      errors.event_type = 'Event type is required'
    }
    if (!formData.start_time) {
      errors.start_time = 'Start time is required'
    }
    if (!formData.end_time) {
      errors.end_time = 'End time is required'
    }

    // Time validation
    if (formData.start_time && formData.end_time) {
      const startDate = new Date(formData.start_time)
      const endDate = new Date(formData.end_time)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        errors.start_time = 'Invalid date format'
      } else {
        if (endDate <= startDate) {
          errors.end_time = 'End time must be after start time'
        }
        if (startDate < new Date() && mode === 'create') {
          errors.start_time = 'Start time cannot be in the past'
        }
      }
    }

    // Recurring event validation
    if (formData.is_recurring && !formData.recurrence_rule.trim()) {
      errors.recurrence_rule = 'Recurrence rule is required for recurring events'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const eventPayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        event_type: formData.event_type,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        venue_id: formData.venue_id || undefined,
        created_by_user_id: formData.created_by_user_id,
        is_recurring: formData.is_recurring,
        recurrence_rule: formData.is_recurring ? formData.recurrence_rule : undefined
      }

      let result: Event
      if (mode === 'create') {
        result = await submitEvent('/api/events', {
          method: 'POST',
          body: eventPayload
        })
        setSuccessMessage('Event created successfully!')
      } else {
        result = await submitEvent(`/api/events/${eventId}`, {
          method: 'PUT',
          body: eventPayload
        })
        setSuccessMessage('Event updated successfully!')
      }

      if (onSuccess) {
        onSuccess(result)
      }

      // Reset form if creating
      if (mode === 'create') {
        setFormData({
          name: '',
          description: '',
          event_type: 'practice',
          start_time: '',
          end_time: '',
          venue_id: '',
          created_by_user_id: undefined,
          is_recurring: false,
          recurrence_rule: ''
        })
        setVenueSearch('')
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)

    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  // Handle venue selection
  const handleVenueSelect = (venue: Venue) => {
    setFormData(prev => ({ ...prev, venue_id: venue.id }))
    setVenueSearch(venue.name)
    setShowVenueDropdown(false)
  }

  // Get event type icon and color
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'game':
        return Users
      case 'practice':
        return Settings
      case 'tournament':
        return Trophy
      default:
        return Calendar
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'game':
        return 'bg-blue-600 hover:bg-blue-700'
      case 'practice':
        return 'bg-green-600 hover:bg-green-700'
      case 'tournament':
        return 'bg-purple-600 hover:bg-purple-700'
      default:
        return 'bg-gray-600 hover:bg-gray-700'
    }
  }

  const EventTypeIcon = getEventTypeIcon(formData.event_type)

  const formContent = (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Success Message */}
      {successMessage && (
        <motion.div variants={itemVariants}>
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Error Message */}
      {submitError && (
        <motion.div variants={itemVariants}>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {submitError}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Basic Information */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Event Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Event Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter event name"
                  className={formErrors.name ? 'border-red-500 focus:border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Event Type *
                </label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    event_type: e.target.value as EventFormData['event_type']
                  }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.event_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="practice">Practice</option>
                  <option value="game">Game</option>
                  <option value="tournament">Tournament</option>
                </select>
                {formErrors.event_type && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {formErrors.event_type}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Enter event description (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Schedule */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-green-600" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Start Time *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className={formErrors.start_time ? 'border-red-500 focus:border-red-500' : ''}
                />
                {formErrors.start_time && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {formErrors.start_time}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  End Time *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className={formErrors.end_time ? 'border-red-500 focus:border-red-500' : ''}
                />
                {formErrors.end_time && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {formErrors.end_time}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Venue Selection */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-orange-600" />
              Venue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Search and Select Venue
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={venueSearch}
                    onChange={(e) => {
                      setVenueSearch(e.target.value)
                      setShowVenueDropdown(true)
                      if (!e.target.value) {
                        setFormData(prev => ({ ...prev, venue_id: '' }))
                      }
                    }}
                    onFocus={() => setShowVenueDropdown(true)}
                    placeholder="Search venues by name, city, or address..."
                    className="pl-10"
                  />
                  {formData.venue_id && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, venue_id: '' }))
                        setVenueSearch('')
                        setShowVenueDropdown(true)
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Venue Dropdown */}
                {showVenueDropdown && venueSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {venuesLoading ? (
                      <div className="p-3 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    ) : filteredVenues.length > 0 ? (
                      filteredVenues.map(venue => (
                        <div
                          key={venue.id}
                          onClick={() => handleVenueSelect(venue)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{venue.name}</div>
                          {venue.address && (
                            <div className="text-sm text-gray-500">
                              {venue.address}
                              {venue.city && `, ${venue.city}`}
                              {venue.state && `, ${venue.state}`}
                            </div>
                          )}
                          {venue.capacity && (
                            <div className="text-sm text-gray-500">
                              Capacity: {venue.capacity}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">
                        No venues found matching "{venueSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected venue display */}
              {formData.venue_id && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center text-green-800">
                    <Check className="h-4 w-4 mr-2" />
                    <span className="font-medium">Venue selected: {venueSearch}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recurring Event */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Repeat className="h-5 w-5 mr-2 text-purple-600" />
              Recurrence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    is_recurring: e.target.checked,
                    recurrence_rule: e.target.checked ? prev.recurrence_rule : ''
                  }))}
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  This is a recurring event
                </span>
              </label>

              {formData.is_recurring && (
                <div className="space-y-2 pl-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Recurrence Pattern *
                  </label>
                  <select
                    value={formData.recurrence_rule}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurrence_rule: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.recurrence_rule ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select recurrence pattern...</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Every 2 weeks</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                  {formErrors.recurrence_rule && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {formErrors.recurrence_rule}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Form Actions */}
      <motion.div variants={itemVariants} className="flex justify-end space-x-4 pt-6">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={submitting || eventLoading}
          className={`${getEventTypeColor(formData.event_type)} text-white flex items-center`}
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            <>
              <EventTypeIcon className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Create Event' : 'Update Event'}
            </>
          )}
        </Button>
      </motion.div>
    </motion.form>
  )

  // Handle click outside to close venue dropdown
  useEffect(() => {
    const handleClickOutside = () => setShowVenueDropdown(false)
    if (showVenueDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showVenueDropdown])

  if (isModal) {
    return (
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className={`w-12 h-12 ${getEventTypeColor(formData.event_type)} rounded-full flex items-center justify-center shadow-lg`}>
                <EventTypeIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              {mode === 'create' ? 'Create New Event' : 'Edit Event'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {mode === 'create' ? 'Fill in the details to schedule a new event' : 'Update the event information'}
            </DialogDescription>
          </DialogHeader>

          {eventLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading event...</span>
            </div>
          ) : (
            formContent
          )}
        </DialogContent>
      </Dialog>
    )
  }

  // Standalone page mode
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className={`w-12 h-12 ${getEventTypeColor(formData.event_type)} rounded-full flex items-center justify-center shadow-lg`}>
            <EventTypeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {mode === 'create' ? 'Create New Event' : 'Edit Event'}
            </h1>
            <p className="text-gray-600">
              {mode === 'create' ? 'Fill in the details to schedule a new event' : 'Update the event information'}
            </p>
          </div>
        </div>
      </div>

      {eventLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading event...</span>
        </div>
      ) : (
        formContent
      )}
    </div>
  )
}