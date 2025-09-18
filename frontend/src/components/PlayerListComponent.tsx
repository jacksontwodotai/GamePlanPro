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
  Search,
  Edit,
  Users,
  AlertTriangle,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Sparkles,
  Zap,
  Heart,
  Trash2,
  Filter,
  Settings
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApi } from '../hooks/useApi'

interface Player {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  organization: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relation?: string
  medical_alerts?: string
  address?: string
  created_at: string
}

interface PlayersResponse {
  players: Player[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface Filters {
  search: string
  organization: string
  dateRange: string
  hasEmergencyContact: string
}

const PAGE_SIZE_OPTIONS = [6, 9, 12, 18, 24]

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

interface PlayerListComponentProps {
  onPlayerSelect?: (player: Player) => void
  onPlayerEdit?: (player: Player) => void
  onPlayerCreate?: () => void
  allowDelete?: boolean
  allowEdit?: boolean
  showCreateButton?: boolean
}

export default function PlayerListComponent({
  onPlayerSelect,
  onPlayerEdit,
  onPlayerCreate,
  allowDelete = true,
  allowEdit = true,
  showCreateButton = true
}: PlayerListComponentProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [availableOrganizations, setAvailableOrganizations] = useState<string[]>([])

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    search: '',
    organization: '',
    dateRange: '',
    hasEmergencyContact: ''
  })

  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)

  // API hooks
  const { data: playersData, loading, error, execute: fetchPlayersApi } = useApi<PlayersResponse>()
  const { loading: deleteLoading, execute: deletePlayerApi } = useApi()

  // Fetch players with current filters and pagination
  const fetchPlayers = useCallback(async () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: pageSize.toString()
    })

    // Add filters to params
    if (filters.search) params.append('search', filters.search)
    if (filters.organization) params.append('organization', filters.organization)

    try {
      await fetchPlayersApi(`/api/players?${params}`)
    } catch (err) {
      console.error('Failed to fetch players:', err)
    }
  }, [currentPage, pageSize, filters, fetchPlayersApi])

  // Update local state when API data changes
  useEffect(() => {
    if (playersData) {
      setPlayers(playersData.players || [])
      setTotalPages(playersData.pagination?.totalPages || 1)
      setTotalPlayers(playersData.pagination?.total || 0)

      // Extract unique organizations for filter dropdown
      const orgs = new Set(playersData.players?.map(p => p.organization) || [])
      setAvailableOrganizations(Array.from(orgs).sort())
    }
  }, [playersData])

  // Fetch players when dependencies change
  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    } else {
      fetchPlayers()
    }
  }, [filters, pageSize])

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      organization: '',
      dateRange: '',
      hasEmergencyContact: ''
    })
  }

  // Handle delete player
  const handleDeleteClick = (player: Player) => {
    setPlayerToDelete(player)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!playerToDelete) return

    try {
      await deletePlayerApi(`/api/players/${playerToDelete.id}`, { method: 'DELETE' })
      setShowDeleteDialog(false)
      setPlayerToDelete(null)
      await fetchPlayers() // Refresh the list
    } catch (err) {
      console.error('Failed to delete player:', err)
    }
  }

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  if (loading && players.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] relative">
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
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="glass-card glass-card-hover p-6 flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Player List</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and manage player profiles
          </p>
        </div>
        {showCreateButton && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPlayerCreate}
            className="button-primary"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Add Player</span>
          </motion.button>
        )}
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Players', value: totalPlayers, icon: Users, gradient: 'from-blue-600 to-blue-800' },
          { label: 'Organizations', value: availableOrganizations.length, icon: Heart, gradient: 'from-green-600 to-green-800' },
          { label: 'Current Page', value: `${currentPage}/${totalPages}`, icon: Calendar, gradient: 'from-purple-600 to-purple-800' },
          { label: 'Per Page', value: pageSize, icon: Zap, gradient: 'from-orange-600 to-orange-800' },
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

      {/* Search and Filters */}
      <motion.div
        variants={itemVariants}
        className="glass-card glass-card-hover p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
            Search & Filter
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-blue-100' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm"
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, phone..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50"
            />
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  <select
                    value={filters.organization}
                    onChange={(e) => handleFilterChange('organization', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    <option value="">All Organizations</option>
                    {availableOrganizations.map(org => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact
                  </label>
                  <select
                    value={filters.hasEmergencyContact}
                    onChange={(e) => handleFilterChange('hasEmergencyContact', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    <option value="">All Players</option>
                    <option value="true">Has Emergency Contact</option>
                    <option value="false">Missing Emergency Contact</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Players Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {players.map((player) => (
            <motion.div
              key={player.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover="hover"
              layout
              className="relative group"
            >
              <motion.div
                variants={cardHoverVariants}
                className="glass-card glass-card-hover p-6 h-full relative overflow-hidden glow-border"
              >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-900 opacity-5 group-hover:opacity-10 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white font-bold text-lg shadow-lg cursor-pointer"
                        onClick={() => onPlayerSelect?.(player)}
                      >
                        {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                      </motion.div>
                      <div>
                        <h3
                          className="text-lg font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600"
                          onClick={() => onPlayerSelect?.(player)}
                        >
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
                        <span>Age: {calculateAge(player.date_of_birth)}</span>
                      </div>
                    )}
                  </div>

                  <div className={`grid gap-2 ${allowDelete && allowEdit ? 'grid-cols-3' : allowDelete || allowEdit ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onPlayerSelect?.(player)}
                      className="px-2 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-shadow"
                    >
                      View
                    </motion.button>

                    {allowEdit && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onPlayerEdit?.(player)}
                        className="px-2 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                    )}

                    {allowDelete && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteClick(player)}
                        className="px-2 py-2 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-shadow"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            </motion.div>
          ))}
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
                    ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg'
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
              {filters.search || filters.organization ? 'No players found' : 'No players yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {filters.search || filters.organization
                ? 'Try adjusting your search criteria'
                : 'Get started by adding your first player'
              }
            </p>
            {(!filters.search && !filters.organization && showCreateButton) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPlayerCreate}
                className="button-primary"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Add Player</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="glass-card border-red-500/20">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Delete Player
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {playerToDelete?.first_name} {playerToDelete?.last_name}?
              This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}