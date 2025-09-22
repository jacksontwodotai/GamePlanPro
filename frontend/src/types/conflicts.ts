// Conflict Detection Types
// These types match the backend API from the scheduling conflict detection service

export type ConflictType = 'venue_double_booking' | 'team_overlap' | 'time_overlap'

export interface ConflictEventInfo {
  id: string
  name: string
  event_type: 'Practice' | 'Game' | 'Meeting' | 'Tournament' | 'Other'
  start_time: string
  end_time: string
  venue_id?: string
  venue_name?: string
}

export interface ConflictResponse {
  id?: string // Only present for persisted conflicts
  conflict_type: ConflictType
  description: string
  resource_type: string // "venue", "team", etc.
  resource_id: string
  resource_name?: string // Human-readable resource name
  severity: number
  primary_event: ConflictEventInfo
  conflicting_event: ConflictEventInfo
  is_resolved: boolean
  detected_by: string
  created_at?: string
}

export interface ConflictCheckRequest {
  event_id?: string // For updating existing events
  name: string
  event_type: 'Practice' | 'Game' | 'Meeting' | 'Tournament' | 'Other'
  start_time: string // ISO datetime string
  end_time: string // ISO datetime string
  venue_id?: string
  team_ids: number[]
  is_recurring: boolean
  recurrence_rule?: string
}

export interface ConflictCheckResult {
  conflicts: ConflictResponse[]
  hasConflicts: boolean
  canProceed: boolean // Business rule: can user proceed with conflicts?
}

export interface ConflictDisplayProps {
  conflicts: ConflictResponse[]
  onProceed: () => void
  onCancel: () => void
  isLoading?: boolean
  // Enhanced reusability props
  title?: string
  description?: string
  proceedButtonText?: string
  cancelButtonText?: string
  loadingText?: string
  operationType?: 'create' | 'edit' | 'update' | 'schedule'
  // Control modal visibility
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// Conflict severity levels for UI display
export const CONFLICT_SEVERITY = {
  LOW: { min: 1, max: 3, color: 'yellow', label: 'Low' },
  MEDIUM: { min: 4, max: 6, color: 'orange', label: 'Medium' },
  HIGH: { min: 7, max: 8, color: 'red', label: 'High' },
  CRITICAL: { min: 9, max: 10, color: 'red', label: 'Critical' }
} as const

// Helper function to get severity info
export const getConflictSeverityInfo = (severity: number) => {
  if (severity <= CONFLICT_SEVERITY.LOW.max) return CONFLICT_SEVERITY.LOW
  if (severity <= CONFLICT_SEVERITY.MEDIUM.max) return CONFLICT_SEVERITY.MEDIUM
  if (severity <= CONFLICT_SEVERITY.HIGH.max) return CONFLICT_SEVERITY.HIGH
  return CONFLICT_SEVERITY.CRITICAL
}

// Helper function to format conflict type for display
export const formatConflictType = (type: ConflictType): string => {
  switch (type) {
    case 'venue_double_booking':
      return 'Venue Double Booking'
    case 'team_overlap':
      return 'Team Schedule Overlap'
    case 'time_overlap':
      return 'Time Overlap'
    default:
      return 'Unknown Conflict'
  }
}