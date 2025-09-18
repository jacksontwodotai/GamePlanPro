import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, UserPlus, Activity, Sparkles, Zap, TrendingUp, Heart, Calendar, Mail, Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface PlayerStats {
  totalPlayers: number
  activeRosterEntries: number
  recentRegistrations: number
  averageAge: number
}

interface RecentPlayer {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  created_at: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
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

export default function PlayerProfileDashboard() {
  const [stats, setStats] = useState<PlayerStats>({
    totalPlayers: 0,
    activeRosterEntries: 0,
    recentRegistrations: 0,
    averageAge: 0
  })
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch real data from the API
      const [playersResponse, teamsResponse] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/teams')
      ])

      if (!playersResponse.ok || !teamsResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const playersData = await playersResponse.json()
      const teamsData = await teamsResponse.json()

      const players = playersData.players || []
      const teams = teamsData.teams || []

      // Calculate stats from real data
      const totalPlayers = players.length

      // Calculate average age (filter out null dates)
      const playersWithAge = players.filter(p => p.date_of_birth)
      const averageAge = playersWithAge.length > 0
        ? playersWithAge.reduce((sum, p) => {
            const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()
            return sum + age
          }, 0) / playersWithAge.length
        : 0

      // Recent registrations (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const recentRegistrations = players.filter(p =>
        new Date(p.created_at) > thirtyDaysAgo
      ).length

      setStats({
        totalPlayers,
        activeRosterEntries: totalPlayers, // TODO: Calculate actual roster entries
        recentRegistrations,
        averageAge: Math.round(averageAge * 10) / 10
      })

      // Set recent players (last 3)
      const sortedPlayers = players
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)

      setRecentPlayers(sortedPlayers)
      setError(null)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Fetch dashboard data error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] relative">
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
          className="absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-r from-blue-200/20 to-blue-400/20 rounded-full blur-3xl"
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
          className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-gradient-to-r from-green-300/20 to-green-500/20 rounded-full blur-3xl"
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
              <span className="gradient-text">Player Management</span>
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-400 text-lg"
            >
              Centralized hub for player profile management and navigation
            </motion.p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/players/create">
              <Button className="button-primary">
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Add New Player</span>
              </Button>
            </Link>
          </motion.div>
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
                <Activity className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            {
              label: 'Total Players',
              value: stats.totalPlayers,
              icon: Users,
              gradient: 'from-blue-600 to-blue-800',
              description: 'All registered players'
            },
            {
              label: 'Active Roster Entries',
              value: stats.activeRosterEntries,
              icon: Heart,
              gradient: 'from-green-600 to-green-800',
              description: 'Currently assigned to teams'
            },
            {
              label: 'Recent Registrations',
              value: stats.recentRegistrations,
              icon: TrendingUp,
              gradient: 'from-purple-600 to-purple-800',
              description: 'New players this month'
            },
            {
              label: 'Average Age',
              value: `${stats.averageAge}y`,
              icon: Calendar,
              gradient: 'from-orange-600 to-orange-800',
              description: 'Across all players'
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover="hover"
              initial="rest"
              className="relative group"
            >
              <motion.div
                variants={cardHoverVariants}
                className="glass-card glass-card-hover p-6 glow-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient}`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{stat.description}</p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Navigation Cards */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* View All Players Card */}
          <motion.div
            variants={itemVariants}
            whileHover="hover"
            initial="rest"
            className="relative group"
          >
            <Link to="/players/list">
              <motion.div
                variants={cardHoverVariants}
                className="glass-card glass-card-hover p-8 glow-border cursor-pointer relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-900 opacity-5 group-hover:opacity-10 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-4">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white shadow-lg"
                    >
                      <Users className="w-6 h-6" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">View All Players</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Browse and manage player profiles</p>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Access the complete player management interface with search, filtering, and profile editing capabilities.
                  </p>

                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
                    <span>Open Player List</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="ml-2"
                    >
                      →
                    </motion.div>
                  </div>
                </div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            </Link>
          </motion.div>

          {/* Create New Player Card */}
          <motion.div
            variants={itemVariants}
            whileHover="hover"
            initial="rest"
            className="relative group"
          >
            <Link to="/players/create">
              <motion.div
                variants={cardHoverVariants}
                className="glass-card glass-card-hover p-8 glow-border cursor-pointer relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-700 to-green-900 opacity-5 group-hover:opacity-10 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-4">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center text-white shadow-lg"
                    >
                      <UserPlus className="w-6 h-6" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Player</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Add a new player to the system</p>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Register a new player with comprehensive profile information including contact details and emergency contacts.
                  </p>

                  <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
                    <span>Create Player</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="ml-2"
                    >
                      →
                    </motion.div>
                  </div>
                </div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Recent Players */}
        <motion.div
          variants={itemVariants}
          className="glass-card glass-card-hover p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
            Recent Player Registrations
          </h2>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {recentPlayers.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white font-bold text-sm">
                      {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {player.first_name} {player.last_name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        {player.email && (
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            <span className="truncate max-w-[200px]">{player.email}</span>
                          </div>
                        )}
                        {player.phone && (
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            <span>{player.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(player.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-4 text-center">
            <Link to="/players/list">
              <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-300">
                View All Players
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}