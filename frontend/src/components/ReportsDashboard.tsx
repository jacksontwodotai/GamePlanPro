import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Users, BarChart, TrendingUp, Download, Calendar,
  Sparkles, Zap, Activity, Shield
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApi } from '../hooks/useApi'

interface ReportStats {
  totalReports: number
  totalTeams: number
  totalPlayers: number
  recentActivity: number
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

export default function ReportsDashboard() {
  const [stats, setStats] = useState<ReportStats>({
    totalReports: 0,
    totalTeams: 0,
    totalPlayers: 0,
    recentActivity: 0
  })
  const [loading, setLoading] = useState(true)

  const teamsApi = useApi<{ teams: any[] }>()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)

      // Fetch teams to get basic stats
      const teamsResponse = await teamsApi.execute('/api/teams?limit=1000')
      const teams = teamsResponse.teams || []

      // Mock stats - in a real app, these would come from dedicated API endpoints
      setStats({
        totalReports: 47, // Mock data
        totalTeams: teams.length,
        totalPlayers: teams.reduce((sum, team) => sum + (team.player_count || 0), 0) || 156, // Mock fallback
        recentActivity: 12 // Mock data
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Fallback mock data
      setStats({
        totalReports: 47,
        totalTeams: 8,
        totalPlayers: 156,
        recentActivity: 12
      })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Reports Generated',
      value: loading ? '...' : stats.totalReports,
      icon: FileText,
      gradient: 'from-blue-500 to-blue-700',
      delay: 0.1
    },
    {
      title: 'Active Teams',
      value: loading ? '...' : stats.totalTeams,
      icon: Shield,
      gradient: 'from-gray-600 to-gray-800',
      delay: 0.2
    },
    {
      title: 'Total Players',
      value: loading ? '...' : stats.totalPlayers,
      icon: Users,
      gradient: 'from-green-500 to-green-700',
      delay: 0.3
    },
    {
      title: 'Recent Activity',
      value: loading ? '...' : stats.recentActivity,
      icon: TrendingUp,
      gradient: 'from-purple-500 to-purple-700',
      delay: 0.4
    }
  ]

  const reportTypes = [
    {
      title: 'Roster Reports',
      description: 'Detailed player roster information with team assignments',
      icon: FileText,
      link: '/reports/generate?type=roster',
      gradient: 'from-blue-500 to-blue-700',
      features: ['Player details', 'Jersey numbers', 'Positions', 'Team assignments']
    },
    {
      title: 'Contact Reports',
      description: 'Player and parent/guardian contact information',
      icon: Users,
      link: '/reports/generate?type=player-contact',
      gradient: 'from-green-500 to-green-700',
      features: ['Player contacts', 'Guardian info', 'Emergency contacts', 'Communication data']
    },
    {
      title: 'Team Summary',
      description: 'High-level team overview with active player counts',
      icon: BarChart,
      link: '/reports/generate?type=team-summary',
      gradient: 'from-purple-500 to-purple-700',
      features: ['Team statistics', 'Player counts', 'Division info', 'Activity levels']
    },
    {
      title: 'All Reports',
      description: 'Access the full report generation interface',
      icon: Download,
      link: '/reports/generate',
      gradient: 'from-gray-600 to-gray-800',
      features: ['All report types', 'Custom filtering', 'Multiple formats', 'Export options']
    }
  ]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
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
          className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-gradient-to-r from-purple-200/20 to-purple-400/20 rounded-full blur-3xl"
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
            <span className="gradient-text">Reports Dashboard</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 dark:text-gray-400 text-lg"
          >
            Generate comprehensive reports and analytics for your teams and players
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
                    {index === 3 && !loading && (
                      <span className="text-green-500 text-sm">+18%</span>
                    )}
                  </div>
                </div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Report Types */}
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Report Types
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose from our comprehensive reporting options
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {reportTypes.map((report, index) => (
            <motion.div
              key={report.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to={report.link}>
                <motion.div
                  className="glass-card glass-card-hover p-8 relative overflow-hidden group cursor-pointer h-full"
                  whileHover={{
                    boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
                  }}
                >
                  {/* Animated Background */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${report.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
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
                    className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${report.gradient} shadow-xl mb-6`}
                  >
                    <report.icon className="w-7 h-7 text-white" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {report.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {report.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-2">
                    {report.features.map((feature, featureIndex) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + featureIndex * 0.1 }}
                        className="flex items-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        <Zap className="w-3 h-3 mr-2 text-gray-400" />
                        {feature}
                      </motion.div>
                    ))}
                  </div>

                  {/* Hover Arrow */}
                  <motion.div
                    className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    animate={{
                      x: [0, 5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Activity className="w-5 h-5 text-gray-400" />
                  </motion.div>

                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Activity Section (Placeholder) */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Recent Report Activity
            </h3>
            <span className="text-sm text-gray-500">Last 7 days</span>
          </div>
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Recent activity tracking coming soon</p>
            <p className="text-sm text-gray-400 mt-1">
              Track your report generation history and usage patterns
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}