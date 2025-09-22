import React from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle
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
import type {
  ConflictResponse,
  ConflictDisplayProps
} from '../types/conflicts'
import {
  getConflictSeverityInfo,
  formatConflictType
} from '../types/conflicts'

const ConflictItemCard: React.FC<{ conflict: ConflictResponse }> = ({ conflict }) => {
  const severityInfo = getConflictSeverityInfo(conflict.severity)

  const getSeverityIcon = () => {
    switch (severityInfo.label) {
      case 'Critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'High':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'Medium':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getSeverityBorderColor = () => {
    switch (severityInfo.label) {
      case 'Critical':
        return 'border-red-500'
      case 'High':
        return 'border-red-400'
      case 'Medium':
        return 'border-orange-400'
      default:
        return 'border-yellow-400'
    }
  }

  const getSeverityBgColor = () => {
    switch (severityInfo.label) {
      case 'Critical':
        return 'bg-red-50'
      case 'High':
        return 'bg-red-50'
      case 'Medium':
        return 'bg-orange-50'
      default:
        return 'bg-yellow-50'
    }
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const primaryEvent = formatDateTime(conflict.primary_event.start_time)
  const conflictingEvent = formatDateTime(conflict.conflicting_event.start_time)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-2 ${getSeverityBorderColor()} ${getSeverityBgColor()}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getSeverityIcon()}
              <span className="text-lg font-semibold">
                {formatConflictType(conflict.conflict_type)}
              </span>
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-full bg-${severityInfo.color}-100 text-${severityInfo.color}-800`}>
              {severityInfo.label} Priority
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Conflict Description */}
          <div className="text-gray-700 bg-white p-3 rounded-md border">
            <p className="font-medium mb-1">Conflict Details:</p>
            <p>{conflict.description}</p>
          </div>

          {/* Resource Information */}
          <div className="bg-white p-3 rounded-md border">
            <div className="flex items-center space-x-2 mb-2">
              {conflict.resource_type === 'venue' ? (
                <MapPin className="w-4 h-4 text-orange-600" />
              ) : (
                <Users className="w-4 h-4 text-blue-600" />
              )}
              <span className="font-medium text-gray-900">
                Affected {conflict.resource_type === 'venue' ? 'Venue' : 'Team'}:
              </span>
            </div>
            <div className="ml-6">
              {conflict.resource_name ? (
                <div>
                  <p className="text-gray-900 font-medium">{conflict.resource_name}</p>
                  <p className="text-sm text-gray-500">ID: {conflict.resource_id}</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium capitalize">{conflict.resource_type}</span> Resource
                  </p>
                  <p className="text-sm text-gray-600 font-mono">ID: {conflict.resource_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Event Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Your Event */}
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Your Event
              </h4>
              <div className="space-y-1 text-sm text-blue-800">
                <div className="font-medium">{conflict.primary_event.name}</div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{primaryEvent.date} at {primaryEvent.time}</span>
                </div>
                {conflict.primary_event.venue_name && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{conflict.primary_event.venue_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Conflicting Event */}
            <div className="bg-red-50 p-3 rounded-md border border-red-200">
              <h4 className="font-medium text-red-900 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Conflicting Event
              </h4>
              <div className="space-y-1 text-sm text-red-800">
                <div className="font-medium">{conflict.conflicting_event.name}</div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{conflictingEvent.date} at {conflictingEvent.time}</span>
                </div>
                {conflict.conflicting_event.venue_name && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{conflict.conflicting_event.venue_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const ConflictDisplay: React.FC<ConflictDisplayProps> = ({
  conflicts,
  onProceed,
  onCancel,
  isLoading = false,
  title,
  description,
  proceedButtonText,
  cancelButtonText,
  loadingText,
  operationType = 'create',
  open = true,
  onOpenChange
}) => {
  // Handle empty conflicts gracefully - don't show modal
  if (!conflicts || conflicts.length === 0) {
    return null
  }

  const hasHighPriorityConflicts = conflicts.some(c => c.severity >= 7)
  const hasVenueConflicts = conflicts.some(c => c.conflict_type === 'venue_double_booking')

  // Generate context-aware default texts
  const getDefaultTitle = () => {
    switch (operationType) {
      case 'edit':
        return 'Scheduling Conflicts Detected'
      case 'update':
        return 'Update Conflicts Found'
      case 'schedule':
        return 'Scheduling Conflicts Found'
      default:
        return 'Scheduling Conflicts Detected'
    }
  }

  const getDefaultDescription = () => {
    const conflictCount = conflicts.length
    const conflictWord = conflictCount === 1 ? 'conflict' : 'conflicts'

    switch (operationType) {
      case 'edit':
        return `We found ${conflictCount} scheduling ${conflictWord} that need your attention before saving changes.`
      case 'update':
        return `We found ${conflictCount} scheduling ${conflictWord} that need your attention before updating.`
      case 'schedule':
        return `We found ${conflictCount} scheduling ${conflictWord} that need your attention before scheduling.`
      default:
        return `We found ${conflictCount} scheduling ${conflictWord} that need your attention before proceeding.`
    }
  }

  const getDefaultProceedText = () => {
    switch (operationType) {
      case 'edit':
        return 'Save Anyway'
      case 'update':
        return 'Update Anyway'
      case 'schedule':
        return 'Schedule Anyway'
      default:
        return 'Proceed Anyway'
    }
  }

  const getDefaultCancelText = () => {
    switch (operationType) {
      case 'edit':
        return 'Cancel & Continue Editing'
      case 'update':
        return 'Cancel & Review Changes'
      case 'schedule':
        return 'Cancel & Reschedule'
      default:
        return 'Cancel & Edit Event'
    }
  }

  const getDefaultLoadingText = () => {
    switch (operationType) {
      case 'edit':
        return 'Saving Changes...'
      case 'update':
        return 'Updating Event...'
      case 'schedule':
        return 'Scheduling Event...'
      default:
        return 'Creating Event...'
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else if (!newOpen) {
      onCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-red-900">
            {title || getDefaultTitle()}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {description || getDefaultDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Summary Alert */}
          <Alert className={`mb-6 border-2 ${hasHighPriorityConflicts ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'}`}>
            <AlertTriangle className={`h-4 w-4 ${hasHighPriorityConflicts ? 'text-red-600' : 'text-orange-600'}`} />
            <AlertDescription className={hasHighPriorityConflicts ? 'text-red-800' : 'text-orange-800'}>
              <div className="font-medium mb-1">
                {hasHighPriorityConflicts ? 'Critical Conflicts Detected' : 'Scheduling Conflicts Found'}
              </div>
              <div>
                {hasVenueConflicts && 'Venue double-booking detected. '}
                {conflicts.some(c => c.conflict_type === 'team_overlap') && 'Team scheduling overlap detected. '}
                Please review the conflicts below and decide how to proceed.
              </div>
            </AlertDescription>
          </Alert>

          {/* Conflicts List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Conflict Details ({conflicts.length})
            </h3>
            {conflicts.map((conflict, index) => (
              <ConflictItemCard key={index} conflict={conflict} />
            ))}
          </div>

          {/* Business Rules Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">What can you do?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Cancel:</strong> Go back and modify your event details to avoid conflicts</li>
              <li>• <strong>Proceed Anyway:</strong> Create the event with conflicts (may require approval)</li>
              {hasVenueConflicts && (
                <li>• <strong>Venue Conflicts:</strong> Consider selecting a different venue or time</li>
              )}
              {conflicts.some(c => c.conflict_type === 'team_overlap') && (
                <li>• <strong>Team Conflicts:</strong> Consider removing conflicting teams or changing the time</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter className="space-x-4 pt-6 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3"
          >
            <XCircle className="w-4 h-4 mr-2" />
            {cancelButtonText || getDefaultCancelText()}
          </Button>
          <Button
            onClick={onProceed}
            disabled={isLoading}
            className={`px-6 py-3 ${
              hasHighPriorityConflicts
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-orange-600 hover:bg-orange-700'
            } text-white`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {loadingText || getDefaultLoadingText()}
              </div>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {proceedButtonText || getDefaultProceedText()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConflictDisplay