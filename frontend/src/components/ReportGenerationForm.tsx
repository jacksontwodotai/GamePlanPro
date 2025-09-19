import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useLocation } from 'react-router-dom'
import {
  FileText, Users, BarChart, Download, Filter, AlertCircle,
  CheckCircle, Loader2, ChevronDown, X, Search
} from 'lucide-react'
import { useApi } from '../hooks/useApi'
import RosterReportDisplay from './RosterReportDisplay'
import PlayerContactReportView from './PlayerContactReportView'
import TeamSummaryReportView from './TeamSummaryReportView'

interface Team {
  id: number
  name: string
  organization: string
  division?: string
  age_group?: string
  skill_level?: string
}

interface FormState {
  reportType: 'roster' | 'player-contact' | 'team-summary' | ''
  format: 'json' | 'csv' | 'pdf' | ''
  teamIds: number[]
  status: 'active' | 'all' | ''
}

interface ValidationErrors {
  reportType?: string
  format?: string
  teamIds?: string
  status?: string
}

const reportTypeConfig = {
  roster: {
    label: 'Roster Report',
    description: 'Detailed player roster information with team assignments',
    icon: FileText,
    formats: ['json', 'csv', 'pdf'],
    hasStatusFilter: true,
    endpoint: '/api/reports/roster'
  },
  'player-contact': {
    label: 'Player Contact Report',
    description: 'Player and parent/guardian contact information',
    icon: Users,
    formats: ['json', 'csv'],
    hasStatusFilter: false,
    endpoint: '/api/reports/player-contact'
  },
  'team-summary': {
    label: 'Team Summary Report',
    description: 'High-level team overview with active player counts',
    icon: BarChart,
    formats: ['json', 'csv'],
    hasStatusFilter: false,
    endpoint: '/api/reports/team-summary'
  }
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
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

export default function ReportGenerationForm() {
  const [searchParams] = useSearchParams()
  const location = useLocation()

  const [formState, setFormState] = useState<FormState>({
    reportType: '',
    format: '',
    teamIds: [],
    status: 'active'
  })
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([])
  const [teamSearchTerm, setTeamSearchTerm] = useState('')
  const [showTeamDropdown, setShowTeamDropdown] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [apiError, setApiError] = useState('')
  const [rosterData, setRosterData] = useState<any[]>([])
  const [showRosterDisplay, setShowRosterDisplay] = useState(false)
  const [playerContactData, setPlayerContactData] = useState<any[]>([])
  const [showPlayerContactDisplay, setShowPlayerContactDisplay] = useState(false)
  const [teamSummaryData, setTeamSummaryData] = useState<any[]>([])
  const [showTeamSummaryDisplay, setShowTeamSummaryDisplay] = useState(false)

  const teamsApi = useApi<{ teams: Team[] }>()
  const reportApi = useApi()

  useEffect(() => {
    fetchTeams()
  }, [])

  // Handle URL parameters and route-based pre-selection
  useEffect(() => {
    const urlReportType = searchParams.get('type')
    const urlFormat = searchParams.get('format')

    // Check route-based selection
    let routeReportType = ''
    if (location.pathname.includes('/reports/roster')) {
      routeReportType = 'roster'
    } else if (location.pathname.includes('/reports/contacts')) {
      routeReportType = 'player-contact'
    } else if (location.pathname.includes('/reports/teams')) {
      routeReportType = 'team-summary'
    }

    // Use URL parameter first, then route-based selection
    const reportType = urlReportType || routeReportType

    if (reportType && reportType !== formState.reportType) {
      setFormState(prev => ({
        ...prev,
        reportType,
        format: urlFormat || ''
      }))
    } else if (urlFormat && urlFormat !== formState.format) {
      setFormState(prev => ({ ...prev, format: urlFormat }))
    }
  }, [searchParams, location.pathname])

  useEffect(() => {
    // Reset format when report type changes
    if (formState.reportType && formState.format) {
      const config = reportTypeConfig[formState.reportType]
      if (!config.formats.includes(formState.format as any)) {
        setFormState(prev => ({ ...prev, format: '' }))
      }
    }

    // Reset all report displays when report type or format changes
    setShowRosterDisplay(false)
    setRosterData([])
    setShowPlayerContactDisplay(false)
    setPlayerContactData([])
    setShowTeamSummaryDisplay(false)
    setTeamSummaryData([])
  }, [formState.reportType, formState.format])

  const fetchTeams = async () => {
    try {
      const response = await teamsApi.execute('/api/teams?limit=1000')
      setTeams(response.teams || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const handleFormChange = useCallback((field: keyof FormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }))
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    // Clear global messages
    setApiError('')
    setSuccessMessage('')
  }, [validationErrors])

  const handleTeamSelect = useCallback((team: Team) => {
    if (!selectedTeams.find(t => t.id === team.id)) {
      const newSelectedTeams = [...selectedTeams, team]
      setSelectedTeams(newSelectedTeams)
      setFormState(prev => ({
        ...prev,
        teamIds: newSelectedTeams.map(t => t.id)
      }))
    }
    setTeamSearchTerm('')
    setShowTeamDropdown(false)
  }, [selectedTeams])

  const handleTeamRemove = useCallback((teamId: number) => {
    const newSelectedTeams = selectedTeams.filter(t => t.id !== teamId)
    setSelectedTeams(newSelectedTeams)
    setFormState(prev => ({
      ...prev,
      teamIds: newSelectedTeams.map(t => t.id)
    }))
  }, [selectedTeams])

  const filteredTeams = teams.filter(team =>
    !selectedTeams.find(selected => selected.id === team.id) &&
    (team.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
     team.organization.toLowerCase().includes(teamSearchTerm.toLowerCase()))
  )

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}

    if (!formState.reportType) {
      errors.reportType = 'Please select a report type'
    }

    if (!formState.format) {
      errors.format = 'Please select a format'
    }

    if (formState.reportType && reportTypeConfig[formState.reportType].hasStatusFilter && !formState.status) {
      errors.status = 'Please select a status filter'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const generateReport = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setIsGenerating(true)
      setApiError('')
      setSuccessMessage('')

      const config = reportTypeConfig[formState.reportType as keyof typeof reportTypeConfig]
      const params = new URLSearchParams()

      // Add format
      params.append('format', formState.format)

      // Add team filters if selected
      formState.teamIds.forEach(teamId => {
        params.append('team_id', teamId.toString())
      })

      // Add status filter if applicable
      if (config.hasStatusFilter && formState.status) {
        params.append('status', formState.status)
      }

      const url = `${config.endpoint}?${params.toString()}`

      if (formState.format === 'json') {
        // For JSON, handle response data
        const response = await reportApi.execute(url)

        // Special handling for different report types - show the appropriate display component
        if (formState.reportType === 'roster') {
          setRosterData(response.data || [])
          setShowRosterDisplay(true)
          setSuccessMessage(`${config.label} generated successfully! Found ${response.metadata?.total_entries || 'unknown'} records.`)
        } else if (formState.reportType === 'player-contact') {
          setPlayerContactData(response.data || [])
          setShowPlayerContactDisplay(true)
          setSuccessMessage(`${config.label} generated successfully! Found ${response.metadata?.total_contacts || 'unknown'} contacts.`)
        } else if (formState.reportType === 'team-summary') {
          setTeamSummaryData(response.data || [])
          setShowTeamSummaryDisplay(true)
          setSuccessMessage(`${config.label} generated successfully! Found ${response.metadata?.total_teams || 'unknown'} teams.`)
        } else {
          setSuccessMessage(`${config.label} generated successfully! Found ${response.metadata?.total_entries || response.metadata?.total_contacts || response.metadata?.total_teams || 'unknown'} records.`)
        }
      } else {
        // For CSV/PDF, trigger download
        const authHeader = localStorage.getItem('authToken') ?
          { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}

        const response = await fetch(url, {
          headers: authHeader
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }

        // Create download
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl

        const extension = formState.format === 'pdf' ? 'pdf' : 'csv'
        const filename = `${formState.reportType.replace('-', '_')}_report.${extension}`
        a.download = filename

        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(downloadUrl)

        setSuccessMessage(`${config.label} downloaded successfully as ${filename}!`)
      }

    } catch (error) {
      console.error('Report generation error:', error)
      setApiError(error instanceof Error ? error.message : 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRosterExport = useCallback(async (format: 'csv' | 'pdf') => {
    try {
      const config = reportTypeConfig.roster
      const params = new URLSearchParams()

      // Add format
      params.append('format', format)

      // Add team filters if selected
      formState.teamIds.forEach(teamId => {
        params.append('team_id', teamId.toString())
      })

      // Add status filter
      if (formState.status) {
        params.append('status', formState.status)
      }

      const url = `${config.endpoint}?${params.toString()}`

      // Trigger download
      const authHeader = localStorage.getItem('authToken') ?
        { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}

      const response = await fetch(url, {
        headers: authHeader
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Create download
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl

      const extension = format === 'pdf' ? 'pdf' : 'csv'
      const filename = `roster_report.${extension}`
      a.download = filename

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

    } catch (error) {
      console.error('Export error:', error)
      throw error
    }
  }, [formState.teamIds, formState.status])

  const handlePlayerContactExport = useCallback(async (format: 'csv') => {
    try {
      const config = reportTypeConfig['player-contact']
      const params = new URLSearchParams()

      // Add format
      params.append('format', format)

      // Add team filters if selected
      formState.teamIds.forEach(teamId => {
        params.append('team_id', teamId.toString())
      })

      const url = `${config.endpoint}?${params.toString()}`

      // Trigger download
      const authHeader = localStorage.getItem('authToken') ?
        { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}

      const response = await fetch(url, {
        headers: authHeader
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Create download
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl

      const filename = `player_contacts.csv`
      a.download = filename

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

    } catch (error) {
      console.error('Export error:', error)
      throw error
    }
  }, [formState.teamIds])

  const handleTeamSummaryExport = useCallback(async (format: 'csv') => {
    try {
      const config = reportTypeConfig['team-summary']
      const params = new URLSearchParams()

      // Add format
      params.append('format', format)

      // Add team filters if selected
      formState.teamIds.forEach(teamId => {
        params.append('team_id', teamId.toString())
      })

      const url = `${config.endpoint}?${params.toString()}`

      // Trigger download
      const authHeader = localStorage.getItem('authToken') ?
        { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}

      const response = await fetch(url, {
        headers: authHeader
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Create download
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl

      const filename = `team_summary.csv`
      a.download = filename

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

    } catch (error) {
      console.error('Export error:', error)
      throw error
    }
  }, [formState.teamIds])

  const currentConfig = formState.reportType ? reportTypeConfig[formState.reportType] : null

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-indigo-200/20 to-indigo-400/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8 text-center">
          <motion.h1
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 100,
              delay: 0.1
            }}
            className="text-4xl font-black mb-4"
          >
            <span className="gradient-text">Report Generation</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 dark:text-gray-400"
          >
            Generate comprehensive reports with customizable filters and formats
          </motion.p>
        </motion.div>

        {/* Form */}
        <motion.div variants={itemVariants} className="glass-card p-8">
          <div className="space-y-8">
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                <Filter className="w-4 h-4 inline mr-2" />
                Select Report Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(reportTypeConfig).map(([key, config]) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleFormChange('reportType', key)}
                    className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                      formState.reportType === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <config.icon className={`w-8 h-8 mb-3 ${
                      formState.reportType === key ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {config.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {config.description}
                    </p>
                  </motion.div>
                ))}
              </div>
              {validationErrors.reportType && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.reportType}
                </motion.p>
              )}
            </div>

            {/* Dynamic Filters */}
            <AnimatePresence>
              {currentConfig && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Output Format
                    </label>
                    <select
                      value={formState.format}
                      onChange={(e) => handleFormChange('format', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select format...</option>
                      {currentConfig.formats.map(format => (
                        <option key={format} value={format}>
                          {format.toUpperCase()}
                          {format === 'json' && ' (View Data)'}
                          {format === 'csv' && ' (Download Spreadsheet)'}
                          {format === 'pdf' && ' (Download Document)'}
                        </option>
                      ))}
                    </select>
                    {validationErrors.format && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.format}
                      </motion.p>
                    )}
                  </div>

                  {/* Status Filter (Roster Reports Only) */}
                  {currentConfig.hasStatusFilter && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Player Status Filter
                      </label>
                      <select
                        value={formState.status}
                        onChange={(e) => handleFormChange('status', e.target.value as 'active' | 'all')}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">Active Players Only</option>
                        <option value="all">All Players (Active & Inactive)</option>
                      </select>
                      {validationErrors.status && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                        >
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {validationErrors.status}
                        </motion.p>
                      )}
                    </div>
                  )}

                  {/* Team Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Team Filter (Optional)
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Leave empty to include all teams, or select specific teams to filter results
                    </p>

                    {/* Selected Teams */}
                    {selectedTeams.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {selectedTeams.map(team => (
                          <motion.span
                            key={team.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"
                          >
                            {team.name}
                            <button
                              onClick={() => handleTeamRemove(team.id)}
                              className="ml-2 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </div>
                    )}

                    {/* Team Search */}
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search teams to add..."
                          value={teamSearchTerm}
                          onChange={(e) => setTeamSearchTerm(e.target.value)}
                          onFocus={() => setShowTeamDropdown(true)}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>

                      {/* Team Dropdown */}
                      <AnimatePresence>
                        {showTeamDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                          >
                            {filteredTeams.length > 0 ? (
                              filteredTeams.map(team => (
                                <button
                                  key={team.id}
                                  onClick={() => handleTeamSelect(team)}
                                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {team.name}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {team.organization}
                                    {team.division && ` • ${team.division}`}
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                                {teamSearchTerm ? 'No teams found' : 'Start typing to search teams'}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success/Error Messages */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-green-700 dark:text-green-300">{successMessage}</span>
                </motion.div>
              )}

              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                  <span className="text-red-700 dark:text-red-300">{apiError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Roster Report Display */}
            <AnimatePresence>
              {showRosterDisplay && formState.reportType === 'roster' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <RosterReportDisplay
                    data={rosterData}
                    loading={false}
                    error={null}
                    teamFilters={selectedTeams.map(team => team.name)}
                    onExport={handleRosterExport}
                  />
                </motion.div>
              )}

              {/* Player Contact Report Display */}
              {showPlayerContactDisplay && formState.reportType === 'player-contact' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <PlayerContactReportView
                    data={playerContactData}
                    loading={false}
                    error={null}
                    teamFilters={selectedTeams.map(team => team.name)}
                    onExport={handlePlayerContactExport}
                  />
                </motion.div>
              )}

              {/* Team Summary Report Display */}
              {showTeamSummaryDisplay && formState.reportType === 'team-summary' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <TeamSummaryReportView
                    data={teamSummaryData}
                    loading={false}
                    error={null}
                    teamFilters={selectedTeams.map(team => team.name)}
                    onExport={handleTeamSummaryExport}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generate Button */}
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateReport}
                disabled={isGenerating || !formState.reportType}
                className="button-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Click outside to close dropdown */}
        {showTeamDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowTeamDropdown(false)}
          />
        )}
      </div>
    </motion.div>
  )
}