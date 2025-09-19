import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Hash, MapPin, Calendar, Download, AlertCircle,
  CheckCircle, Loader2, FileText, FileSpreadsheet, Shield, Activity
} from 'lucide-react'

interface RosterData {
  player_name: string
  jersey_number?: number
  position?: string
  status: 'active' | 'inactive'
  team_name: string
  start_date: string
  player_email?: string
  organization?: string
}

interface RosterReportDisplayProps {
  data: RosterData[] | null
  loading?: boolean
  error?: string | null
  teamFilters?: string[]
  onExport?: (format: 'csv' | 'pdf') => void
}

interface ExportState {
  isExporting: boolean
  exportFormat: 'csv' | 'pdf' | null
  exportError: string | null
  exportSuccess: string | null
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

export default function RosterReportDisplay({
  data,
  loading = false,
  error = null,
  teamFilters = [],
  onExport
}: RosterReportDisplayProps) {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    exportFormat: null,
    exportError: null,
    exportSuccess: null
  })

  const getPlayerInitials = (playerName: string): string => {
    const names = playerName.split(' ')
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
    }
    return playerName.charAt(0).toUpperCase()
  }

  const getStatusBadge = (status: string) => {
    const isActive = status === 'active'
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        isActive
          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
      }`}>
        <Activity className={`w-3 h-3 mr-1 ${isActive ? 'text-green-600' : 'text-gray-500'}`} />
        {isActive ? 'Active' : 'Inactive'}
      </div>
    )
  }

  const generateCSV = useCallback((rosterData: RosterData[]): string => {
    const headers = ['Player Name', 'Jersey Number', 'Position', 'Status', 'Team', 'Start Date', 'Email', 'Organization']
    const csvRows = [headers.join(',')]

    rosterData.forEach(player => {
      const row = [
        `"${player.player_name}"`,
        player.jersey_number || '',
        `"${player.position || ''}"`,
        player.status,
        `"${player.team_name}"`,
        player.start_date,
        `"${player.player_email || ''}"`,
        `"${player.organization || ''}"`
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

  const handleExport = useCallback(async (format: 'csv' | 'pdf') => {
    if (!data || data.length === 0) {
      setExportState(prev => ({
        ...prev,
        exportError: 'No data available to export'
      }))
      return
    }

    setExportState({
      isExporting: true,
      exportFormat: format,
      exportError: null,
      exportSuccess: null
    })

    try {
      if (format === 'csv') {
        const csvContent = generateCSV(data)
        const timestamp = new Date().toISOString().slice(0, 10)
        downloadFile(csvContent, `roster_report_${timestamp}.csv`, 'text/csv')

        setExportState({
          isExporting: false,
          exportFormat: null,
          exportError: null,
          exportSuccess: `CSV file downloaded successfully! (${data.length} records)`
        })
      } else if (format === 'pdf') {
        // For now, trigger the parent's export handler for PDF
        if (onExport) {
          await onExport(format)
          setExportState({
            isExporting: false,
            exportFormat: null,
            exportError: null,
            exportSuccess: 'PDF export initiated successfully!'
          })
        } else {
          throw new Error('PDF export not available')
        }
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportState({
        isExporting: false,
        exportFormat: null,
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
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading roster data...</span>
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
        <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No roster data found
        </h3>
        <p className="text-gray-500">
          No players match the current filters or the roster is empty.
        </p>
      </motion.div>
    )
  }

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
            Roster Report
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {data.length} player{data.length !== 1 ? 's' : ''} found
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
            onClick={() => handleExport('csv')}
            disabled={exportState.isExporting}
            className="button-primary flex items-center"
          >
            {exportState.isExporting && exportState.exportFormat === 'csv' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleExport('pdf')}
            disabled={exportState.isExporting}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            {exportState.isExporting && exportState.exportFormat === 'pdf' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export PDF
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

      {/* Roster Table */}
      <motion.div
        variants={itemVariants}
        className="glass-card p-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Player</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Jersey #</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Position</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Team</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Start Date</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {data.map((player, index) => (
                  <motion.tr
                    key={`${player.player_name}-${player.team_name}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100/50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-sm">
                          {getPlayerInitials(player.player_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {player.player_name}
                          </p>
                          {player.player_email && (
                            <p className="text-sm text-gray-500">{player.player_email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {player.jersey_number ? (
                          <>
                            <Hash className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="font-mono font-bold text-gray-900 dark:text-white">
                              {player.jersey_number}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 italic">Not assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {player.position ? (
                          <>
                            <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-gray-900 dark:text-white">{player.position}</span>
                          </>
                        ) : (
                          <span className="text-gray-400 italic">Not specified</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(player.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{player.team_name}</p>
                          {player.organization && (
                            <p className="text-sm text-gray-500">{player.organization}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{new Date(player.start_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}