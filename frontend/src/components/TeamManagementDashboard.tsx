import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Shield, UserPlus, Calendar, Activity, TrendingUp, Award, Target } from 'lucide-react'
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
      damping: 12
    }
  }
} as const

const cardHoverVariants = {
  hover: {
    scale: 1.03,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20
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

      // Fetch teams, players, and calculate stats
      const [teamsResponse, playersResponse] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/players')
      ])

      if (!teamsResponse.ok || !playersResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const teamsData = await teamsResponse.json()
      const playersData = await playersResponse.json()

      // Extract teams array from paginated response
      const teamsArray = teamsData.teams || teamsData
      const playersArray = playersData.players || playersData

      setTeams(teamsArray)
      setStats({
        totalTeams: teamsArray.length,
        totalPlayers: playersData.pagination ? playersData.pagination.total : playersArray.length,
        totalRosterEntries: 0, // This would come from roster entries endpoint
        recentActivity: Math.floor(Math.random() * 10) // Placeholder
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
      <div className="flex items-center justify-center min-h-screen relative z-10">
        <motion.div
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-16 h-16 border-4 border-white/20 border-t-orange-500 rounded-full"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="glass-card glass-card-hover rounded-3xl p-10 w-full max-w-md"
        >
          <motion.h2
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-red-400 mb-4"
          >
            Error Occurred
          </motion.h2>
          <motion.p
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/80 mb-8"
          >
            {error}
          </motion.p>
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
      color: 'from-blue-500 to-cyan-500',
      delay: 0
    },
    {
      title: 'Total Players',
      value: stats.totalPlayers,
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      delay: 0.1
    },
    {
      title: 'Recent Activity',
      value: stats.recentActivity,
      icon: Activity,
      color: 'from-orange-500 to-red-500',
      delay: 0.2
    },
    {
      title: 'Win Rate',
      value: '78%',
      icon: TrendingUp,
      color: 'from-green-500 to-teal-500',
      delay: 0.3
    }
  ]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full relative z-10 scrollbar-custom"
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
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-full blur-3xl"
        />
      </div>

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
          className="text-white/80 text-lg"
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
            custom={index}
            className="relative group"
          >
            <motion.div
              variants={cardHoverVariants}
              className="glass-card glass-card-hover rounded-2xl p-6 h-full relative overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
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
                    className="text-sm text-white/60"
                  >
                    <Award className="w-5 h-5" />
                  </motion.div>
                </div>
                <h3 className="text-white/70 text-sm mb-1">{stat.title}</h3>
                <div className="flex items-baseline space-x-2">
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      delay: 0.3 + stat.delay
                    }}
                    className="text-3xl font-bold text-white"
                  >
                    {stat.value}
                  </motion.p>
                  {index === 3 && (
                    <span className="text-green-400 text-sm">+12%</span>
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
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
      >
        {[
          {
            title: 'Team List',
            description: 'View and manage all teams',
            icon: Shield,
            link: '/teams',
            gradient: 'from-blue-600 to-purple-600'
          },
          {
            title: 'Player Management',
            description: 'Manage player profiles and stats',
            icon: Users,
            link: '/players',
            gradient: 'from-orange-600 to-pink-600'
          },
          {
            title: 'Add New Player',
            description: 'Register a new player to the system',
            icon: UserPlus,
            link: '/players/new',
            gradient: 'from-green-600 to-teal-600'
          }
        ].map((action, index) => (
          <motion.div
            key={action.title}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to={action.link}>
              <motion.div
                className="glass-card glass-card-hover rounded-2xl p-8 relative overflow-hidden group cursor-pointer"
                whileHover={{
                  boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                }}
              >
                {/* Animated Background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
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

                <h3 className="text-xl font-bold text-white mb-2">
                  {action.title}
                </h3>
                <p className="text-white/60 mb-4">
                  {action.description}
                </p>

                <motion.div
                  className="flex items-center text-white/80 font-medium"
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
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full" />
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Teams Section */}
      <motion.div variants={itemVariants}>
        <motion.h2
          className="text-2xl font-bold text-white mb-6 flex items-center"
          whileHover={{ x: 5 }}
        >
          <Target className="w-6 h-6 mr-3 text-orange-500" />
          Recent Teams
        </motion.h2>
        <motion.div className="grid gap-4">
          <AnimatePresence mode="wait">
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
                className="glass-card glass-card-hover rounded-xl p-6 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold"
                  >
                    {team.name.charAt(0)}
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {team.name}
                    </h3>
                    <p className="text-sm text-white/60">
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
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-sm transition-colors"
                  >
                    View Details
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}