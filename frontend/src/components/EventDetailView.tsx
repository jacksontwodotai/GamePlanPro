import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  ArrowLeft,
  AlertTriangle,
  Repeat,
  Info,
  Shield
} from 'lucide-react'
import { motion } from 'framer-motion'
import { api, type ApiEvent } from '../lib/api'

interface Team {
  id: number
  name: string
  organization: string
  division?: string
  age_group?: string
}

interface EventDetailViewProps {
  eventId: string
  onEdit?: (eventId: string) => void
  onBack?: () => void
  className?: string
}

const EventDetailView = ({ eventId, onEdit, onBack, className = '' }: EventDetailViewProps) => {
  const [event, setEvent] = useState<ApiEvent | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEventDetails()
  }, [eventId])

  const fetchEventDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch event details
      const eventData = await api.fetchEvent(eventId)
      setEvent(eventData)

      // Fetch team details for the team IDs
      if (eventData.team_ids && eventData.team_ids.length > 0) {
        await fetchTeamDetails(eventData.team_ids)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load event details'
      setError(errorMessage)
      console.error('Error fetching event details:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamDetails = async (teamIds: number[]) => {
    try {
      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      const data = await response.json()
      const allTeams = data.teams || data

      // Filter teams to only include those in the event
      const eventTeams = allTeams.filter((team: Team) => teamIds.includes(team.id))
      setTeams(eventTeams)
    } catch (err) {
      console.error('Error fetching team details:', err)
      // Don't set error here as event details are more important
      setTeams([])
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'game':
        return 'from-blue-600 to-blue-700'
      case 'practice':
        return 'from-green-600 to-green-700'
      case 'meeting':
        return 'from-purple-600 to-purple-700'
      case 'tournament':
        return 'from-red-600 to-red-700'
      case 'other':
        return 'from-gray-600 to-gray-700'
      default:
        return 'from-gray-600 to-gray-700'
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'game':
        return Users
      case 'practice':
        return Calendar
      case 'meeting':
        return Info
      case 'tournament':
        return Shield
      default:
        return Calendar
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

  const formatRecurrenceRule = (rule: string) => {
    switch (rule.toUpperCase()) {
      case 'DAILY':
        return 'Daily'
      case 'WEEKLY':
        return 'Weekly'
      case 'BIWEEKLY':
        return 'Every 2 weeks'
      case 'MONTHLY':
        return 'Monthly'
      default:
        return rule
    }
  }

  const calculateNextOccurrence = (startTime: string, recurrenceRule: string) => {
    const baseDate = new Date(startTime)
    const now = new Date()

    if (baseDate > now) {
      return baseDate // Event hasn't occurred yet
    }

    let nextDate = new Date(baseDate)

    switch (recurrenceRule.toUpperCase()) {
      case 'DAILY':
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 1)
        }
        break
      case 'WEEKLY':
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 7)
        }
        break
      case 'BIWEEKLY':
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 14)
        }
        break
      case 'MONTHLY':
        while (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + 1)
        }
        break
      default:
        return null
    }

    return nextDate
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="glass-card p-6">
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full"
            />
            <span className="ml-3 text-gray-600">Loading event details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="glass-card p-6 border-red-500/20">
          <div className="flex items-center space-x-2 text-red-600 mb-4">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Error loading event</span>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex space-x-3">
            <Button
              onClick={fetchEventDetails}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Try Again
            </Button>
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="glass-card p-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event not found
            </h3>
            <p className="text-gray-500 mb-4">
              The requested event could not be found or may have been deleted.
            </p>
            {onBack && (
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Calendar
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const startDateTime = formatDateTime(event.start_time)
  const endDateTime = formatDateTime(event.end_time)
  const EventIcon = getEventTypeIcon(event.event_type)
  const nextOccurrence = event.is_recurring && event.recurrence_rule
    ? calculateNextOccurrence(event.start_time, event.recurrence_rule)
    : null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card glass-card-hover p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div className={`p-3 rounded-xl bg-gradient-to-r ${getEventTypeColor(event.event_type)} shadow-lg`}>
              <EventIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {event.name}
              </h1>
              <div className="flex items-center space-x-3 mt-2">
                <span className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full">
                  {event.event_type}
                </span>
                {event.is_recurring && (
                  <span className="text-sm px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-full flex items-center">
                    <Repeat className="h-3 w-3 mr-1" />
                    Recurring
                  </span>
                )}
              </div>
            </div>
          </div>

          {onEdit && (
            <Button
              onClick={() => onEdit(eventId)}
              className={`bg-gradient-to-r ${getEventTypeColor(event.event_type)} hover:opacity-90 text-white`}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {event.description}
            </p>
          </div>
        )}
      </motion.div>

      {/* Event Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card glass-card-hover p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Event Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date and Time */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Start Date</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{startDateTime.date}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Time</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {startDateTime.time} - {endDateTime.time}
                </p>
              </div>
            </div>
          </div>

          {/* Venue */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <MapPin className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Venue</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {event.venue?.name || 'TBD'}
                </p>
                {event.venue?.address && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {event.venue.address}
                    {event.venue.city && `, ${event.venue.city}`}
                    {event.venue.state && `, ${event.venue.state}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recurrence Information */}
      {event.is_recurring && event.recurrence_rule && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card glass-card-hover p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Repeat className="h-5 w-5 mr-2 text-purple-600" />
            Recurrence Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Pattern</p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {formatRecurrenceRule(event.recurrence_rule)}
                </p>
              </div>
            </div>

            {nextOccurrence && (
              <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Next Occurrence</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {formatDateTime(nextOccurrence.toISOString()).date}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Teams */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card glass-card-hover p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" />
          Participating Teams ({teams.length})
        </h2>

        {teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
              >
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800/30">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {team.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {team.organization}
                  </p>
                  {(team.division || team.age_group) && (
                    <div className="flex items-center space-x-2 mt-1">
                      {team.division && (
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                          {team.division}
                        </span>
                      )}
                      {team.age_group && (
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                          {team.age_group}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : event.team_ids && event.team_ids.length > 0 ? (
          <div className="text-center py-6">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {event.team_ids.length} team(s) assigned but details could not be loaded
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {event.team_ids.map((teamId) => (
                <span
                  key={teamId}
                  className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                >
                  Team ID: {teamId}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No teams assigned to this event
            </p>
          </div>
        )}
      </motion.div>

      {/* Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Event Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Created:</span>
            <span className="ml-2 text-gray-700 dark:text-gray-300">
              {new Date(event.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
            <span className="ml-2 text-gray-700 dark:text-gray-300">
              {new Date(event.updated_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default EventDetailView