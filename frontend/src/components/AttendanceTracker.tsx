import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Users, CheckCircle, XCircle, Clock, Save, AlertCircle, FileText } from 'lucide-react'
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

interface RosterEntry {
  id: number
  player_id: number
  team_id: number
  start_date: string
  end_date?: string
  jersey_number?: number
  position?: string
  player: Player
}

interface AttendanceRecord {
  id: number
  player_id: number
  team_id: number
  event_date: string
  status: 'Present' | 'Absent' | 'Excused'
  notes?: string
  player: Player
}

interface AttendanceFormData {
  player_id: number
  status: 'Present' | 'Absent' | 'Excused'
  notes: string
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

export default function AttendanceTracker() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [rosterEntries, setRosterEntries] = useState<RosterEntry[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [attendanceData, setAttendanceData] = useState<{ [playerId: number]: AttendanceFormData }>({})
  const [validationErrors, setValidationErrors] = useState<{ [playerId: number]: string }>({})
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)

  const teamsApi = useApi<{ teams: Team[] }>()
  const rosterApi = useApi<{ roster_entries: RosterEntry[] }>()
  const attendanceApi = useApi<{ attendance_records: AttendanceRecord[] }>()
  const saveApi = useApi()

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      fetchRoster()
      fetchExistingAttendance()
    }
  }, [selectedTeamId, selectedDate])

  const fetchTeams = async () => {
    try {
      const response = await teamsApi.execute('/api/teams')
      setTeams(response.teams || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchRoster = async () => {
    if (!selectedTeamId) return

    try {
      const response = await rosterApi.execute(`/api/rosters?team_id=${selectedTeamId}&active_only=true`)
      setRosterEntries(response.roster_entries || [])
    } catch (error) {
      console.error('Error fetching roster:', error)
    }
  }

  const fetchExistingAttendance = async () => {
    if (!selectedTeamId || !selectedDate) return

    try {
      const response = await attendanceApi.execute(
        `/api/attendance?team_id=${selectedTeamId}&event_date_start=${selectedDate}&event_date_end=${selectedDate}`
      )
      const records = response.attendance_records || []
      setAttendanceRecords(records)

      // Populate attendance data with existing records
      const existingData: { [playerId: number]: AttendanceFormData } = {}
      records.forEach((record: AttendanceRecord) => {
        existingData[record.player_id] = {
          player_id: record.player_id,
          status: record.status,
          notes: record.notes || ''
        }
      })
      setAttendanceData(existingData)
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      setAttendanceRecords([])
      setAttendanceData({})
    }
  }

  const handleAttendanceChange = useCallback((playerId: number, field: 'status' | 'notes', value: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        player_id: playerId,
        [field]: value,
        status: field === 'status' ? value as 'Present' | 'Absent' | 'Excused' : (prev[playerId]?.status || 'Present')
      }
    }))

    // Clear validation error when user makes changes
    if (validationErrors[playerId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[playerId]
        return newErrors
      })
    }
  }, [validationErrors])

  const validateAttendanceData = (): boolean => {
    const errors: { [playerId: number]: string } = {}
    let isValid = true

    rosterEntries.forEach(entry => {
      const attendance = attendanceData[entry.player_id]
      if (!attendance || !attendance.status) {
        errors[entry.player_id] = 'Attendance status is required'
        isValid = false
      }
    })

    setValidationErrors(errors)
    return isValid
  }

  const saveAttendance = async () => {
    if (!selectedTeamId || !selectedDate) {
      return
    }

    if (!validateAttendanceData()) {
      return
    }

    try {
      setSaveSuccess(false)
      const promises: Promise<any>[] = []

      for (const entry of rosterEntries) {
        const attendance = attendanceData[entry.player_id]
        if (!attendance) continue

        const existingRecord = attendanceRecords.find(r => r.player_id === entry.player_id)

        if (existingRecord) {
          // Update existing record
          promises.push(
            saveApi.execute(`/api/attendance/${existingRecord.id}`, {
              method: 'PUT',
              body: {
                status: attendance.status,
                notes: attendance.notes || null
              }
            })
          )
        } else {
          // Create new record
          promises.push(
            saveApi.execute('/api/attendance', {
              method: 'POST',
              body: {
                player_id: entry.player_id,
                team_id: Number(selectedTeamId),
                event_date: selectedDate,
                status: attendance.status,
                notes: attendance.notes || null
              }
            })
          )
        }
      }

      await Promise.all(promises)
      setSaveSuccess(true)
      await fetchExistingAttendance() // Refresh data

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving attendance:', error)
    }
  }

  const getStatusIcon = (status: 'Present' | 'Absent' | 'Excused') => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'Absent':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'Excused':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: 'Present' | 'Absent' | 'Excused') => {
    switch (status) {
      case 'Present':
        return 'from-green-500 to-green-700'
      case 'Absent':
        return 'from-red-500 to-red-700'
      case 'Excused':
        return 'from-yellow-500 to-yellow-700'
      default:
        return 'from-gray-500 to-gray-700'
    }
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
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-blue-400/20 rounded-full blur-3xl"
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
            <span className="gradient-text">Attendance Tracker</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 dark:text-gray-400"
          >
            Record and track player attendance for team activities
          </motion.p>
        </motion.div>

        {/* Team and Date Selection */}
        <motion.div variants={itemVariants} className="glass-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Select Team
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a team...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} - {team.organization}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Event Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center"
            >
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-green-700 dark:text-green-300">
                Attendance records saved successfully!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player Attendance List */}
        {selectedTeamId && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Users className="w-6 h-6 mr-3 text-blue-600" />
                Player Attendance
              </h2>
              {rosterEntries.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveAttendance}
                  disabled={saveApi.loading}
                  className="button-primary flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveApi.loading ? 'Saving...' : 'Save Attendance'}
                </motion.button>
              )}
            </div>

            {rosterApi.loading ? (
              <div className="glass-card p-12 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full mx-auto mb-4"
                />
                <p className="text-gray-500">Loading roster...</p>
              </div>
            ) : rosterEntries.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No active players found for this team</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rosterEntries.map((entry, index) => {
                  const attendance = attendanceData[entry.player_id] || { status: 'Present', notes: '' }
                  const hasError = validationErrors[entry.player_id]

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        delay: index * 0.05
                      }}
                      className={`glass-card p-6 ${hasError ? 'border-red-300 dark:border-red-700' : ''}`}
                    >
                      <div className="flex flex-col space-y-4">
                        {/* Player Info and Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                              {entry.jersey_number || entry.player.first_name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {entry.player.first_name} {entry.player.last_name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {entry.position && `${entry.position} • `}
                                Jersey #{entry.jersey_number || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Status Buttons */}
                          <div className="flex space-x-2">
                            {(['Present', 'Absent', 'Excused'] as const).map((status) => (
                              <motion.button
                                key={status}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleAttendanceChange(entry.player_id, 'status', status)}
                                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                                  attendance.status === status
                                    ? `bg-gradient-to-r ${getStatusColor(status)} text-white shadow-lg`
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                              >
                                {getStatusIcon(status)}
                                <span className="text-sm font-medium">{status}</span>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <FileText className="w-4 h-4 inline mr-2" />
                            Notes (optional)
                          </label>
                          <textarea
                            value={attendance.notes}
                            onChange={(e) => handleAttendanceChange(entry.player_id, 'notes', e.target.value)}
                            placeholder="Add any notes about this player's attendance..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                        </div>

                        {/* Validation Error */}
                        {hasError && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center text-red-600 dark:text-red-400 text-sm"
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            {hasError}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* API Error Display */}
            {(saveApi.error || attendanceApi.error) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center"
              >
                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                <span className="text-red-700 dark:text-red-300">
                  {saveApi.error || attendanceApi.error}
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}