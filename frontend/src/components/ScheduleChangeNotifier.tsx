import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Users, Calendar, Eye, RefreshCw, AlertCircle, CheckCircle,
  Mail, MessageSquare, Smartphone, Filter, Search, Clock
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useApi } from '../hooks/useApi'
import { ApiEvent } from '../lib/api'

interface NotificationTemplate {
  id: string
  name: string
  type: 'email' | 'sms' | 'push' | 'in_app'
  subject?: string
  body: string
  placeholders: Record<string, string>
  is_active: boolean
}

interface Team {
  id: number
  name: string
}

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  teams: number[]
}

interface ScheduleChangeNotifierProps {
  onBack?: () => void
}

const deliveryMethodConfig = {
  email: { label: 'Email', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-100' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-100' },
  push: { label: 'Push', icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-100' },
  in_app: { label: 'In-App', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100' }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
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

export default function ScheduleChangeNotifier({ onBack }: ScheduleChangeNotifierProps) {
  const [events, setEvents] = useState<ApiEvent[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form states
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [recipientType, setRecipientType] = useState<'team' | 'all' | 'custom'>('team')
  const [selectedTeams, setSelectedTeams] = useState<number[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>(['email'])
  const [templateId, setTemplateId] = useState<string>('')
  const [customMessage, setCustomMessage] = useState('')
  const [useTemplate, setUseTemplate] = useState(true)
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({})

  // Preview states
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState<{ subject?: string; body: string } | null>(null)

  // Filter states
  const [eventFilter, setEventFilter] = useState('')
  const [filteredEvents, setFilteredEvents] = useState<ApiEvent[]>([])

  const { execute } = useApi()

  useEffect(() => {
    fetchEvents()
    fetchTeams()
    fetchUsers()
    fetchTemplates()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, eventFilter])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const response = await execute('http://localhost:8000/api/events')
      if (response) {
        setEvents(Array.isArray(response) ? response : [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      setMessage({ type: 'error', text: 'Failed to fetch events' })
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await execute('http://localhost:8000/api/teams')
      if (response?.teams) {
        setTeams(response.teams)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await execute('http://localhost:8000/api/users')
      if (response?.users) {
        setUsers(response.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await execute('http://localhost:8000/api/notification-templates')
      if (response?.templates) {
        const activeTemplates = response.templates.filter((t: NotificationTemplate) => t.is_active)
        setTemplates(activeTemplates)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const filterEvents = () => {
    let filtered = events

    if (eventFilter) {
      const searchLower = eventFilter.toLowerCase()
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchLower) ||
        (event.description && event.description.toLowerCase().includes(searchLower)) ||
        event.event_type.toLowerCase().includes(searchLower)
      )
    }

    setFilteredEvents(filtered)
  }

  const getEventRecipients = (): User[] => {
    if (recipientType === 'all') {
      return users
    }

    const event = events.find(e => e.id === selectedEvent)
    if (!event) return []

    if (recipientType === 'team') {
      return users.filter(user =>
        user.teams.some(teamId => event.team_ids.includes(teamId)) ||
        selectedTeams.some(teamId => user.teams.includes(teamId))
      )
    }

    if (recipientType === 'custom') {
      return users.filter(user => selectedUsers.includes(user.id))
    }

    return []
  }

  const generatePreview = () => {
    const event = events.find(e => e.id === selectedEvent)
    if (!event) {
      setMessage({ type: 'error', text: 'Please select an event first' })
      return
    }

    let messageBody = ''
    let messageSubject = ''

    if (useTemplate && templateId) {
      const template = templates.find(t => t.id === templateId)
      if (template) {
        messageBody = template.body
        messageSubject = template.subject || ''
      }
    } else {
      messageBody = customMessage
    }

    // Substitute placeholders
    const substitutePlaceholders = (text: string): string => {
      let result = text

      // Built-in placeholders
      const builtInPlaceholders = {
        '{event_name}': event.name,
        '{event_type}': event.event_type,
        '{event_date}': new Date(event.start_time).toLocaleDateString(),
        '{event_time}': new Date(event.start_time).toLocaleTimeString(),
        '{venue_name}': event.venue?.name || 'TBD',
        '{current_date}': new Date().toLocaleDateString(),
        '{current_time}': new Date().toLocaleTimeString()
      }

      // Apply built-in placeholders
      Object.entries(builtInPlaceholders).forEach(([placeholder, value]) => {
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
      })

      // Apply custom placeholders
      Object.entries(placeholders).forEach(([key, value]) => {
        const placeholder = `{${key}}`
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
      })

      return result
    }

    const processedSubject = messageSubject ? substitutePlaceholders(messageSubject) : undefined
    const processedBody = substitutePlaceholders(messageBody)

    setPreviewContent({
      subject: processedSubject,
      body: processedBody
    })

    setShowPreview(true)
  }

  const sendNotifications = async () => {
    if (!selectedEvent) {
      setMessage({ type: 'error', text: 'Please select an event' })
      return
    }

    if (deliveryMethods.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one delivery method' })
      return
    }

    if (useTemplate && !templateId) {
      setMessage({ type: 'error', text: 'Please select a template' })
      return
    }

    if (!useTemplate && !customMessage.trim()) {
      setMessage({ type: 'error', text: 'Please enter a custom message' })
      return
    }

    const recipients = getEventRecipients()
    if (recipients.length === 0) {
      setMessage({ type: 'error', text: 'No recipients found for the selected criteria' })
      return
    }

    setSending(true)
    try {
      await execute('http://localhost:8000/api/schedule-communication/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEvent,
          recipient_type: recipientType,
          selected_teams: selectedTeams,
          selected_users: selectedUsers,
          delivery_methods: deliveryMethods,
          template_id: useTemplate ? templateId : undefined,
          custom_message: useTemplate ? undefined : customMessage,
          placeholders
        })
      })

      setMessage({
        type: 'success',
        text: `Notifications sent successfully to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}`
      })

      // Reset form
      setSelectedEvent('')
      setSelectedTeams([])
      setSelectedUsers([])
      setTemplateId('')
      setCustomMessage('')
      setPlaceholders({})
      setTimeout(() => setMessage(null), 5000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send notifications' })
    } finally {
      setSending(false)
    }
  }

  const clearMessage = () => {
    setMessage(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Send className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Schedule Change Notifications</h2>
            <p className="text-gray-600">Send notifications about schedule changes to team members</p>
          </div>
        </div>
      </div>

      {/* Message Display */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span>{message.text}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearMessage}>
                ×
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Select Event</span>
            </CardTitle>
            <CardDescription>Choose the event you want to send notifications about</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search events..."
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading events...</span>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEvent === event.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedEvent(event.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{event.name}</h4>
                        <p className="text-sm text-gray-500">
                          {event.event_type} • {new Date(event.start_time).toLocaleDateString()} • {event.venue?.name || 'TBD'}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.event_type === 'Game' ? 'bg-green-100 text-green-800' :
                        event.event_type === 'Practice' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.event_type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recipient Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Recipients</span>
            </CardTitle>
            <CardDescription>Configure who should receive the notification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Type</label>
              <Select value={recipientType} onValueChange={(value: 'team' | 'all' | 'custom') => setRecipientType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Event Teams</SelectItem>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="custom">Custom Selection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recipientType === 'team' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Teams</label>
                <Select value="" onValueChange={(value) => {
                  const teamId = parseInt(value)
                  if (!selectedTeams.includes(teamId)) {
                    setSelectedTeams([...selectedTeams, teamId])
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add teams..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTeams.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTeams.map((teamId) => {
                      const team = teams.find(t => t.id === teamId)
                      return (
                        <span key={teamId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {team?.name}
                          <button
                            onClick={() => setSelectedTeams(selectedTeams.filter(id => id !== teamId))}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {recipientType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Users</label>
                <Select value="" onValueChange={(value) => {
                  const userId = parseInt(value)
                  if (!selectedUsers.includes(userId)) {
                    setSelectedUsers([...selectedUsers, userId])
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add users..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.first_name} {user.last_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedUsers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedUsers.map((userId) => {
                      const user = users.find(u => u.id === userId)
                      return (
                        <span key={userId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {user?.first_name} {user?.last_name}
                          <button
                            onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Methods</label>
              <div className="space-y-2">
                {Object.entries(deliveryMethodConfig).map(([method, config]) => {
                  const Icon = config.icon
                  return (
                    <label key={method} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={deliveryMethods.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDeliveryMethods([...deliveryMethods, method])
                          } else {
                            setDeliveryMethods(deliveryMethods.filter(m => m !== method))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <div className={`p-1 rounded ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <span className="text-sm font-medium">{config.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Recipients: {getEventRecipients().length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Message Configuration</CardTitle>
          <CardDescription>Configure the notification message content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={useTemplate}
                onChange={() => setUseTemplate(true)}
                className="text-blue-600"
              />
              <span>Use Template</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={!useTemplate}
                onChange={() => setUseTemplate(false)}
                className="text-blue-600"
              />
              <span>Custom Message</span>
            </label>
          </div>

          {useTemplate ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {templateId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Placeholders</label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Placeholder key"
                      value=""
                      onChange={() => {}}
                    />
                    <Input
                      placeholder="Placeholder value"
                      value=""
                      onChange={() => {}}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Available: {'{event_name}'}, {'{event_type}'}, {'{event_date}'}, {'{event_time}'}, {'{venue_name}'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Message</label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your custom message. Use {placeholders} for dynamic content."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Available: {'{event_name}'}, {'{event_type}'}, {'{event_date}'}, {'{event_time}'}, {'{venue_name}'}
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={generatePreview}
              disabled={!selectedEvent || (useTemplate && !templateId) || (!useTemplate && !customMessage.trim())}
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </Button>

            <Button
              onClick={sendNotifications}
              disabled={sending || !selectedEvent || (useTemplate && !templateId) || (!useTemplate && !customMessage.trim())}
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>{sending ? 'Sending...' : 'Send Notifications'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Preview</DialogTitle>
            <DialogDescription>
              Preview of the notification message that will be sent
            </DialogDescription>
          </DialogHeader>

          {previewContent && (
            <div className="space-y-4">
              {previewContent.subject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm">{previewContent.subject}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm whitespace-pre-wrap">{previewContent.body}</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <Clock className="inline h-4 w-4 mr-1" />
                  This will be sent to {getEventRecipients().length} recipient{getEventRecipients().length !== 1 ? 's' : ''} via {deliveryMethods.join(', ')}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}