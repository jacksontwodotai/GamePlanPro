import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  Plus,
  List,
  Settings,
  Activity,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Home,
  ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface VenueStats {
  totalVenues: number
  activeVenues: number
  recentlyAdded: number
  systemStatus: 'healthy' | 'warning' | 'error'
}

interface Venue {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  capacity?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface RecentActivity {
  id: string
  action: 'created' | 'updated' | 'deleted'
  venue_name: string
  venue_id: string
  user_name: string
  timestamp: string
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

export default function VenueManagementDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<VenueStats>({
    totalVenues: 0,
    activeVenues: 0,
    recentlyAdded: 0,
    systemStatus: 'healthy'
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [venuesResponse] = await Promise.all([
        fetch('/api/venues')
      ])

      if (!venuesResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const venuesData = await venuesResponse.json()
      const venues: Venue[] = Array.isArray(venuesData) ? venuesData : venuesData.venues || []

      // Calculate stats
      const activeVenues = venues.filter(v => v.is_active).length
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 7) // Last 7 days
      const recentlyAdded = venues.filter(v => new Date(v.created_at) > recentDate).length

      setStats({
        totalVenues: venues.length,
        activeVenues,
        recentlyAdded,
        systemStatus: venues.length > 0 ? 'healthy' : 'warning'
      })

      // Mock recent activity data - in real app this would come from an activity API
      const mockActivity: RecentActivity[] = venues.slice(0, 5).map((venue, index) => ({
        id: `activity-${index}`,
        action: index === 0 ? 'created' : index === 1 ? 'updated' : 'created',
        venue_name: venue.name,
        venue_id: venue.id,
        user_name: 'Admin User',
        timestamp: new Date(Date.now() - (index * 60 * 60 * 1000)).toISOString()
      }))

      setRecentActivity(mockActivity)

    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <Plus className="h-4 w-4 text-green-500" />
      case 'updated': return <Activity className="h-4 w-4 text-blue-500" />
      case 'deleted': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full"
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
          className="bg-zinc-800 rounded-lg p-10 max-w-md border border-zinc-700"
        >
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchDashboardData}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Venues',
      value: stats.totalVenues,
      icon: Building2,
      gradient: 'from-blue-600 to-blue-800',
      delay: 0
    },
    {
      title: 'Active Venues',
      value: stats.activeVenues,
      icon: CheckCircle,
      gradient: 'from-green-600 to-green-800',
      delay: 0.1
    },
    {
      title: 'Recently Added',
      value: stats.recentlyAdded,
      icon: Clock,
      gradient: 'from-purple-600 to-purple-800',
      delay: 0.2
    },
    {
      title: 'System Status',
      value: stats.systemStatus.charAt(0).toUpperCase() + stats.systemStatus.slice(1),
      icon: CheckCircle,
      gradient: 'from-orange-600 to-orange-800',
      delay: 0.3
    }
  ]

  const quickActions = [
    {
      title: 'View All Venues',
      description: 'Browse and manage all venues in the system',
      icon: List,
      link: '/dashboard/venues/list',
      gradient: 'from-blue-600 to-blue-800'
    },
    {
      title: 'Create New Venue',
      description: 'Add a new venue to the system',
      icon: Plus,
      link: '/dashboard/venues/new',
      gradient: 'from-green-600 to-green-800'
    },
    {
      title: 'Manage Amenity Types',
      description: 'Configure venue amenity types and categories',
      icon: Settings,
      link: '/dashboard/amenity-types',
      gradient: 'from-purple-600 to-purple-800'
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
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-orange-200/10 to-orange-400/10 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-200/10 to-blue-400/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <motion.nav variants={itemVariants} className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-gray-400">
            <li>
              <Link
                to="/dashboard"
                className="hover:text-white transition-colors flex items-center"
              >
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
            </li>
            <ChevronRight className="h-4 w-4" />
            <li className="text-orange-500 font-medium">
              Venue Management
            </li>
          </ol>
        </motion.nav>

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
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Venue Management
            </span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 text-lg"
          >
            Central hub for venue operations, management, and system overview
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
                className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 h-full relative overflow-hidden hover:border-zinc-600 transition-colors"
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
                  <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
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
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to={action.link}>
                <motion.div
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-8 relative overflow-hidden group cursor-pointer hover:border-zinc-600 transition-colors"
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

                  <h3 className="text-xl font-bold text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {action.description}
                  </p>

                  <motion.div
                    className="flex items-center text-gray-300 font-medium"
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
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <motion.h2
            className="text-2xl font-bold text-white mb-6 flex items-center"
            whileHover={{ x: 5 }}
          >
            <TrendingUp className="w-6 h-6 mr-3 text-orange-500" />
            Recent Activity
          </motion.h2>

          <AnimatePresence mode="wait">
            {recentActivity.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-zinc-800 border border-zinc-700 rounded-lg p-12 text-center"
              >
                <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-600 mt-2">Venue activity will appear here</p>
              </motion.div>
            ) : (
              <motion.div className="bg-zinc-800 border border-zinc-700 rounded-lg divide-y divide-zinc-700">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 50, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      delay: index * 0.05
                    }}
                    whileHover={{ scale: 1.01 }}
                    className="p-6 flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getActionIcon(activity.action)}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          <span className="capitalize">{activity.action}</span> venue:
                          <Link
                            to={`/dashboard/venues/${activity.venue_id}`}
                            className="ml-1 text-orange-400 hover:text-orange-300 transition-colors"
                          >
                            {activity.venue_name}
                          </Link>
                        </p>
                        <p className="text-sm text-gray-400">
                          by {activity.user_name} • {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
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