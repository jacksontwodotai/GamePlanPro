import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, Calendar, Users, Filter, CheckCircle, AlertCircle,
  CalendarDays, Clock, MapPin, FileText, Settings
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useApi } from '../hooks/useApi'
import { ApiEvent } from '../lib/api'

interface CalendarExportButtonProps {
  events?: ApiEvent[]
  selectedEvents?: string[]
  teamId?: number
  variant?: 'button' | 'card'
  className?: string
}

interface ExportOptions {
  format: 'ical' | 'csv' | 'json'
  eventTypes: string[]
  dateRange: 'all' | '30days' | '90days' | '1year' | 'custom'
  startDate?: string
  endDate?: string
  includeDescription: boolean
  includeVenue: boolean
  includeTeams: boolean
  timezone: string
}

interface Team {
  id: number
  name: string
}

const formatConfig = {
  ical: {
    label: 'iCal (.ics)',
    description: 'Compatible with Google Calendar, Outlook, Apple Calendar',
    icon: Calendar,
    mimeType: 'text/calendar'
  },
  csv: {
    label: 'CSV (.csv)',
    description: 'Spreadsheet format for Excel, Google Sheets',
    icon: FileText,
    mimeType: 'text/csv'
  },
  json: {
    label: 'JSON (.json)',
    description: 'Machine-readable format for developers',
    icon: Settings,
    mimeType: 'application/json'
  }
}

const eventTypeOptions = ['Practice', 'Game', 'Meeting', 'Tournament', 'Other']

const dateRangeOptions = {
  all: 'All events',
  '30days': 'Next 30 days',
  '90days': 'Next 90 days',
  '1year': 'Next year',
  custom: 'Custom date range'
}

export default function CalendarExportButton({
  events,
  selectedEvents,
  teamId,
  variant = 'button',
  className = ''
}: CalendarExportButtonProps) {
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [teams, setTeams] = useState<Team[]>([])

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'ical',
    eventTypes: eventTypeOptions,
    dateRange: '90days',
    includeDescription: true,
    includeVenue: true,
    includeTeams: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  const { execute } = useApi()

  const handleExportClick = async () => {
    if (variant === 'button') {
      await performExport()
    } else {
      setShowExportDialog(true)
      if (teams.length === 0) {
        await fetchTeams()
      }
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await execute('/api/teams')
      if (response?.teams) {
        setTeams(response.teams)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const performExport = async () => {
    setExporting(true)
    setMessage(null)

    try {
      const requestBody: any = {
        format: exportOptions.format,
        event_types: exportOptions.eventTypes,
        date_range: exportOptions.dateRange,
        include_description: exportOptions.includeDescription,
        include_venue: exportOptions.includeVenue,
        include_teams: exportOptions.includeTeams,
        timezone: exportOptions.timezone
      }

      // Add date range if custom
      if (exportOptions.dateRange === 'custom') {
        requestBody.start_date = exportOptions.startDate
        requestBody.end_date = exportOptions.endDate
      }

      // Add team filter if specified
      if (teamId) {
        requestBody.team_id = teamId
      }

      // Add specific events if provided
      if (selectedEvents && selectedEvents.length > 0) {
        requestBody.event_ids = selectedEvents
      }

      const response = await execute('/api/schedule-communication/export-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response?.download_url) {
        // Create download link
        const link = document.createElement('a')
        link.href = response.download_url
        link.download = response.filename || `calendar-export.${exportOptions.format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setMessage({
          type: 'success',
          text: `Calendar exported successfully as ${formatConfig[exportOptions.format].label}`
        })

        setTimeout(() => {
          setMessage(null)
          setShowExportDialog(false)
        }, 2000)
      } else if (response?.content) {
        // Direct content download
        const blob = new Blob([response.content], {
          type: formatConfig[exportOptions.format].mimeType
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = response.filename || `calendar-export.${exportOptions.format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        setMessage({
          type: 'success',
          text: `Calendar exported successfully as ${formatConfig[exportOptions.format].label}`
        })

        setTimeout(() => {
          setMessage(null)
          setShowExportDialog(false)
        }, 2000)
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to export calendar'
      })
    } finally {
      setExporting(false)
    }
  }

  const updateEventTypes = (eventType: string, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      eventTypes: checked
        ? [...prev.eventTypes, eventType]
        : prev.eventTypes.filter(type => type !== eventType)
    }))
  }

  const getEventCount = (): number => {
    if (selectedEvents) {
      return selectedEvents.length
    }
    if (events) {
      return events.filter(event => {
        if (teamId && !event.team_ids.includes(teamId)) return false
        if (!exportOptions.eventTypes.includes(event.event_type)) return false
        return true
      }).length
    }
    return 0
  }

  if (variant === 'button') {
    return (
      <Button
        onClick={handleExportClick}
        disabled={exporting}
        className={`flex items-center space-x-2 ${className}`}
      >
        <Download className="h-4 w-4" />
        <span>{exporting ? 'Exporting...' : 'Export Calendar'}</span>
      </Button>
    )
  }

  return (
    <>
      <Card className={`cursor-pointer hover:shadow-md transition-shadow ${className}`} onClick={handleExportClick}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="h-5 w-5 text-green-600" />
            </div>
            <span>Export Calendar</span>
          </CardTitle>
          <CardDescription>
            Download events as iCal, CSV, or JSON for use in external calendar applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedEvents ? `${selectedEvents.length} selected events` : 'All matching events'}
            </div>
            <Button size="sm" className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Configuration Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Calendar</DialogTitle>
            <DialogDescription>
              Configure your calendar export settings
            </DialogDescription>
          </DialogHeader>

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
                <div className="flex items-center space-x-2">
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span>{message.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(formatConfig).map(([format, config]) => {
                  const Icon = config.icon
                  return (
                    <label
                      key={format}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        exportOptions.format === format
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={format}
                        checked={exportOptions.format === format}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'ical' | 'csv' | 'json' }))}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3 flex-1">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <div>
                          <div className="font-medium text-gray-900">{config.label}</div>
                          <div className="text-sm text-gray-500">{config.description}</div>
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Date Range Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <Select
                value={exportOptions.dateRange}
                onValueChange={(value: 'all' | '30days' | '90days' | '1year' | 'custom') =>
                  setExportOptions(prev => ({ ...prev, dateRange: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dateRangeOptions).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {exportOptions.dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={exportOptions.startDate || ''}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={exportOptions.endDate || ''}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Event Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Event Types</label>
              <div className="grid grid-cols-2 gap-3">
                {eventTypeOptions.map((eventType) => (
                  <label key={eventType} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.eventTypes.includes(eventType)}
                      onChange={(e) => updateEventTypes(eventType, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{eventType}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Include Additional Information</label>
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeDescription}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeDescription: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Event descriptions</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeVenue}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeVenue: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Venue information</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeTeams}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeTeams: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Team assignments</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <Select
                value={exportOptions.timezone}
                onValueChange={(value) => setExportOptions(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                    Local Time ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Export Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>Approximately {getEventCount()} events will be exported</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Format: {formatConfig[exportOptions.format].label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Timezone: {exportOptions.timezone}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              disabled={exporting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={performExport}
              disabled={exporting || exportOptions.eventTypes.length === 0}
              className="flex-1"
            >
              {exporting ? 'Exporting...' : 'Export Calendar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}