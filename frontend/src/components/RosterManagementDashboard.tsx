import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Shield, Search, BarChart, UserCheck, Calendar,
  ChevronRight, Activity, TrendingUp, UserPlus, Filter,
  Sparkles, Zap, Eye, Edit, FileText
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

interface RosterEntry {
  id: number
  player_id: number
  team_id: number
  start_date: string
  end_date?: string
  jersey_number?: number
  position?: string
  player: {
    id: number
    first_name: string
    last_name: string
    jersey_number?: number
    position?: string
  }
}

interface TeamWithStats extends Team {
  activePlayerCount: number
  totalRosterEntries: number
  lastActivity?: string
}

interface DashboardStats {
  totalTeams: number
  totalPlayers: number
  totalActiveRosterEntries: number
  averageRosterSize: number
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

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
}

export default function RosterManagementDashboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsWithStats, setTeamsWithStats] = useState<TeamWithStats[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'division' | 'age_group'>('all')
  const [loading, setLoading] = useState(true)

  const teamsApi = useApi<{ teams: Team[] }>()
  const rosterApi = useApi<{ roster_entries: RosterEntry[] }>()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch teams
      const teamsResponse = await teamsApi.execute('/api/teams')
      const teamsData = teamsResponse.teams || []
      setTeams(teamsData)

      // Fetch roster data for all teams
      const rosterResponse = await rosterApi.execute('/api/rosters?active_only=true&limit=1000')
      const rosterData = rosterResponse.roster_entries || []

      // Calculate stats for each team
      const teamsWithStatsData: TeamWithStats[] = teamsData.map(team => {
        const teamRosterEntries = rosterData.filter((entry: RosterEntry) => entry.team_id === team.id)
        const uniquePlayerIds = new Set(teamRosterEntries.map((entry: RosterEntry) => entry.player_id))

        return {
          ...team,
          activePlayerCount: uniquePlayerIds.size,
          totalRosterEntries: teamRosterEntries.length,
          lastActivity: teamRosterEntries.length > 0 ?
            teamRosterEntries.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0].start_date :
            undefined
        }
      })

      setTeamsWithStats(teamsWithStatsData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const dashboardStats: DashboardStats = useMemo(() => {
    const totalActiveRosterEntries = teamsWithStats.reduce((sum, team) => sum + team.totalRosterEntries, 0)
    const totalPlayers = teamsWithStats.reduce((sum, team) => sum + team.activePlayerCount, 0)

    return {
      totalTeams: teamsWithStats.length,
      totalPlayers,
      totalActiveRosterEntries,
      averageRosterSize: teamsWithStats.length > 0 ? totalPlayers / teamsWithStats.length : 0
    }
  }, [teamsWithStats])

  const filteredTeams = useMemo(() => {
    let filtered = teamsWithStats

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.division?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.age_group?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply category filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(team => {
        if (filterBy === 'division') return team.division
        if (filterBy === 'age_group') return team.age_group
        return true
      })
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [teamsWithStats, searchTerm, filterBy])

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  if (loading) {
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
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-purple-200/20 to-purple-400/20 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-indigo-200/20 to-indigo-400/20 rounded-full blur-3xl"
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
            <span className="gradient-text">Roster Management</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 dark:text-gray-400"
          >
            Central hub for managing team rosters and player assignments
          </motion.p>
        </motion.div>

        {/* Dashboard Statistics */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Teams',
              value: dashboardStats.totalTeams,
              icon: Shield,
              gradient: 'from-blue-500 to-blue-700',
              delay: 0
            },
            {
              title: 'Active Players',
              value: dashboardStats.totalPlayers,
              icon: Users,
              gradient: 'from-green-500 to-green-700',
              delay: 0.1
            },
            {
              title: 'Roster Entries',
              value: dashboardStats.totalActiveRosterEntries,
              icon: FileText,
              gradient: 'from-purple-500 to-purple-700',
              delay: 0.2
            },
            {
              title: 'Avg Roster Size',
              value: dashboardStats.averageRosterSize.toFixed(1),
              icon: TrendingUp,
              gradient: 'from-indigo-500 to-indigo-700',
              delay: 0.3
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover="hover"
              initial="rest"
              animate="rest"
              className="relative group"
            >
              <motion.div
                variants={cardHoverVariants}
                className="glass-card glass-card-hover p-6 h-full relative overflow-hidden glow-border"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

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
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>

                <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: 'Manage Rosters',
              description: 'Add, edit, and remove players from team rosters',
              icon: Users,
              link: '/teams/roster',
              gradient: 'from-blue-500 to-blue-700'
            },
            {
              title: 'Track Attendance',
              description: 'Record player attendance for team activities',
              icon: UserCheck,
              link: '/teams/attendance',
              gradient: 'from-green-500 to-green-700'
            },
            {
              title: 'View Reports',
              description: 'Analyze attendance data and roster insights',
              icon: BarChart,
              link: '/teams/reports/attendance',
              gradient: 'from-purple-500 to-purple-700'
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
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  />

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

                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100/10 to-transparent rounded-bl-full" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Search and Filter Controls */}
        <motion.div variants={itemVariants} className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as 'all' | 'division' | 'age_group')}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All Teams</option>
                  <option value="division">With Division</option>
                  <option value="age_group">With Age Group</option>
                </select>
              </div>

              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredTeams.length} teams
              </span>
            </div>
          </div>
        </motion.div>

        {/* Teams Grid */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Zap className="w-6 h-6 mr-3 text-purple-600" />
              Teams Overview
            </h2>
          </div>

          <AnimatePresence mode="wait">
            {filteredTeams.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-12 text-center"
              >
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No teams found</p>
                <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filter</p>
              </motion.div>
            ) : (
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeams.map((team, index) => (
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
                    whileHover={{ scale: 1.02 }}
                    className="glass-card glass-card-hover p-6 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold shadow-lg"
                        >
                          {team.name.charAt(0)}
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {team.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {team.organization}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {team.division && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Shield className="w-4 h-4 mr-2" />
                          Division: {team.division}
                        </div>
                      )}
                      {team.age_group && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4 mr-2" />
                          Age Group: {team.age_group}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {team.activePlayerCount}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Active Players</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {team.totalRosterEntries}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Roster Entries</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        to={`/teams/roster?team=${team.id}`}
                        className="flex-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium text-center hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Manage
                      </Link>
                      <Link
                        to={`/teams/attendance?team=${team.id}`}
                        className="flex-1 px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium text-center hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors flex items-center justify-center"
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Attendance
                      </Link>
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