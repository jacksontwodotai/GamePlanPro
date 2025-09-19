import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Users, Calendar, Download, Filter, Search,
  CheckCircle, XCircle, Clock, FileText, SortAsc, SortDesc,
  TrendingUp, UserCheck, User
} from 'lucide-react'
import { useApi } from '../hooks/useApi'

interface Team {
  id: number
  name: string
  organization: string
  division?: string
  age_group?: string
  skill_level?: string
}

interface Player {
  id: number
  first_name: string
  last_name: string
  jersey_number?: number
  position?: string
}

interface AttendanceRecord {
  id: number
  player_id: number
  team_id: number
  event_date: string
  status: 'Present' | 'Absent' | 'Excused'
  notes?: string
  player: Player
  team?: Team
}

interface AttendanceStats {
  totalRecords: number
  presentCount: number
  absentCount: number
  excusedCount: number
  attendanceRate: number
  playerStats: { [playerId: number]: { present: number, absent: number, excused: number, total: number, rate: number } }
}

interface FilterState {
  teamId: string
  playerId: string
  startDate: string
  endDate: string
  status: string
}

type SortField = 'event_date' | 'player_name' | 'status' | 'team_name'
type SortDirection = 'asc' | 'desc'

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

export default function AttendanceReportingDashboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [filters, setFilters] = useState<FilterState>({
    teamId: '',
    playerId: '',
    startDate: '',
    endDate: '',
    status: ''
  })
  const [sortField, setSortField] = useState<SortField>('event_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const teamsApi = useApi<{ teams: Team[] }>()
  const playersApi = useApi<{ players: Player[] }>()
  const attendanceApi = useApi<{ attendance_records: AttendanceRecord[] }>()

  useEffect(() => {
    fetchTeams()
    fetchAttendanceRecords()
  }, [])

  useEffect(() => {
    if (filters.teamId) {
      fetchPlayers()
    } else {
      setPlayers([])
      setFilters(prev => ({ ...prev, playerId: '' }))
    }
  }, [filters.teamId])

  useEffect(() => {
    fetchAttendanceRecords()
  }, [filters])

  const fetchTeams = async () => {
    try {
      const response = await teamsApi.execute('/api/teams')
      setTeams(response.teams || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchPlayers = async () => {
    if (!filters.teamId) return

    try {
      const response = await playersApi.execute(`/api/rosters?team_id=${filters.teamId}&active_only=true`)
      const roster = response.roster_entries || []
      const playerList = roster.map((entry: any) => entry.player).filter(Boolean)
      setPlayers(playerList)
    } catch (error) {
      console.error('Error fetching players:', error)
    }
  }

  const fetchAttendanceRecords = async () => {
    try {
      const params = new URLSearchParams()

      if (filters.teamId) params.append('team_id', filters.teamId)
      if (filters.playerId) params.append('player_id', filters.playerId)
      if (filters.startDate) params.append('event_date_start', filters.startDate)
      if (filters.endDate) params.append('event_date_end', filters.endDate)
      params.append('limit', '1000') // Get more records for reporting

      const response = await attendanceApi.execute(`/api/attendance?${params.toString()}`)
      let records = response.attendance_records || []

      // Filter by status if specified
      if (filters.status) {
        records = records.filter((record: AttendanceRecord) => record.status === filters.status)
      }

      setAttendanceRecords(records)
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      setAttendanceRecords([])
    }
  }

  const handleFilterChange = useCallback((field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField])

  const sortedRecords = useMemo(() => {
    const sorted = [...attendanceRecords].sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'event_date':
          aValue = new Date(a.event_date)
          bValue = new Date(b.event_date)
          break
        case 'player_name':
          aValue = `${a.player.first_name} ${a.player.last_name}`
          bValue = `${b.player.first_name} ${b.player.last_name}`
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'team_name':
          aValue = a.team?.name || ''
          bValue = b.team?.name || ''
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [attendanceRecords, sortField, sortDirection])

  const attendanceStats: AttendanceStats = useMemo(() => {
    const stats: AttendanceStats = {
      totalRecords: attendanceRecords.length,
      presentCount: 0,
      absentCount: 0,
      excusedCount: 0,
      attendanceRate: 0,
      playerStats: {}
    }

    attendanceRecords.forEach(record => {
      // Overall stats
      switch (record.status) {
        case 'Present':
          stats.presentCount++
          break
        case 'Absent':
          stats.absentCount++
          break
        case 'Excused':
          stats.excusedCount++
          break
      }

      // Player-specific stats
      if (!stats.playerStats[record.player_id]) {
        stats.playerStats[record.player_id] = {
          present: 0,
          absent: 0,
          excused: 0,
          total: 0,
          rate: 0
        }
      }

      const playerStat = stats.playerStats[record.player_id]
      playerStat.total++

      switch (record.status) {
        case 'Present':
          playerStat.present++
          break
        case 'Absent':
          playerStat.absent++
          break
        case 'Excused':
          playerStat.excused++
          break
      }

      playerStat.rate = playerStat.total > 0 ? (playerStat.present / playerStat.total) * 100 : 0
    })

    stats.attendanceRate = stats.totalRecords > 0 ? (stats.presentCount / stats.totalRecords) * 100 : 0

    return stats
  }, [attendanceRecords])

  const exportToCSV = useCallback(() => {
    const headers = ['Date', 'Player Name', 'Status', 'Notes', 'Team']
    const csvData = [
      headers.join(','),
      ...sortedRecords.map(record => [
        record.event_date,
        `"${record.player.first_name} ${record.player.last_name}"`,
        record.status,
        `"${record.notes || ''}"`,
        `"${record.team?.name || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, [sortedRecords])

  const getStatusIcon = (status: 'Present' | 'Absent' | 'Excused') => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'Absent':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'Excused':
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ?
      <SortAsc className="w-4 h-4 ml-1" /> :
      <SortDesc className="w-4 h-4 ml-1" />
  }

  if (teamsApi.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full"
        />
      </div>
    )
  }

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
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-green-200/20 to-green-400/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <span className="gradient-text">Attendance Reports</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 dark:text-gray-400"
          >
            View historical attendance data and insights
          </motion.p>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Records',
              value: attendanceStats.totalRecords,
              icon: FileText,
              gradient: 'from-blue-500 to-blue-700'
            },
            {
              title: 'Present',
              value: attendanceStats.presentCount,
              icon: CheckCircle,
              gradient: 'from-green-500 to-green-700'
            },
            {
              title: 'Absent',
              value: attendanceStats.absentCount,
              icon: XCircle,
              gradient: 'from-red-500 to-red-700'
            },
            {
              title: 'Attendance Rate',
              value: `${attendanceStats.attendanceRate.toFixed(1)}%`,
              icon: TrendingUp,
              gradient: 'from-purple-500 to-purple-700'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="glass-card p-6 mb-8">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Team Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Team
              </label>
              <select
                value={filters.teamId}
                onChange={(e) => handleFilterChange('teamId', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Player Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Player
              </label>
              <select
                value={filters.playerId}
                onChange={(e) => handleFilterChange('playerId', e.target.value)}
                disabled={!filters.teamId}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm disabled:opacity-50"
              >
                <option value="">All Players</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.first_name} {player.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Excused">Excused</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportToCSV}
              disabled={sortedRecords.length === 0}
              className="button-primary flex items-center disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </motion.button>
          </div>
        </motion.div>

        {/* Attendance Records Table */}
        <motion.div variants={itemVariants} className="glass-card overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BarChart className="w-5 h-5 mr-2" />
              Attendance Records ({sortedRecords.length})
            </h2>
          </div>

          {attendanceApi.loading ? (
            <div className="p-12 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full mx-auto mb-4"
              />
              <p className="text-gray-500">Loading attendance records...</p>
            </div>
          ) : sortedRecords.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No attendance records found</p>
              <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('event_date')}
                    >
                      <div className="flex items-center">
                        Date
                        {getSortIcon('event_date')}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('player_name')}
                    >
                      <div className="flex items-center">
                        Player
                        {getSortIcon('player_name')}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Notes
                    </th>
                    {!filters.teamId && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleSort('team_name')}
                      >
                        <div className="flex items-center">
                          Team
                          {getSortIcon('team_name')}
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence>
                    {sortedRecords.map((record, index) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(record.event_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold mr-3">
                              {record.player.first_name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {record.player.first_name} {record.player.last_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(record.status)}
                            <span className="ml-2 text-sm text-gray-900 dark:text-white">
                              {record.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {record.notes || '-'}
                        </td>
                        {!filters.teamId && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.team?.name || '-'}
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* API Error Display */}
        {attendanceApi.error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center"
          >
            <XCircle className="w-5 h-5 text-red-500 mr-3" />
            <span className="text-red-700 dark:text-red-300">
              {attendanceApi.error}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}