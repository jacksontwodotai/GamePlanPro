import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Calendar, Clock, MapPin, Users, AlertTriangle, Repeat, Settings, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

interface Team {
  id: string
  name: string
  organization: string
}

interface Venue {
  id: string
  name: string
  address?: string
}

interface Event {
  id?: string
  title: string
  description: string
  event_type: 'game' | 'practice' | 'tournament'
  start_time: string
  end_time: string
  venue_id: string
  team_ids: string[]
  is_recurring: boolean
  recurrence_rule?: string
  status?: 'scheduled' | 'completed' | 'cancelled'
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

interface EventFormProps {
  mode: 'create' | 'edit'
  event?: Event
  isModal?: boolean
  onSubmit: (eventData: EventFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const EventForm = ({ mode, event, isModal = false, onSubmit, onCancel, loading = false }: EventFormProps) => {
  const [teams, setTeams] = useState<Team[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    event_type: 'practice',
    start_time: '',
    end_time: '',
    venue_id: '',
    team_ids: [],
    is_recurring: false,
    recurrence_rule: ''
  })
  const [formErrors, setFormErrors] = useState<Partial<EventFormData>>({})

  // Pre-populate form data when editing
  useEffect(() => {
    if (mode === 'edit' && event) {
      setFormData({
        title: event.title,
        description: event.description,
        event_type: event.event_type,
        start_time: event.start_time,
        end_time: event.end_time,
        venue_id: event.venue_id,
        team_ids: event.team_ids,
        is_recurring: event.is_recurring,
        recurrence_rule: event.recurrence_rule || ''
      })
    }
  }, [mode, event])

  // Fetch teams and venues
  useEffect(() => {
    fetchTeams()
    fetchVenues()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (!response.ok) throw new Error('Failed to fetch teams')
      const data = await response.json()
      setTeams(data.teams || data)
    } catch (err) {
      console.error('Fetch teams error:', err)
    }
  }

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/venues')
      if (!response.ok) {
        throw new Error('Failed to fetch venues')
      }
      const venuesData = await response.json()
      setVenues(venuesData)
    } catch (err) {
      console.error('Error fetching venues:', err)
      // Fallback to empty array
      setVenues([])
    }
  }

  const validateForm = (data: EventFormData): boolean => {
    const errors: Partial<EventFormData> = {}

    // Required field validation
    if (!data.title.trim()) {
      errors.title = 'Event title is required'
    }
    if (!data.event_type) {
      errors.event_type = 'Event type is required'
    }
    if (!data.start_time) {
      errors.start_time = 'Start time is required'
    }
    if (!data.end_time) {
      errors.end_time = 'End time is required'
    }
    if (!data.venue_id) {
      errors.venue_id = 'Venue selection is required'
    }
    if (data.team_ids.length === 0) {
      errors.team_ids = 'At least one team must be selected'
    }

    // Time logic validation
    if (data.start_time && data.end_time) {
      const startDate = new Date(data.start_time)
      const endDate = new Date(data.end_time)

      if (endDate <= startDate) {
        errors.end_time = 'End time must be after start time'
      }

      if (startDate < new Date()) {
        errors.start_time = 'Start time cannot be in the past'
      }
    }

    // Recurrence rule validation
    if (data.is_recurring && !data.recurrence_rule.trim()) {
      errors.recurrence_rule = 'Recurrence rule is required for recurring events'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm(formData)) return

    try {
      await onSubmit(formData)
    } catch (err) {
      console.error('Form submission error:', err)
    }
  }

  const handleTeamToggle = (teamId: string) => {
    setFormData(prev => ({
      ...prev,
      team_ids: prev.team_ids.includes(teamId)
        ? prev.team_ids.filter(id => id !== teamId)
        : [...prev.team_ids, teamId]
    }))
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'game':
        return Users
      case 'practice':
        return Settings
      case 'tournament':
        return Plus
      default:
        return Calendar
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'game':
        return 'from-blue-600 to-blue-700'
      case 'practice':
        return 'from-green-600 to-green-700'
      case 'tournament':
        return 'from-purple-600 to-purple-700'
      default:
        return 'from-gray-600 to-gray-700'
    }
  }

  const formContent = (
    <div className="space-y-6">
      {/* Event Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-600" />
          Event Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Event Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter event title"
              className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                formErrors.title
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
              }`}
            />
            {formErrors.title && (
              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {formErrors.title}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Event Type *</label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value as EventFormData['event_type'] })}
              className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground transition-all duration-200 ${
                formErrors.event_type
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
              }`}
            >
              <option value="practice">Practice</option>
              <option value="game">Game</option>
              <option value="tournament">Tournament</option>
            </select>
            {formErrors.event_type && (
              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {formErrors.event_type}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Enter event description..."
            className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 resize-none"
          />
        </div>
      </div>

      {/* Date and Time */}
      <div className="space-y-4 pt-6 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" />
          Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Start Time *</label>
            <Input
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground transition-all duration-200 ${
                formErrors.start_time
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
              }`}
            />
            {formErrors.start_time && (
              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {formErrors.start_time}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">End Time *</label>
            <Input
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground transition-all duration-200 ${
                formErrors.end_time
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
              }`}
            />
            {formErrors.end_time && (
              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {formErrors.end_time}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Venue Selection */}
      <div className="space-y-4 pt-6 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-600" />
          Venue
        </h3>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Select Venue *</label>
          <select
            value={formData.venue_id}
            onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
            className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground transition-all duration-200 ${
              formErrors.venue_id
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
            }`}
          >
            <option value="">Select a venue...</option>
            {venues.map(venue => (
              <option key={venue.id} value={venue.id}>
                {venue.name} {venue.address && `- ${venue.address}`}
              </option>
            ))}
          </select>
          {formErrors.venue_id && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {formErrors.venue_id}
            </p>
          )}
        </div>
      </div>

      {/* Team Selection */}
      <div className="space-y-4 pt-6 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-600" />
          Teams
        </h3>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Select Teams *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-border rounded-lg p-3">
            {teams.map(team => (
              <label key={team.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.team_ids.includes(team.id)}
                  onChange={() => handleTeamToggle(team.id)}
                  className="rounded border-border focus:ring-orange-500"
                />
                <span className="text-sm text-foreground">{team.name}</span>
              </label>
            ))}
          </div>
          {formErrors.team_ids && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {formErrors.team_ids}
            </p>
          )}
        </div>
      </div>

      {/* Recurring Event */}
      <div className="space-y-4 pt-6 border-t border-border">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Repeat className="w-5 h-5 text-orange-600" />
          Recurrence
        </h3>
        <div className="space-y-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_recurring}
              onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked, recurrence_rule: e.target.checked ? formData.recurrence_rule : '' })}
              className="rounded border-border focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-foreground">This is a recurring event</span>
          </label>

          {formData.is_recurring && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Recurrence Rule *</label>
              <select
                value={formData.recurrence_rule}
                onChange={(e) => setFormData({ ...formData, recurrence_rule: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground transition-all duration-200 ${
                  formErrors.recurrence_rule
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                }`}
              >
                <option value="">Select recurrence pattern...</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Every 2 weeks</option>
                <option value="MONTHLY">Monthly</option>
              </select>
              {formErrors.recurrence_rule && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {formErrors.recurrence_rule}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent className="glass-card glass-card-hover max-w-4xl max-h-[90vh] overflow-y-auto animate-scale">
          <DialogHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${getEventTypeColor(formData.event_type)} rounded-xl flex items-center justify-center shadow-lg glow-border floating-element`}>
                {(() => {
                  const IconComponent = getEventTypeIcon(formData.event_type)
                  return <IconComponent className="w-6 h-6 text-white" />
                })()}
              </div>
            </div>
            <DialogTitle className="gradient-text text-3xl font-bold">
              {mode === 'create' ? 'Create New Event' : 'Edit Event'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              {mode === 'create' ? 'Fill in the details to schedule a new event' : 'Update the event information'}
            </DialogDescription>
          </DialogHeader>

          {formContent}

          <DialogFooter className="mt-8 pt-6 border-t border-border gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="px-6 py-3 border-2 border-border hover:bg-secondary transition-all duration-200"
            >
              Cancel
            </Button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              className={`bg-gradient-to-r ${getEventTypeColor(formData.event_type)} hover:opacity-90 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
            >
              <span>{loading ? (mode === 'create' ? 'Creating Event...' : 'Updating Event...') : (mode === 'create' ? 'Create Event' : 'Update Event')}</span>
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Standalone page mode
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className={`w-12 h-12 bg-gradient-to-r ${getEventTypeColor(formData.event_type)} rounded-xl flex items-center justify-center shadow-lg`}>
          {(() => {
            const IconComponent = getEventTypeIcon(formData.event_type)
            return <IconComponent className="w-6 h-6 text-white" />
          })()}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {mode === 'create' ? 'Create New Event' : 'Edit Event'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'create' ? 'Fill in the details to schedule a new event' : 'Update the event information'}
          </p>
        </div>
      </div>

      <div className="bg-background border border-border rounded-lg p-6">
        {formContent}

        <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onCancel}
            className="px-6 py-3"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className={`bg-gradient-to-r ${getEventTypeColor(formData.event_type)} hover:opacity-90 text-white px-8 py-3`}
          >
            {loading ? (mode === 'create' ? 'Creating Event...' : 'Updating Event...') : (mode === 'create' ? 'Create Event' : 'Update Event')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default EventForm