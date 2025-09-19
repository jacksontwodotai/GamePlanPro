import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Shield, Download, AlertCircle, CheckCircle, Loader2,
  FileText, FileSpreadsheet, TrendingUp, Layers, MapPin, Trophy
} from 'lucide-react'

interface TeamSummaryData {
  team_name: string
  organization: string
  division?: string
  age_group?: string
  skill_level?: string
  active_player_count: number
  total_player_count: number
  description?: string
}

interface TeamSummaryReportViewProps {
  data: TeamSummaryData[] | null
  loading?: boolean
  error?: string | null
  teamFilters?: string[]
  onExport?: (format: 'csv') => void
}

interface ExportState {
  isExporting: boolean
  exportError: string | null
  exportSuccess: string | null
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
}

export default function TeamSummaryReportView({
  data,
  loading = false,
  error = null,
  teamFilters = [],
  onExport
}: TeamSummaryReportViewProps) {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    exportError: null,
    exportSuccess: null
  })

  const getTeamInitials = (teamName: string): string => {
    const words = teamName.split(' ')
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase()
    }
    return teamName.charAt(0).toUpperCase()
  }

  const getPlayerCountPercentage = (active: number, total: number): number => {
    if (total === 0) return 0
    return Math.round((active / total) * 100)
  }

  const generateCSV = useCallback((summaryData: TeamSummaryData[]): string => {
    const headers = [
      'Team Name', 'Organization', 'Division', 'Age Group', 'Skill Level',
      'Active Players', 'Total Players', 'Active Percentage', 'Description'
    ]
    const csvRows = [headers.join(',')]

    summaryData.forEach(team => {
      const activePercentage = getPlayerCountPercentage(team.active_player_count, team.total_player_count)
      const row = [
        `"${team.team_name}"`,
        `"${team.organization}"`,
        `"${team.division || ''}"`,
        `"${team.age_group || ''}"`,
        `"${team.skill_level || ''}"`,
        team.active_player_count.toString(),
        team.total_player_count.toString(),
        `${activePercentage}%`,
        `"${team.description || ''}"`
      ]
      csvRows.push(row.join(','))
    })

    return csvRows.join('\n')
  }, [])

  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, [])

  const handleExport = useCallback(async () => {
    if (!data || data.length === 0) {
      setExportState(prev => ({
        ...prev,
        exportError: 'No team summary data available to export'
      }))
      return
    }

    setExportState({
      isExporting: true,
      exportError: null,
      exportSuccess: null
    })

    try {
      if (onExport) {
        await onExport('csv')
        setExportState({
          isExporting: false,
          exportError: null,
          exportSuccess: 'CSV export initiated successfully!'
        })
      } else {
        // Fallback to local CSV generation
        const csvContent = generateCSV(data)
        const timestamp = new Date().toISOString().slice(0, 10)
        downloadFile(csvContent, `team_summary_${timestamp}.csv`, 'text/csv')

        setExportState({
          isExporting: false,
          exportError: null,
          exportSuccess: `CSV file downloaded successfully! (${data.length} teams)`
        })
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportState({
        isExporting: false,
        exportError: error instanceof Error ? error.message : 'Export failed',
        exportSuccess: null
      })
    }

    // Clear messages after 5 seconds
    setTimeout(() => {
      setExportState(prev => ({
        ...prev,
        exportError: null,
        exportSuccess: null
      }))
    }, 5000)
  }, [data, generateCSV, downloadFile, onExport])

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-8"
      >
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full"
          />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading team summary data...</span>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 border-red-500/20 bg-red-50/50 dark:bg-red-900/20"
      >
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </motion.div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 text-center"
      >
        <Shield className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No team data found
        </h3>
        <p className="text-gray-500">
          No teams match the current filters or the data is empty.
        </p>
      </motion.div>
    )
  }

  const totalActivePlayers = data.reduce((sum, team) => sum + team.active_player_count, 0)
  const totalPlayers = data.reduce((sum, team) => sum + team.total_player_count, 0)

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header with Export Actions */}
      <motion.div
        variants={itemVariants}
        className="glass-card p-6 flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-gray-600" />
            Team Summary Report
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {data.length} team{data.length !== 1 ? 's' : ''} • {totalActivePlayers} active players ({totalPlayers} total)
            {teamFilters.length > 0 && (
              <span className="ml-2 text-sm">
                (Filtered by {teamFilters.length} team{teamFilters.length !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            disabled={exportState.isExporting}
            className="button-primary flex items-center"
          >
            {exportState.isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </motion.button>
        </div>
      </motion.div>

      {/* Export Messages */}
      <AnimatePresence>
        {exportState.exportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-4 border-green-500/20 bg-green-50/50 dark:bg-green-900/20"
          >
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span>{exportState.exportSuccess}</span>
            </div>
          </motion.div>
        )}

        {exportState.exportError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-4 border-red-500/20 bg-red-50/50 dark:bg-red-900/20"
          >
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{exportState.exportError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Cards Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {data.map((team, index) => {
            const activePercentage = getPlayerCountPercentage(team.active_player_count, team.total_player_count)

            return (
              <motion.div
                key={`${team.team_name}-${team.organization}-${index}`}
                variants={itemVariants}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-6 hover:shadow-lg transition-all duration-300"
              >
                {/* Team Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold">
                    {getTeamInitials(team.team_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {team.team_name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{team.organization}</p>
                  </div>
                </div>

                {/* Team Details */}
                <div className="space-y-3 mb-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {team.division && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                        <Layers className="w-3 h-3 mr-1" />
                        {team.division}
                      </span>
                    )}
                    {team.age_group && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300">
                        <Users className="w-3 h-3 mr-1" />
                        {team.age_group}
                      </span>
                    )}
                    {team.skill_level && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300">
                        <Trophy className="w-3 h-3 mr-1" />
                        {team.skill_level}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {team.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {team.description}
                    </p>
                  )}
                </div>

                {/* Player Statistics */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Player Status</span>
                    <span className="text-sm text-gray-500">
                      {team.active_player_count} / {team.total_player_count}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${activePercentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                    />
                  </div>

                  {/* Statistics Row */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-lg font-bold text-green-600">{team.active_player_count}</span>
                      </div>
                      <p className="text-xs text-gray-500">Active</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-lg font-bold text-gray-600">{team.total_player_count}</span>
                      </div>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>

                  {/* Active Percentage Badge */}
                  <div className="flex justify-center pt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      activePercentage >= 90
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : activePercentage >= 70
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                    }`}>
                      {activePercentage}% Active
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}