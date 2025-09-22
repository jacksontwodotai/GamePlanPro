import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Users,
  TrendingUp,
  FileText,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'

interface ConflictSummary {
  total_conflicts: number
  resolved_conflicts: number
  unresolved_conflicts: number
  venue_conflicts: number
  team_conflicts: number
  resolution_rate: number
}

const ConflictDashboard: React.FC = () => {
  const navigate = useNavigate()

  // API hook for fetching summary data
  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    execute: fetchSummary
  } = useApi<ConflictSummary>()

  // Load summary data on component mount
  useEffect(() => {
    loadSummaryData()
  }, [])

  const loadSummaryData = async () => {
    try {
      await fetchSummary('/api/scheduling/conflicts/summary')
    } catch (error) {
      console.error('Error loading conflict summary:', error)
    }
  }

  // Navigate to detailed conflict report
  const handleViewDetailedReport = () => {
    navigate('/dashboard/conflicts/report')
  }

  // Navigate to specific conflict type view
  const handleViewVenueConflicts = () => {
    navigate('/dashboard/conflicts/report?type=venue_double_booking')
  }

  const handleViewTeamConflicts = () => {
    navigate('/dashboard/conflicts/report?type=team_overlap')
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  }

  // Helper function to get status color
  const getStatusColor = (isGood: boolean) => {
    return isGood ? 'text-green-600' : 'text-red-600'
  }

  const getStatusBgColor = (isGood: boolean) => {
    return isGood ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conflict Management Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage scheduling conflicts across your organization
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={loadSummaryData}
            disabled={summaryLoading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={handleViewDetailedReport}
            className="flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>View Detailed Report</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {summaryLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading conflict summary...</span>
        </div>
      ) : summaryError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Summary</h3>
              <p className="text-gray-600 mb-4">{summaryError}</p>
              <Button onClick={loadSummaryData}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      ) : !summaryData ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">Unable to load conflict summary at this time.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Conflicts */}
            <motion.div variants={cardVariants}>
              <Card className={`border-2 ${summaryData.total_conflicts === 0 ? getStatusBgColor(true) : getStatusBgColor(false)}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Conflicts</CardTitle>
                  <AlertTriangle className={`h-4 w-4 ${getStatusColor(summaryData.total_conflicts === 0)}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getStatusColor(summaryData.total_conflicts === 0)}`}>
                    {summaryData.total_conflicts}
                  </div>
                  <p className="text-xs text-gray-600">
                    {summaryData.total_conflicts === 0 ? 'All clear!' : 'Active conflicts'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Unresolved Conflicts */}
            <motion.div variants={cardVariants}>
              <Card className={`border-2 ${summaryData.unresolved_conflicts === 0 ? getStatusBgColor(true) : getStatusBgColor(false)}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
                  <XCircle className={`h-4 w-4 ${getStatusColor(summaryData.unresolved_conflicts === 0)}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getStatusColor(summaryData.unresolved_conflicts === 0)}`}>
                    {summaryData.unresolved_conflicts}
                  </div>
                  <p className="text-xs text-gray-600">
                    Require attention
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Resolution Rate */}
            <motion.div variants={cardVariants}>
              <Card className={`border-2 ${summaryData.resolution_rate >= 80 ? getStatusBgColor(true) : getStatusBgColor(false)}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                  <TrendingUp className={`h-4 w-4 ${getStatusColor(summaryData.resolution_rate >= 80)}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getStatusColor(summaryData.resolution_rate >= 80)}`}>
                    {summaryData.resolution_rate}%
                  </div>
                  <p className="text-xs text-gray-600">
                    Of all conflicts
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Resolved Conflicts */}
            <motion.div variants={cardVariants}>
              <Card className="border-2 bg-blue-50 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {summaryData.resolved_conflicts}
                  </div>
                  <p className="text-xs text-gray-600">
                    Successfully handled
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Conflict Type Breakdown */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Conflict Breakdown by Type</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Venue Conflicts */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 border-orange-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <MapPin className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Venue Conflicts</h3>
                        <p className="text-sm text-gray-600">Double-booking issues</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-xl font-bold text-orange-600">
                          {summaryData.venue_conflicts}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewVenueConflicts}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </Button>
                    </div>
                  </div>

                  {/* Team Conflicts */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Team Conflicts</h3>
                        <p className="text-sm text-gray-600">Schedule overlaps</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">
                          {summaryData.team_conflicts}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewTeamConflicts}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={handleViewDetailedReport}
                    className="flex items-center justify-center space-x-2 py-6"
                    variant="outline"
                  >
                    <FileText className="w-5 h-5" />
                    <span>View Full Report</span>
                  </Button>
                  <Button
                    onClick={handleViewVenueConflicts}
                    className="flex items-center justify-center space-x-2 py-6"
                    variant="outline"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Venue Conflicts</span>
                  </Button>
                  <Button
                    onClick={handleViewTeamConflicts}
                    className="flex items-center justify-center space-x-2 py-6"
                    variant="outline"
                  >
                    <Users className="w-5 h-5" />
                    <span>Team Conflicts</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Message */}
          {summaryData.total_conflicts === 0 && (
            <motion.div variants={cardVariants}>
              <Card className="border-2 bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center py-4">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-900 mb-2">All Clear!</h3>
                    <p className="text-green-700">
                      No scheduling conflicts detected. Your events are well-organized.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default ConflictDashboard