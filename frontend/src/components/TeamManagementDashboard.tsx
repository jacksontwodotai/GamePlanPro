import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Shield, UserPlus, Activity, Sparkles, Zap, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface TeamStats {
  totalTeams: number
  totalPlayers: number
  totalRosterEntries: number
  recentActivity: number
}

interface Team {
  id: number
  name: string
  organization: string
  division?: string
  age_group?: string
  skill_level?: string
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

export default function TeamManagementDashboard() {
  const [stats, setStats] = useState<TeamStats>({
    totalTeams: 0,
    totalPlayers: 0,
    totalRosterEntries: 0,
    recentActivity: 0
  })
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [teamsResponse, playersResponse] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/players')
      ])

      if (!teamsResponse.ok || !playersResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const teamsData = await teamsResponse.json()
      const playersData = await playersResponse.json()

      const teamsArray = teamsData.teams || teamsData
      const playersArray = playersData.players || playersData

      setTeams(teamsArray)
      setStats({
        totalTeams: teamsArray.length,
        totalPlayers: playersData.pagination ? playersData.pagination.total : playersArray.length,
        totalRosterEntries: 0,
        recentActivity: Math.floor(Math.random() * 10)
      })
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="glass-card p-10 max-w-md"
        >
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchDashboardData}
            className="button-primary w-full"
          >
            <span>Try Again</span>
          </motion.button>
        </motion.div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Teams',
      value: stats.totalTeams,
      icon: Shield,
      gradient: 'from-gray-600 to-gray-800',
      delay: 0
    },
    {
      title: 'Total Players',
      value: stats.totalPlayers,
      icon: Users,
      gradient: 'from-gray-700 to-gray-900',
      delay: 0.1
    },
    {
      title: 'Recent Activity',
      value: stats.recentActivity,
      icon: Activity,
      gradient: 'from-gray-500 to-gray-700',
      delay: 0.2
    },
    {
      title: 'Win Rate',
      value: '78%',
      icon: TrendingUp,
      gradient: 'from-gray-800 to-black',
      delay: 0.3
    }
  ]

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
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-gray-200/20 to-gray-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-gray-300/20 to-gray-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-12 text-center">
          <motion.h1
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 100,
              delay: 0.1
            }}
            className="text-6xl font-black mb-4"
          >
            <span className="gradient-text">Team Management</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 dark:text-gray-400 text-lg"
          >
            Manage your teams, players, and track performance
          </motion.p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover="hover"
              initial="rest"
              animate="rest"
              custom={index}
              className="relative group"
            >
              <motion.div
                variants={cardHoverVariants}
                className="glass-card glass-card-hover p-6 h-full relative overflow-hidden glow-border"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <motion.div
                      animate={{
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: stat.delay
                      }}
                      className="text-sm text-gray-400"
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  </div>
                  <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">{stat.title}</h3>
                  <div className="flex items-baseline space-x-2">
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        delay: 0.3 + stat.delay
                      }}
                      className="text-3xl font-bold text-gray-900 dark:text-white"
                    >
                      {stat.value}
                    </motion.p>
                    {index === 3 && (
                      <span className="text-gray-500 text-sm">+12%</span>
                    )}
                  </div>
                </div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {[
            {
              title: 'Team List',
              description: 'View and manage all teams',
              icon: Shield,
              link: '/teams',
              gradient: 'from-gray-700 to-gray-900'
            },
            {
              title: 'Player Management',
              description: 'Manage player profiles and stats',
              icon: Users,
              link: '/players',
              gradient: 'from-gray-600 to-gray-800'
            },
            {
              title: 'Roster Management',
              description: 'Central hub for roster and attendance management',
              icon: Activity,
              link: '/teams/roster/dashboard',
              gradient: 'from-gray-500 to-gray-700'
            },
            {
              title: 'Attendance Tracker',
              description: 'Track player attendance for activities',
              icon: Activity,
              link: '/teams/attendance',
              gradient: 'from-blue-500 to-blue-700'
            },
            {
              title: 'Attendance Reports',
              description: 'View historical attendance data and insights',
              icon: TrendingUp,
              link: '/teams/reports/attendance',
              gradient: 'from-green-500 to-green-700'
            },
            {
              title: 'Add New Player',
              description: 'Register a new player to the system',
              icon: UserPlus,
              link: '/players/new',
              gradient: 'from-gray-800 to-black'
            }
          ].map((action, index) => (
            <motion.div
              key={action.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to={action.link}>
                <motion.div
                  className="glass-card glass-card-hover p-8 relative overflow-hidden group cursor-pointer"
                  whileHover={{
                    boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
                  }}
                >
                  {/* Animated Background */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  />

                  {/* Floating Icon */}
                  <motion.div
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.2
                    }}
                    className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${action.gradient} shadow-xl mb-6`}
                  >
                    <action.icon className="w-7 h-7 text-white" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {action.description}
                  </p>

                  <motion.div
                    className="flex items-center text-gray-700 dark:text-gray-300 font-medium"
                    whileHover={{ x: 5 }}
                  >
                    <span>Get Started</span>
                    <motion.svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{ x: [0, 3, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                  </motion.div>

                  {/* Corner Decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100/10 to-transparent rounded-bl-full" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Teams */}
        <motion.div variants={itemVariants}>
          <motion.h2
            className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center"
            whileHover={{ x: 5 }}
          >
            <Zap className="w-6 h-6 mr-3 text-gray-600" />
            Recent Teams
          </motion.h2>

          <AnimatePresence mode="wait">
            {teams.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-12 text-center"
              >
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No teams yet</p>
                <p className="text-sm text-gray-400 mt-2">Create your first team to get started</p>
              </motion.div>
            ) : (
              <motion.div className="grid gap-4">
                {teams.slice(0, 5).map((team, index) => (
                  <motion.div
                    key={team.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 50, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      delay: index * 0.05
                    }}
                    whileHover={{ scale: 1.01 }}
                    className="glass-card glass-card-hover p-6 flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-4">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold shadow-lg"
                      >
                        {team.name.charAt(0)}
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {team.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {team.organization} · {team.division || 'No Division'}
                        </p>
                      </div>
                    </div>

                    <motion.div
                      className="flex items-center space-x-2"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    >
                      <Link
                        to={`/teams/${team.id}`}
                        className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm transition-colors"
                      >
                        View Details
                      </Link>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  )
}