import { useEffect, useState, useCallback } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Search,
  Edit,
  Users,
  AlertTriangle,
  UserPlus,
  Trash2,
  Shield,
  Calendar,
  Hash,
  MapPin,
  Sparkles,
  Zap,
  TrendingUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  email?: string
  phone?: string
  date_of_birth?: string
  organization: string
}

interface RosterEntry {
  id: number
  player_id: number
  team_id: number
  start_date: string
  end_date?: string
  jersey_number?: number
  position?: string
  created_at: string
  players: Player
  teams: Team
}

interface AddPlayerFormData {
  player_id: string
  jersey_number: string
  position: string
  start_date: string
}

interface EditRosterFormData {
  jersey_number: string
  position: string
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
} as const

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
} as const

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25
    }
  }
} as const

export default function TeamRosterManagement() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [rosterEntries, setRosterEntries] = useState<RosterEntry[]>([])
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Add Player Modal State
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false)
  const [addPlayerFormData, setAddPlayerFormData] = useState<AddPlayerFormData>({
    player_id: '',
    jersey_number: '',
    position: '',
    start_date: new Date().toISOString().split('T')[0]
  })
  const [addPlayerFormErrors, setAddPlayerFormErrors] = useState<Partial<AddPlayerFormData>>({})

  // Edit Roster Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRosterEntry, setSelectedRosterEntry] = useState<RosterEntry | null>(null)
  const [editFormData, setEditFormData] = useState<EditRosterFormData>({
    jersey_number: '',
    position: ''
  })
  const [editFormErrors, setEditFormErrors] = useState<Partial<EditRosterFormData>>({})

  // Remove Player Modal State
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [playerToRemove, setPlayerToRemove] = useState<RosterEntry | null>(null)

  const { data: teamsData, loading: teamsLoading, execute: executeTeamsApi } = useApi<{ teams: Team[] }>()
  const { data: rosterData, loading: rosterLoading, execute: executeRosterApi } = useApi<{ roster_entries: RosterEntry[] }>()
  const { data: playersData, loading: playersLoading, execute: executePlayersApi } = useApi<{ players: Player[] }>()
  const { loading: operationLoading, execute: executeOperation } = useApi()

  // Fetch teams on component mount
  useEffect(() => {
    fetchTeams()
  }, [])

  // Fetch roster when team is selected
  useEffect(() => {
    if (selectedTeam) {
      fetchTeamRoster(selectedTeam.id)
      fetchAvailablePlayers(selectedTeam.id)
    }
  }, [selectedTeam])

  const fetchTeams = async () => {
    try {
      const result = await executeTeamsApi('/api/teams')
      setTeams(result.teams || result)
    } catch (err) {
      setError('Failed to load teams')
    }
  }

  const fetchTeamRoster = async (teamId: number) => {
    try {
      const result = await executeRosterApi(`/api/rosters?team_id=${teamId}&is_active=true`)
      setRosterEntries(result.roster_entries || [])
    } catch (err) {
      setError('Failed to load team roster')
    }
  }

  const fetchAvailablePlayers = async (teamId: number) => {
    try {
      // Get all players first
      const allPlayersResult = await executePlayersApi('/api/players?limit=1000')
      const allPlayers = allPlayersResult.players || []

      // Get current roster to filter out players already on team
      const rosterResult = await executeRosterApi(`/api/rosters?team_id=${teamId}&is_active=true`)
      const currentRoster = rosterResult.roster_entries || []
      const rosterPlayerIds = currentRoster.map(entry => entry.player_id)

      // Filter out players already on roster
      const available = allPlayers.filter(player => !rosterPlayerIds.includes(player.id))
      setAvailablePlayers(available)
    } catch (err) {
      setError('Failed to load available players')
    }
  }

  const validateAddPlayerForm = (data: AddPlayerFormData): boolean => {
    const errors: Partial<AddPlayerFormData> = {}

    if (!data.player_id) {
      errors.player_id = 'Player selection is required'
    }
    if (!data.start_date) {
      errors.start_date = 'Start date is required'
    }
    if (data.jersey_number && (isNaN(Number(data.jersey_number)) || Number(data.jersey_number) < 0)) {
      errors.jersey_number = 'Jersey number must be a positive number'
    }

    // Check jersey number uniqueness
    if (data.jersey_number && rosterEntries.some(entry => entry.jersey_number === Number(data.jersey_number))) {
      errors.jersey_number = 'Jersey number is already taken'
    }

    setAddPlayerFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateEditForm = (data: EditRosterFormData): boolean => {
    const errors: Partial<EditRosterFormData> = {}

    if (data.jersey_number && (isNaN(Number(data.jersey_number)) || Number(data.jersey_number) < 0)) {
      errors.jersey_number = 'Jersey number must be a positive number'
    }

    // Check jersey number uniqueness (excluding current entry)
    if (data.jersey_number && selectedRosterEntry) {
      const existingEntry = rosterEntries.find(entry =>
        entry.jersey_number === Number(data.jersey_number) && entry.id !== selectedRosterEntry.id
      )
      if (existingEntry) {
        errors.jersey_number = 'Jersey number is already taken'
      }
    }

    setEditFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddPlayer = async () => {
    if (!validateAddPlayerForm(addPlayerFormData) || !selectedTeam) return

    try {
      await executeOperation('/api/rosters', {
        method: 'POST',
        body: {
          player_id: Number(addPlayerFormData.player_id),
          team_id: selectedTeam.id,
          start_date: addPlayerFormData.start_date,
          jersey_number: addPlayerFormData.jersey_number ? Number(addPlayerFormData.jersey_number) : null,
          position: addPlayerFormData.position || null
        }
      })

      setSuccessMessage('Player added to roster successfully')
      setShowAddPlayerModal(false)
      resetAddPlayerForm()

      // Refresh data
      await fetchTeamRoster(selectedTeam.id)
      await fetchAvailablePlayers(selectedTeam.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player to roster')
    }
  }

  const handleEditRoster = async () => {
    if (!validateEditForm(editFormData) || !selectedRosterEntry) return

    try {
      await executeOperation(`/api/rosters/${selectedRosterEntry.id}`, {
        method: 'PUT',
        body: {
          jersey_number: editFormData.jersey_number ? Number(editFormData.jersey_number) : null,
          position: editFormData.position || null
        }
      })

      setSuccessMessage('Roster entry updated successfully')
      setShowEditModal(false)
      setSelectedRosterEntry(null)
      resetEditForm()

      // Refresh roster
      if (selectedTeam) {
        await fetchTeamRoster(selectedTeam.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update roster entry')
    }
  }

  const handleRemovePlayer = async () => {
    if (!playerToRemove) return

    try {
      await executeOperation(`/api/rosters/${playerToRemove.id}`, {
        method: 'DELETE'
      })

      setSuccessMessage(`${playerToRemove.players.first_name} ${playerToRemove.players.last_name} removed from roster`)
      setShowRemoveModal(false)
      setPlayerToRemove(null)

      // Refresh data
      if (selectedTeam) {
        await fetchTeamRoster(selectedTeam.id)
        await fetchAvailablePlayers(selectedTeam.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove player from roster')
    }
  }

  const resetAddPlayerForm = () => {
    setAddPlayerFormData({
      player_id: '',
      jersey_number: '',
      position: '',
      start_date: new Date().toISOString().split('T')[0]
    })
    setAddPlayerFormErrors({})
  }

  const resetEditForm = () => {
    setEditFormData({
      jersey_number: '',
      position: ''
    })
    setEditFormErrors({})
  }

  const openAddPlayerModal = () => {
    resetAddPlayerForm()
    setShowAddPlayerModal(true)
  }

  const openEditModal = (entry: RosterEntry) => {
    setSelectedRosterEntry(entry)
    setEditFormData({
      jersey_number: entry.jersey_number?.toString() || '',
      position: entry.position || ''
    })
    setEditFormErrors({})
    setShowEditModal(true)
  }

  const openRemoveModal = (entry: RosterEntry) => {
    setPlayerToRemove(entry)
    setShowRemoveModal(true)
  }

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const isLoading = teamsLoading || rosterLoading || playersLoading || operationLoading

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="min-h-screen relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, -100, 0],
            y: [0, -100, 100, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-r from-gray-200/20 to-gray-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 150, 0],
            y: [0, 150, -150, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-gradient-to-r from-gray-300/20 to-gray-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="glass-card glass-card-hover p-8 flex items-center justify-between"
        >
          <div>
            <motion.h1
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 100,
                delay: 0.1
              }}
              className="text-5xl font-black mb-2"
            >
              <span className="gradient-text">Team Roster</span>
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-400 text-lg"
            >
              Manage team rosters, player assignments, and positions
            </motion.p>
          </div>
          {selectedTeam && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openAddPlayerModal}
              className="button-primary"
              disabled={isLoading}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Add Player</span>
            </motion.button>
          )}
        </motion.div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-6 border-green-500/20 bg-green-50/50 dark:bg-green-900/20"
            >
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <Sparkles className="h-4 w-4" />
                <span>{successMessage}</span>
              </div>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-6 border-red-500/20 bg-red-50/50 dark:bg-red-900/20"
            >
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Team Selection */}
        <motion.div
          variants={itemVariants}
          className="glass-card glass-card-hover p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-gray-600" />
            Select Team
          </h2>
          <Select
            value={selectedTeam?.id.toString() || ''}
            onValueChange={(value) => {
              const team = teams.find(t => t.id.toString() === value)
              setSelectedTeam(team || null)
            }}
          >
            <SelectTrigger className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
              <SelectValue placeholder="Choose a team to manage..." />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name} - {team.organization}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Team Info & Stats */}
        {selectedTeam && (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            {[
              { label: 'Team', value: selectedTeam.name, icon: Shield, gradient: 'from-gray-700 to-gray-900' },
              { label: 'Organization', value: selectedTeam.organization, icon: Users, gradient: 'from-gray-600 to-gray-800' },
              { label: 'Roster Size', value: rosterEntries.length, icon: TrendingUp, gradient: 'from-gray-800 to-black' },
              { label: 'Available Players', value: availablePlayers.length, icon: Zap, gradient: 'from-gray-700 to-gray-900' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="glass-card p-4 flex items-center space-x-4"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient}`}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Roster Table */}
        {selectedTeam && (
          <motion.div
            variants={itemVariants}
            className="glass-card glass-card-hover p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Users className="w-5 h-5 mr-2 text-gray-600" />
              Current Roster
            </h2>

            {rosterLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full"
                />
              </div>
            ) : rosterEntries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No players on roster
                </h3>
                <p className="text-gray-500 mb-6">
                  Get started by adding players to this team
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openAddPlayerModal}
                  className="button-primary"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Add First Player</span>
                </motion.button>
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Player</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Jersey #</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Position</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Start Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {rosterEntries.map((entry, index) => (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100/50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-sm">
                                {entry.players.first_name.charAt(0)}{entry.players.last_name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {entry.players.first_name} {entry.players.last_name}
                                </p>
                                <p className="text-sm text-gray-500">{entry.players.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              {entry.jersey_number ? (
                                <>
                                  <Hash className="w-4 h-4 text-gray-400 mr-1" />
                                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                                    {entry.jersey_number}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-400 italic">Not assigned</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              {entry.position ? (
                                <>
                                  <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                                  <span className="text-gray-900 dark:text-white">{entry.position}</span>
                                </>
                              ) : (
                                <span className="text-gray-400 italic">Not specified</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>{new Date(entry.start_date).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openEditModal(entry)}
                                className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openRemoveModal(entry)}
                                className="p-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Add Player Modal */}
        <Dialog open={showAddPlayerModal} onOpenChange={setShowAddPlayerModal}>
          <DialogContent className="glass-card glass-card-hover max-w-md">
            <DialogHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
              </div>
              <DialogTitle className="gradient-text text-2xl font-bold">Add Player to Roster</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a player to {selectedTeam?.name} roster
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Player *
                </label>
                <Select
                  value={addPlayerFormData.player_id}
                  onValueChange={(value) => setAddPlayerFormData({ ...addPlayerFormData, player_id: value })}
                >
                  <SelectTrigger className={`w-full ${addPlayerFormErrors.player_id ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select a player..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.first_name} {player.last_name} - {player.organization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addPlayerFormErrors.player_id && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {addPlayerFormErrors.player_id}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jersey Number
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={addPlayerFormData.jersey_number}
                    onChange={(e) => setAddPlayerFormData({ ...addPlayerFormData, jersey_number: e.target.value })}
                    placeholder="10"
                    className={addPlayerFormErrors.jersey_number ? 'border-red-500' : ''}
                  />
                  {addPlayerFormErrors.jersey_number && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {addPlayerFormErrors.jersey_number}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position
                  </label>
                  <Input
                    value={addPlayerFormData.position}
                    onChange={(e) => setAddPlayerFormData({ ...addPlayerFormData, position: e.target.value })}
                    placeholder="Forward, Defense..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={addPlayerFormData.start_date}
                  onChange={(e) => setAddPlayerFormData({ ...addPlayerFormData, start_date: e.target.value })}
                  className={addPlayerFormErrors.start_date ? 'border-red-500' : ''}
                />
                {addPlayerFormErrors.start_date && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {addPlayerFormErrors.start_date}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddPlayerModal(false)}>
                Cancel
              </Button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddPlayer}
                disabled={operationLoading}
                className="button-primary"
              >
                {operationLoading ? 'Adding...' : 'Add to Roster'}
              </motion.button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Roster Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="glass-card glass-card-hover max-w-md">
            <DialogHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                  <Edit className="w-6 h-6 text-white" />
                </div>
              </div>
              <DialogTitle className="gradient-text text-2xl font-bold">Edit Roster Entry</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Update {selectedRosterEntry?.players.first_name} {selectedRosterEntry?.players.last_name}'s roster details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jersey Number
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={editFormData.jersey_number}
                    onChange={(e) => setEditFormData({ ...editFormData, jersey_number: e.target.value })}
                    placeholder="10"
                    className={editFormErrors.jersey_number ? 'border-red-500' : ''}
                  />
                  {editFormErrors.jersey_number && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {editFormErrors.jersey_number}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position
                  </label>
                  <Input
                    value={editFormData.position}
                    onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                    placeholder="Forward, Defense..."
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEditRoster}
                disabled={operationLoading}
                className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200"
              >
                {operationLoading ? 'Updating...' : 'Update'}
              </motion.button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Player Confirmation Modal */}
        <Dialog open={showRemoveModal} onOpenChange={setShowRemoveModal}>
          <DialogContent className="glass-card glass-card-hover max-w-md">
            <DialogHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg">
                  <Trash2 className="w-6 h-6 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-red-600 dark:text-red-400">Remove Player</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Are you sure you want to remove {playerToRemove?.players.first_name} {playerToRemove?.players.last_name} from the roster?
              </DialogDescription>
            </DialogHeader>

            <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300 text-sm">
                This action will end their active roster entry. This cannot be undone.
              </p>
            </div>

            <DialogFooter className="gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowRemoveModal(false)}>
                Cancel
              </Button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRemovePlayer}
                disabled={operationLoading}
                className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200"
              >
                {operationLoading ? 'Removing...' : 'Remove Player'}
              </motion.button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  )
}