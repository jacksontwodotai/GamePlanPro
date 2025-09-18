import { useEffect, useState, useCallback, useRef } from 'react'
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
import { Search, Edit, Users, AlertTriangle, Phone, Mail, Calendar, ChevronLeft, ChevronRight, UserPlus, Sparkles, Zap, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Player {
  id: number
  first_name: string
  last_name: string
  email?: string // Legacy field - kept for backwards compatibility
  phone?: string // Legacy field - kept for backwards compatibility
  player_email?: string // New unique email field
  player_phone?: string // New phone field
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  organization: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relation?: string
  medical_alerts?: string
  address?: string
  parent_guardian_name?: string
  parent_guardian_email?: string
  parent_guardian_phone?: string
  equipment_notes?: string
  created_at: string
  updated_at?: string
  uuid?: string
}

interface Team {
  id: number
  name: string
  organization: string
  division?: string
  age_group?: string
  skill_level?: string
}

interface RosterFormData {
  team_id: string
  start_date: string
  jersey_number: string
  position: string
}

interface PlayerFormData {
  first_name: string
  last_name: string
  email: string // Legacy field for backwards compatibility
  phone: string // Legacy field for backwards compatibility
  player_email: string // New unique email field
  player_phone: string // New phone field
  date_of_birth: string
  gender: string
  organization: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relation: string
  medical_alerts: string
  address: string
  parent_guardian_name: string
  parent_guardian_email: string
  parent_guardian_phone: string
  equipment_notes: string
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

export default function PlayerManagementInterface() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const playersPerPage = 9
  const abortControllerRef = useRef<AbortController | null>(null)

  // Roster assignment state
  const [showRosterModal, setShowRosterModal] = useState(false)
  const [selectedPlayerForRoster, setSelectedPlayerForRoster] = useState<Player | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [rosterFormData, setRosterFormData] = useState<RosterFormData>({
    team_id: '',
    start_date: '',
    jersey_number: '',
    position: ''
  })
  const [rosterFormErrors, setRosterFormErrors] = useState<Partial<RosterFormData>>({})
  const [rosterFormLoading, setRosterFormLoading] = useState(false)

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [formData, setFormData] = useState<PlayerFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    organization: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    medical_alerts: '',
    address: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<PlayerFormData>>({})

  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setCurrentPage(1)
    }
  }, [debouncedSearchTerm])

  useEffect(() => {
    fetchPlayers()
    fetchTeams()
  }, [fetchPlayers])

  // Cleanup: abort any pending requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const fetchPlayers = useCallback(async () => {
    try {
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController()

      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: playersPerPage.toString()
      })

      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm)
      }

      const response = await fetch(`/api/players?${params}`, {
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to fetch players')
      }

      const data = await response.json()
      setPlayers(data.players || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalPlayers(data.pagination?.total || 0)
      setError(null)
    } catch (err) {
      // Don't show error if request was aborted (user is still typing)
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Failed to load players')
        console.error('Fetch players error:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearchTerm])

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      const data = await response.json()
      setTeams(data.teams || data)
    } catch (err) {
      console.error('Fetch teams error:', err)
    }
  }

  const validateForm = (data: PlayerFormData): boolean => {
    const errors: Partial<PlayerFormData> = {}

    // Required field validation
    if (!data.first_name.trim()) {
      errors.first_name = 'First name is required'
    }
    if (!data.last_name.trim()) {
      errors.last_name = 'Last name is required'
    }
    if (!data.organization.trim()) {
      errors.organization = 'Organization is required'
    }

    // Email format validation for legacy email field
    if (data.email && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email.trim())) {
        errors.email = 'Please enter a valid email address'
      }
    }

    // Email format validation for new player_email field
    if (data.player_email && data.player_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.player_email.trim())) {
        errors.player_email = 'Please enter a valid email address'
      }
    }

    // Parent/Guardian email validation
    if (data.parent_guardian_email && data.parent_guardian_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.parent_guardian_email.trim())) {
        errors.parent_guardian_email = 'Please enter a valid email address'
      }
    }

    // Phone format validation for legacy phone field
    if (data.phone && data.phone.trim()) {
      const phoneRegex = /^[+]?[\d\s()-.]{10,}$/
      const digitCount = data.phone.replace(/\D/g, '').length
      if (!phoneRegex.test(data.phone) || digitCount < 10) {
        errors.phone = 'Please enter a valid phone number (minimum 10 digits)'
      }
    }

    // Phone format validation for new player_phone field
    if (data.player_phone && data.player_phone.trim()) {
      const phoneRegex = /^[+]?[\d\s()-.]{10,}$/
      const digitCount = data.player_phone.replace(/\D/g, '').length
      if (!phoneRegex.test(data.player_phone) || digitCount < 10) {
        errors.player_phone = 'Please enter a valid phone number (minimum 10 digits)'
      }
    }

    // Parent/Guardian phone validation
    if (data.parent_guardian_phone && data.parent_guardian_phone.trim()) {
      const phoneRegex = /^[+]?[\d\s()-.]{10,}$/
      const digitCount = data.parent_guardian_phone.replace(/\D/g, '').length
      if (!phoneRegex.test(data.parent_guardian_phone) || digitCount < 10) {
        errors.parent_guardian_phone = 'Please enter a valid phone number (minimum 10 digits)'
      }
    }

    // Emergency contact phone validation
    if (data.emergency_contact_phone && data.emergency_contact_phone.trim()) {
      const phoneRegex = /^[+]?[\d\s()-.]{10,}$/
      const digitCount = data.emergency_contact_phone.replace(/\D/g, '').length
      if (!phoneRegex.test(data.emergency_contact_phone) || digitCount < 10) {
        errors.emergency_contact_phone = 'Please enter a valid emergency contact phone number'
      }
    }

    // Date of birth validation (optional but if provided, should be valid and reasonable)
    if (data.date_of_birth) {
      const birthDate = new Date(data.date_of_birth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()

      if (birthDate > today) {
        errors.date_of_birth = 'Date of birth cannot be in the future'
      } else if (age > 120) {
        errors.date_of_birth = 'Please enter a valid date of birth'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateRosterForm = (data: RosterFormData): boolean => {
    const errors: Partial<RosterFormData> = {}

    if (!data.team_id) {
      errors.team_id = 'Team selection is required'
    }
    if (!data.start_date) {
      errors.start_date = 'Start date is required'
    }

    setRosterFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreatePlayer = async () => {
    if (!validateForm(formData)) return

    try {
      setFormLoading(true)
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create player')
      }

      await fetchPlayers()
      setShowCreateForm(false)
      resetForm()
    } catch (err) {
      console.error('Create player error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create player')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditPlayer = async () => {
    if (!selectedPlayer || !validateForm(formData)) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/players/${selectedPlayer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update player')
      }

      await fetchPlayers()
      setShowEditForm(false)
      resetForm()
      setSelectedPlayer(null)
    } catch (err) {
      console.error('Update player error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update player')
    } finally {
      setFormLoading(false)
    }
  }

  const handleAssignToTeam = async () => {
    if (!selectedPlayerForRoster || !validateRosterForm(rosterFormData)) return

    try {
      setRosterFormLoading(true)
      const response = await fetch('/api/roster-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: selectedPlayerForRoster.id,
          ...rosterFormData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign player to team')
      }

      setShowRosterModal(false)
      resetRosterForm()
      setSelectedPlayerForRoster(null)
      // Show success message
      alert(`${selectedPlayerForRoster.first_name} ${selectedPlayerForRoster.last_name} has been assigned to the team`)
    } catch (err) {
      console.error('Assign to team error:', err)
      setError(err instanceof Error ? err.message : 'Failed to assign player to team')
    } finally {
      setRosterFormLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      player_email: '',
      player_phone: '',
      date_of_birth: '',
      gender: '',
      organization: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: '',
      medical_alerts: '',
      address: '',
      parent_guardian_name: '',
      parent_guardian_email: '',
      parent_guardian_phone: '',
      equipment_notes: ''
    })
    setFormErrors({})
  }

  const resetRosterForm = () => {
    setRosterFormData({
      team_id: '',
      start_date: '',
      jersey_number: '',
      position: ''
    })
    setRosterFormErrors({})
  }

  const openCreateForm = () => {
    resetForm()
    setShowCreateForm(true)
  }

  const openEditForm = (player: Player) => {
    setSelectedPlayer(player)
    setFormData({
      first_name: player.first_name,
      last_name: player.last_name,
      email: player.email || '',
      phone: player.phone || '',
      player_email: player.player_email || '',
      player_phone: player.player_phone || '',
      date_of_birth: player.date_of_birth || '',
      gender: player.gender || '',
      organization: player.organization,
      emergency_contact_name: player.emergency_contact_name || '',
      emergency_contact_phone: player.emergency_contact_phone || '',
      emergency_contact_relation: player.emergency_contact_relation || '',
      medical_alerts: player.medical_alerts || '',
      address: player.address || '',
      parent_guardian_name: player.parent_guardian_name || '',
      parent_guardian_email: player.parent_guardian_email || '',
      parent_guardian_phone: player.parent_guardian_phone || '',
      equipment_notes: player.equipment_notes || ''
    })
    setFormErrors({})
    setShowEditForm(true)
  }

  /*
  const openDeleteDialog = (player: Player) => {
    setSelectedPlayer(player)
    setShowDeleteDialog(true)
  }
  */

  const openRosterModal = (player: Player) => {
    setSelectedPlayerForRoster(player)
    resetRosterForm()
    setShowRosterModal(true)
  }

  const openViewModal = (player: Player) => {
    setSelectedPlayer(player)
    setShowViewModal(true)
  }

  if (loading && players.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen relative">
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
              <span className="gradient-text">Players</span>
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-400 text-lg"
            >
              Manage your players and roster assignments
            </motion.p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateForm}
            className="button-primary"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Add Player</span>
          </motion.button>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Players', value: totalPlayers, icon: Users, gradient: 'from-gray-600 to-gray-800' },
            { label: 'Active Teams', value: teams.length, icon: Heart, gradient: 'from-gray-700 to-gray-900' },
            { label: 'Current Page', value: `${currentPage}/${totalPages}`, icon: Calendar, gradient: 'from-gray-500 to-gray-700' },
            { label: 'Per Page', value: playersPerPage, icon: Zap, gradient: 'from-gray-800 to-black' },
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

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-6 border-red-500/20"
            >
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <motion.div
          variants={itemVariants}
          className="glass-card glass-card-hover p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-gray-600" />
            Search Players
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
            />
            {/* Show spinner when search is debouncing */}
            {searchTerm !== debouncedSearchTerm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-3 top-3"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"
                />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Players Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="wait">
            {!loading && (
              <motion.div
                key={debouncedSearchTerm + currentPage} // Stable key prevents animation conflicts
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="contents" // Use contents to avoid extra wrapper
              >
                {players.map((player, index) => (
                  <motion.div
                    key={player.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    custom={index}
                    className="relative group"
                  >
                <motion.div
                  variants={cardHoverVariants}
                  className="glass-card glass-card-hover p-6 h-full relative overflow-hidden glow-border"
                >
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 opacity-5 group-hover:opacity-10 transition-opacity duration-300" />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        >
                          {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {player.first_name} {player.last_name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{player.organization}</p>
                        </div>
                      </div>
                      <motion.div
                        animate={{
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="text-gray-400"
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                    </div>

                    <div className="space-y-2 text-sm mb-6">
                      {player.email && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4 mr-2" />
                          <span className="truncate">{player.email}</span>
                        </div>
                      )}
                      {player.phone && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{player.phone}</span>
                        </div>
                      )}
                      {player.date_of_birth && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{new Date(player.date_of_birth).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openViewModal(player)}
                        className="px-2 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-shadow"
                      >
                        View
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openEditForm(player)}
                        className="px-2 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openRosterModal(player)}
                        className="px-2 py-2 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-shadow"
                      >
                        Assign
                      </motion.button>
                    </div>
                  </div>

                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </motion.div>
                </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pagination */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center space-x-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <div className="flex items-center space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = i + 1
              return (
                <motion.button
                  key={pageNumber}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    currentPage === pageNumber
                      ? 'bg-gradient-to-r from-gray-800 to-black text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {pageNumber}
                </motion.button>
              )
            })}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Empty State */}
        <AnimatePresence>
          {players.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card p-12 text-center"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Users className="h-16 w-16 mx-auto text-gray-300 mb-6" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                {searchTerm ? 'No players found' : 'No players yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first player'
                }
              </p>
              {!searchTerm && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openCreateForm}
                  className="button-primary"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Add Player</span>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* All Dialogs remain similar but with updated glassmorphism styling */}
        {/* Create Player Dialog */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="glass-card glass-card-hover max-w-3xl max-h-[90vh] overflow-y-auto animate-scale">
            <DialogHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg glow-border floating-element">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
              </div>
              <DialogTitle className="gradient-text text-3xl font-bold">Add New Player</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Enter player information to add them to your team
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">First Name *</label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Enter first name"
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                        formErrors.first_name
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-border focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                      }`}
                    />
                    {formErrors.first_name && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {formErrors.first_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Last Name *</label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Enter last name"
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                        formErrors.last_name
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-border focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                      }`}
                    />
                    {formErrors.last_name && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {formErrors.last_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="player@example.com"
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                        formErrors.email
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-border focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                        formErrors.phone
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-border focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {formErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Date of Birth</label>
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground transition-all duration-200 ${
                        formErrors.date_of_birth
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-border focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                      }`}
                    />
                    {formErrors.date_of_birth && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {formErrors.date_of_birth}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Organization *</label>
                    <Input
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="Enter organization"
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                        formErrors.organization
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-border focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                      }`}
                    />
                    {formErrors.organization && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {formErrors.organization}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, City, State, ZIP"
                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="space-y-4 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Contact Name</label>
                    <Input
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      placeholder="Emergency contact name"
                      className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Contact Phone</label>
                    <Input
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      placeholder="Emergency contact phone"
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                        formErrors.emergency_contact_phone
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-border focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                      }`}
                    />
                    {formErrors.emergency_contact_phone && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {formErrors.emergency_contact_phone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Relationship</label>
                    <Input
                      value={formData.emergency_contact_relation}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                      placeholder="Parent, Guardian, etc."
                      className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information Section */}
              <div className="space-y-4 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-green-600" />
                  Medical Information
                </h3>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Medical Alerts & Notes</label>
                  <textarea
                    value={formData.medical_alerts}
                    onChange={(e) => setFormData({ ...formData, medical_alerts: e.target.value })}
                    rows={3}
                    placeholder="Enter any medical conditions, allergies, or important notes..."
                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 pt-6 border-t border-border gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-3 border-2 border-border hover:bg-secondary transition-all duration-200"
              >
                Cancel
              </Button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreatePlayer}
                disabled={formLoading}
                className="button-primary px-8 py-3 text-base font-semibold"
              >
                <span>{formLoading ? 'Creating Player...' : 'Create Player'}</span>
              </motion.button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Player Details Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="glass-card glass-card-hover max-w-2xl">
            <DialogHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg glow-border">
                  <span className="text-white font-bold text-xl">
                    {selectedPlayer?.first_name.charAt(0)}{selectedPlayer?.last_name.charAt(0)}
                  </span>
                </div>
              </div>
              <DialogTitle className="gradient-text text-3xl font-bold">
                {selectedPlayer?.first_name} {selectedPlayer?.last_name}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Player Profile Details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Organization</label>
                    <p className="text-foreground">{selectedPlayer?.organization || 'Not specified'}</p>
                  </div>
                  {selectedPlayer?.email && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        {selectedPlayer.email}
                      </p>
                    </div>
                  )}
                  {selectedPlayer?.phone && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="text-foreground flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        {selectedPlayer.phone}
                      </p>
                    </div>
                  )}
                  {selectedPlayer?.date_of_birth && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                      <p className="text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        {new Date(selectedPlayer.date_of_birth).toLocaleDateString()}
                        <span className="text-sm text-muted-foreground">
                          (Age: {Math.floor((Date.now() - new Date(selectedPlayer.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))})
                        </span>
                      </p>
                    </div>
                  )}
                  {selectedPlayer?.address && (
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Address</label>
                      <p className="text-foreground">{selectedPlayer.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              {(selectedPlayer?.emergency_contact_name || selectedPlayer?.emergency_contact_phone) && (
                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-600" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedPlayer?.emergency_contact_name && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Contact Name</label>
                        <p className="text-foreground">{selectedPlayer.emergency_contact_name}</p>
                      </div>
                    )}
                    {selectedPlayer?.emergency_contact_phone && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Contact Phone</label>
                        <p className="text-foreground">{selectedPlayer.emergency_contact_phone}</p>
                      </div>
                    )}
                    {selectedPlayer?.emergency_contact_relation && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                        <p className="text-foreground">{selectedPlayer.emergency_contact_relation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Medical Information */}
              {selectedPlayer?.medical_alerts && (
                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Medical Information
                  </h3>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
                    <p className="text-foreground">{selectedPlayer.medical_alerts}</p>
                  </div>
                </div>
              )}

              {/* Account Information */}
              <div className="space-y-4 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Account Information
                </h3>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <p className="text-foreground">
                    {new Date(selectedPlayer?.created_at || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 pt-6 border-t border-border gap-3">
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
                className="px-6 py-3"
              >
                Close
              </Button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowViewModal(false)
                  if (selectedPlayer) {
                    openEditForm(selectedPlayer)
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Edit Player
              </motion.button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Player Dialog */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="glass-card glass-card-hover max-w-3xl max-h-[90vh] overflow-y-auto animate-scale">
            <DialogHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg glow-border floating-element">
                  <Edit className="w-6 h-6 text-white" />
                </div>
              </div>
              <DialogTitle className="gradient-text text-3xl font-bold">Edit Player</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Update {selectedPlayer?.first_name} {selectedPlayer?.last_name}'s information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">First Name *</label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Enter first name"
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                        formErrors.first_name
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.first_name && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {formErrors.first_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Last Name *</label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Enter last name"
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                        formErrors.last_name
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.last_name && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {formErrors.last_name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="player@example.com"
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                        formErrors.email
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                        formErrors.phone
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {formErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Date of Birth</label>
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground transition-all duration-200 ${
                        formErrors.date_of_birth
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.date_of_birth && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {formErrors.date_of_birth}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Organization *</label>
                    <Input
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="Enter organization"
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                        formErrors.organization
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.organization && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {formErrors.organization}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, City, State, ZIP"
                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="space-y-4 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Contact Name</label>
                    <Input
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      placeholder="Emergency contact name"
                      className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Contact Phone</label>
                    <Input
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      placeholder="Emergency contact phone"
                      className={`w-full px-4 py-3 rounded-lg border-2 bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                        formErrors.emergency_contact_phone
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.emergency_contact_phone && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {formErrors.emergency_contact_phone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Relationship</label>
                    <Input
                      value={formData.emergency_contact_relation}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                      placeholder="Parent, Guardian, etc."
                      className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information Section */}
              <div className="space-y-4 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                  Medical Information
                </h3>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Medical Alerts & Notes</label>
                  <textarea
                    value={formData.medical_alerts}
                    onChange={(e) => setFormData({ ...formData, medical_alerts: e.target.value })}
                    rows={3}
                    placeholder="Enter any medical conditions, allergies, or important notes..."
                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 pt-6 border-t border-border gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEditForm(false)}
                className="px-6 py-3 border-2 border-border hover:bg-secondary transition-all duration-200"
              >
                Cancel
              </Button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEditPlayer}
                disabled={formLoading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <span>{formLoading ? 'Updating Player...' : 'Update Player'}</span>
              </motion.button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign to Team Modal */}
        <Dialog open={showRosterModal} onOpenChange={setShowRosterModal}>
          <DialogContent className="glass-card border-gray-200/50 dark:border-gray-700/50">
            <DialogHeader>
              <DialogTitle className="gradient-text text-2xl">Assign to Team</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Assign {selectedPlayerForRoster?.first_name} {selectedPlayerForRoster?.last_name} to a team
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Team *</label>
                <select
                  value={rosterFormData.team_id}
                  onChange={(e) => setRosterFormData({ ...rosterFormData, team_id: e.target.value })}
                  className={`w-full px-3 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border rounded-lg ${
                    rosterFormErrors.team_id ? 'border-red-500' : 'border-gray-200/50 dark:border-gray-700/50'
                  }`}
                >
                  <option value="">Select a team...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                {rosterFormErrors.team_id && (
                  <p className="text-sm text-red-500 mt-1">{rosterFormErrors.team_id}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date *</label>
                <Input
                  type="date"
                  value={rosterFormData.start_date}
                  onChange={(e) => setRosterFormData({ ...rosterFormData, start_date: e.target.value })}
                  className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm ${
                    rosterFormErrors.start_date ? 'border-red-500' : 'border-gray-200/50 dark:border-gray-700/50'
                  }`}
                />
                {rosterFormErrors.start_date && (
                  <p className="text-sm text-red-500 mt-1">{rosterFormErrors.start_date}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Jersey Number</label>
                <Input
                  value={rosterFormData.jersey_number}
                  onChange={(e) => setRosterFormData({ ...rosterFormData, jersey_number: e.target.value })}
                  placeholder="e.g., 10"
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</label>
                <Input
                  value={rosterFormData.position}
                  onChange={(e) => setRosterFormData({ ...rosterFormData, position: e.target.value })}
                  placeholder="e.g., Forward, Defense"
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRosterModal(false)}>
                Cancel
              </Button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAssignToTeam}
                disabled={rosterFormLoading}
                className="button-primary"
              >
                <span>{rosterFormLoading ? 'Assigning...' : 'Assign to Team'}</span>
              </motion.button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  )
}