import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Calendar,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  Users,
  FileText,
  Eye,
  RefreshCw
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'
import type { ConflictResponse } from '../types/conflicts'
import { getConflictSeverityInfo, formatConflictType } from '../types/conflicts'

interface ConflictReportFilters {
  start_date_after?: string
  end_date_before?: string
  venue_id?: string
  team_id?: number
  limit: number
  offset: number
}

interface ConflictReportResponse {
  conflicts: ConflictResponse[]
  total: number
  limit: number
  offset: number
  has_next: boolean
  has_prev: boolean
}

interface SortConfig {
  key: keyof ConflictResponse | null
  direction: 'asc' | 'desc'
}

const ConflictReportView: React.FC = () => {
  // State for filters and pagination
  const [filters, setFilters] = useState<ConflictReportFilters>({
    limit: 10,
    offset: 0
  })

  // State for sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc'
  })

  // State for UI controls
  const [showFilters, setShowFilters] = useState(false)
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null)

  // API hook for fetching conflicts
  const {
    data: conflictData,
    loading: conflictsLoading,
    error: conflictsError,
    execute: fetchConflicts
  } = useApi<ConflictReportResponse>()

  // Load conflicts when filters change
  const loadConflicts = useCallback(async () => {
    try {
      await fetchConflicts(`/api/scheduling/conflicts?${new URLSearchParams(
        Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = String(value)
          }
          return acc
        }, {} as Record<string, string>)
      ).toString()}`)
    } catch (error) {
      console.error('Error loading conflicts:', error)
    }
  }, [filters, fetchConflicts])

  // Load conflicts on component mount and filter changes
  useEffect(() => {
    loadConflicts()
  }, [loadConflicts])

  // Handle filter changes
  const updateFilters = (newFilters: Partial<ConflictReportFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0 // Reset to first page when filters change
    }))
  }

  // Handle pagination
  const handlePageChange = (newOffset: number) => {
    setFilters(prev => ({ ...prev, offset: newOffset }))
  }

  // Handle sorting
  const handleSort = (key: keyof ConflictResponse) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Get sorted conflicts
  const getSortedConflicts = useCallback(() => {
    if (!conflictData?.conflicts || !sortConfig.key) {
      return conflictData?.conflicts || []
    }

    const sorted = [...conflictData.conflicts].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      if (aValue === bValue) return 0

      const isAsc = sortConfig.direction === 'asc'

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return isAsc ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return isAsc ? aValue - bValue : bValue - aValue
      }

      // Fallback to string comparison
      const aStr = String(aValue)
      const bStr = String(bValue)
      return isAsc ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })

    return sorted
  }, [conflictData?.conflicts, sortConfig])

  // Handle conflict detail view
  const handleViewConflictDetails = (conflictId: string) => {
    setSelectedConflictId(conflictId)
    // In a real implementation, this would navigate to a detailed view
    console.log('Navigate to conflict details:', conflictId)
  }

  // Calculate pagination info
  const currentPage = Math.floor((filters.offset || 0) / filters.limit) + 1
  const totalPages = Math.ceil((conflictData?.total || 0) / filters.limit)
  const hasNextPage = conflictData?.has_next || false
  const hasPrevPage = conflictData?.has_prev || false

  // Get today's date for default date inputs
  const today = new Date().toISOString().split('T')[0]
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const sortedConflicts = getSortedConflicts()

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conflict Report</h1>
          <p className="text-gray-600 mt-2">
            View and manage scheduling conflicts across your organization
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            onClick={loadConflicts}
            disabled={conflictsLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${conflictsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filter Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={filters.start_date_after || oneWeekAgo}
                    onChange={(e) => updateFilters({ start_date_after: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={filters.end_date_before || today}
                    onChange={(e) => updateFilters({ end_date_before: e.target.value })}
                  />
                </div>

                {/* Venue Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Venue ID
                  </label>
                  <Input
                    placeholder="Enter venue ID"
                    value={filters.venue_id || ''}
                    onChange={(e) => updateFilters({ venue_id: e.target.value })}
                  />
                </div>

                {/* Team Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Team ID
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter team ID"
                    value={filters.team_id || ''}
                    onChange={(e) => updateFilters({
                      team_id: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>

              {/* Page Size Control */}
              <div className="mt-4 flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">
                  Results per page:
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => updateFilters({ limit: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary Stats */}
      {conflictData && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{conflictData.total}</div>
                <div className="text-sm text-gray-600">Total Conflicts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{currentPage}</div>
                <div className="text-sm text-gray-600">of {totalPages} Pages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{sortedConflicts.length}</div>
                <div className="text-sm text-gray-600">Showing Results</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>Scheduling Conflicts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conflictsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading conflicts...</span>
            </div>
          ) : conflictsError ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Conflicts</h3>
              <p className="text-gray-600 mb-4">{conflictsError}</p>
              <Button onClick={loadConflicts}>Try Again</Button>
            </div>
          ) : !sortedConflicts || sortedConflicts.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Conflicts Found</h3>
              <p className="text-gray-600">
                No scheduling conflicts match your current filters. Try adjusting the date range or filters.
              </p>
            </div>
          ) : (
            <>
              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">
                        <button
                          onClick={() => handleSort('conflict_type')}
                          className="flex items-center space-x-1 hover:text-blue-600"
                        >
                          <span>Type</span>
                          {sortConfig.key === 'conflict_type' && (
                            sortConfig.direction === 'asc' ?
                            <ChevronUp className="w-4 h-4" /> :
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4">
                        <button
                          onClick={() => handleSort('severity')}
                          className="flex items-center space-x-1 hover:text-blue-600"
                        >
                          <span>Severity</span>
                          {sortConfig.key === 'severity' && (
                            sortConfig.direction === 'asc' ?
                            <ChevronUp className="w-4 h-4" /> :
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4">Description</th>
                      <th className="text-left py-3 px-4">Resource</th>
                      <th className="text-left py-3 px-4">Events</th>
                      <th className="text-left py-3 px-4">
                        <button
                          onClick={() => handleSort('created_at')}
                          className="flex items-center space-x-1 hover:text-blue-600"
                        >
                          <span>Detected</span>
                          {sortConfig.key === 'created_at' && (
                            sortConfig.direction === 'asc' ?
                            <ChevronUp className="w-4 h-4" /> :
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedConflicts.map((conflict, index) => {
                      const severityInfo = getConflictSeverityInfo(conflict.severity)
                      return (
                        <tr
                          key={conflict.id || index}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {conflict.resource_type === 'venue' ? (
                                <MapPin className="w-4 h-4 text-orange-600" />
                              ) : (
                                <Users className="w-4 h-4 text-blue-600" />
                              )}
                              <span className="font-medium">
                                {formatConflictType(conflict.conflict_type)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${severityInfo.color}-100 text-${severityInfo.color}-800`}
                            >
                              {severityInfo.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-gray-900">{conflict.description}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {conflict.resource_name || `${conflict.resource_type} Resource`}
                              </p>
                              <p className="text-xs text-gray-500">ID: {conflict.resource_id}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="text-xs">
                                <span className="font-medium">Primary:</span> {conflict.primary_event.name}
                                <span className="text-gray-500 ml-1">({conflict.primary_event.id})</span>
                              </div>
                              <div className="text-xs">
                                <span className="font-medium">Conflict:</span> {conflict.conflicting_event.name}
                                <span className="text-gray-500 ml-1">({conflict.conflicting_event.id})</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-600">
                              {conflict.created_at ? (
                                new Date(conflict.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              ) : (
                                'Unknown'
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewConflictDetails(conflict.id || `${index}`)}
                              className="flex items-center space-x-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, conflictData?.total || 0)} of {conflictData?.total || 0} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.max(0, filters.offset - filters.limit))}
                    disabled={!hasPrevPage}
                    className="flex items-center space-x-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </Button>

                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.offset + filters.limit)}
                    disabled={!hasNextPage}
                    className="flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ConflictReportView