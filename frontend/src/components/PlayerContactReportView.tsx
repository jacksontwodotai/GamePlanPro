import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Mail, Phone, Shield, Download, AlertCircle,
  CheckCircle, Loader2, FileText, FileSpreadsheet, User, UserPlus
} from 'lucide-react'

interface PlayerContactData {
  player_name: string
  player_email?: string
  player_phone?: string
  team_name: string
  organization?: string
  parent_guardian_name?: string
  parent_guardian_email?: string
  parent_guardian_phone?: string
  emergency_contact?: string
}

interface PlayerContactReportViewProps {
  data: PlayerContactData[] | null
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

export default function PlayerContactReportView({
  data,
  loading = false,
  error = null,
  teamFilters = [],
  onExport
}: PlayerContactReportViewProps) {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
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

  const formatPhoneNumber = (phone?: string): string => {
    if (!phone) return ''
    // Basic phone formatting - you might want to enhance this
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const generateCSV = useCallback((contactData: PlayerContactData[]): string => {
    const headers = [
      'Player Name', 'Player Email', 'Player Phone', 'Team', 'Organization',
      'Parent/Guardian Name', 'Parent/Guardian Email', 'Parent/Guardian Phone', 'Emergency Contact'
    ]
    const csvRows = [headers.join(',')]

    contactData.forEach(contact => {
      const row = [
        `"${contact.player_name}"`,
        `"${contact.player_email || ''}"`,
        `"${contact.player_phone || ''}"`,
        `"${contact.team_name}"`,
        `"${contact.organization || ''}"`,
        `"${contact.parent_guardian_name || ''}"`,
        `"${contact.parent_guardian_email || ''}"`,
        `"${contact.parent_guardian_phone || ''}"`,
        `"${contact.emergency_contact || ''}"`
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
        exportError: 'No contact data available to export'
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
        downloadFile(csvContent, `player_contacts_${timestamp}.csv`, 'text/csv')

        setExportState({
          isExporting: false,
          exportError: null,
          exportSuccess: `CSV file downloaded successfully! (${data.length} contacts)`
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
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading contact data...</span>
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
          No contact data found
        </h3>
        <p className="text-gray-500">
          No player contacts match the current filters or the data is empty.
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
            Player Contact Report
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {data.length} contact{data.length !== 1 ? 's' : ''} found
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

      {/* Contact Table */}
      <motion.div
        variants={itemVariants}
        className="glass-card p-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Player</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Player Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Parent/Guardian</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Guardian Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Team</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Emergency</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {data.map((contact, index) => (
                  <motion.tr
                    key={`${contact.player_name}-${contact.team_name}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100/50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white font-bold text-sm">
                          {getPlayerInitials(contact.player_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {contact.player_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {contact.player_email && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4 mr-2" />
                            <span className="truncate max-w-[200px]">{contact.player_email}</span>
                          </div>
                        )}
                        {contact.player_phone && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2" />
                            <span>{formatPhoneNumber(contact.player_phone)}</span>
                          </div>
                        )}
                        {!contact.player_email && !contact.player_phone && (
                          <span className="text-gray-400 italic text-sm">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {contact.parent_guardian_name ? (
                          <>
                            <UserPlus className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-900 dark:text-white font-medium">
                              {contact.parent_guardian_name}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 italic">Not specified</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {contact.parent_guardian_email && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4 mr-2" />
                            <span className="truncate max-w-[200px]">{contact.parent_guardian_email}</span>
                          </div>
                        )}
                        {contact.parent_guardian_phone && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2" />
                            <span>{formatPhoneNumber(contact.parent_guardian_phone)}</span>
                          </div>
                        )}
                        {!contact.parent_guardian_email && !contact.parent_guardian_phone && (
                          <span className="text-gray-400 italic text-sm">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{contact.team_name}</p>
                          {contact.organization && (
                            <p className="text-sm text-gray-500">{contact.organization}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {contact.emergency_contact ? (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {contact.emergency_contact}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">None specified</span>
                      )}
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