import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Shield, UserPlus, Calendar } from 'lucide-react'

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

      setTeams(teamsData)
      setStats({
        totalTeams: teamsData.length,
        totalPlayers: playersData.length,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl p-8 w-full max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-zinc-600 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-300 shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Team Management Dashboard</h1>
        <p className="text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed">
          Overview of teams, players, and roster management - streamline your operations in one place
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl hover:shadow-2xl transition-all duration-300 p-6 hover:-translate-y-1 hover:border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-2">Total Teams</h3>
          <div className="text-3xl font-bold text-black mb-1">{stats.totalTeams}</div>
          <p className="text-sm text-zinc-500">Active teams in the system</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl hover:shadow-2xl transition-all duration-300 p-6 hover:-translate-y-1 hover:border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-2">Total Players</h3>
          <div className="text-3xl font-bold text-black mb-1">{stats.totalPlayers}</div>
          <p className="text-sm text-zinc-500">Registered players</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl hover:shadow-2xl transition-all duration-300 p-6 hover:-translate-y-1 hover:border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-zinc-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-2">Active Roster Entries</h3>
          <div className="text-3xl font-bold text-black mb-1">{stats.totalRosterEntries}</div>
          <p className="text-sm text-zinc-500">Current player assignments</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl hover:shadow-2xl transition-all duration-300 p-6 hover:-translate-y-1 hover:border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-700" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-2">Recent Activity</h3>
          <div className="text-3xl font-bold text-black mb-1">{stats.recentActivity}</div>
          <p className="text-sm text-zinc-500">Changes this week</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-xl p-10 mb-12">
        <h2 className="text-3xl font-bold text-black mb-3">Quick Actions</h2>
        <p className="text-lg text-zinc-600 mb-8">
          Common team management tasks to get you started
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/teams"
            className="group relative bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-2xl flex flex-col items-center justify-center p-8 h-40 text-center hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Shield className="w-10 h-10 mb-4 relative z-10" />
            <span className="text-lg relative z-10">Manage Teams</span>
          </Link>

          <Link
            to="/players"
            className="group relative bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-2xl flex flex-col items-center justify-center p-8 h-40 text-center hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Users className="w-10 h-10 mb-4 relative z-10" />
            <span className="text-lg relative z-10">Manage Players</span>
          </Link>

          <Link
            to="/teams/create"
            className="group relative bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-2xl flex flex-col items-center justify-center p-8 h-40 text-center hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <UserPlus className="w-10 h-10 mb-4 relative z-10" />
            <span className="text-lg relative z-10">Create Team</span>
          </Link>

          <Link
            to="/players/create"
            className="group relative bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-2xl flex flex-col items-center justify-center p-8 h-40 text-center hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <UserPlus className="w-10 h-10 mb-4 relative z-10" />
            <span className="text-lg relative z-10">Add Player</span>
          </Link>
        </div>
      </div>

      {/* Recent Teams */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-xl p-10">
        <h2 className="text-3xl font-bold text-black mb-3">Recent Teams</h2>
        <p className="text-lg text-zinc-600 mb-8">
          Recently created or updated teams in your organization
        </p>
        {teams.length > 0 ? (
          <div className="space-y-4">
            {teams.slice(0, 5).map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-6 border border-zinc-100 rounded-xl hover:bg-zinc-50 hover:border-orange-200 transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-black mb-1">{team.name}</h4>
                    <p className="text-zinc-600">
                      {team.division} • {team.age_group} • {team.skill_level}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/teams/${team.id}`}
                  className="group relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-3 rounded-xl text-sm hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">View Team</span>
                </Link>
              </div>
            ))}
            {teams.length > 5 && (
              <div className="pt-4 border-t border-zinc-100">
                <Link
                  to="/teams"
                  className="group relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold w-full flex justify-center py-4 rounded-xl text-base hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">View All Teams</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-zinc-400" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-2">No teams yet</h3>
            <p className="text-zinc-600 mb-6 max-w-md mx-auto">
              Get started by creating your first team and begin managing your roster
            </p>
            <Link
              to="/teams/create"
              className="group relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-10 py-4 rounded-xl text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Create Your First Team</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}