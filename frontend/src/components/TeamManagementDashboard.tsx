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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="dashboard-card w-full max-w-md">
          <h2 className="text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchDashboardData} className="dashboard-button">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{maxWidth: '1200px', margin: '0 auto', padding: '24px'}}>
      {/* Header */}
      <div className="dashboard-card">
        <h1 style={{fontSize: '28px', fontWeight: 'bold', marginBottom: '8px'}}>Team Management Dashboard</h1>
        <p style={{color: '#666', margin: 0}}>
          Overview of teams, players, and roster management
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px'}}>
        <div className="dashboard-card">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
            <h3 style={{fontSize: '14px', fontWeight: '500', margin: 0}}>Total Teams</h3>
            <Shield style={{width: '16px', height: '16px', color: '#666'}} />
          </div>
          <div style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '4px'}}>{stats.totalTeams}</div>
          <p style={{fontSize: '12px', color: '#666', margin: 0}}>
            Active teams in the system
          </p>
        </div>

        <div className="dashboard-card">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
            <h3 style={{fontSize: '14px', fontWeight: '500', margin: 0}}>Total Players</h3>
            <Users style={{width: '16px', height: '16px', color: '#666'}} />
          </div>
          <div style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '4px'}}>{stats.totalPlayers}</div>
          <p style={{fontSize: '12px', color: '#666', margin: 0}}>
            Registered players
          </p>
        </div>

        <div className="dashboard-card">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
            <h3 style={{fontSize: '14px', fontWeight: '500', margin: 0}}>Active Roster Entries</h3>
            <UserPlus style={{width: '16px', height: '16px', color: '#666'}} />
          </div>
          <div style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '4px'}}>{stats.totalRosterEntries}</div>
          <p style={{fontSize: '12px', color: '#666', margin: 0}}>
            Current player assignments
          </p>
        </div>

        <div className="dashboard-card">
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
            <h3 style={{fontSize: '14px', fontWeight: '500', margin: 0}}>Recent Activity</h3>
            <Calendar style={{width: '16px', height: '16px', color: '#666'}} />
          </div>
          <div style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '4px'}}>{stats.recentActivity}</div>
          <p style={{fontSize: '12px', color: '#666', margin: 0}}>
            Changes this week
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-card">
        <h2 style={{marginBottom: '8px'}}>Quick Actions</h2>
        <p style={{color: '#666', marginBottom: '16px'}}>
          Common team management tasks
        </p>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
          <Link to="/teams" className="dashboard-button" style={{height: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center', textDecoration: 'none'}}>
            <Shield style={{width: '24px', height: '24px'}} />
            <span>Manage Teams</span>
          </Link>

          <Link to="/players" className="dashboard-button" style={{height: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center', textDecoration: 'none'}}>
            <Users style={{width: '24px', height: '24px'}} />
            <span>Manage Players</span>
          </Link>

          <Link to="/teams/create" className="dashboard-button" style={{height: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center', textDecoration: 'none'}}>
            <UserPlus style={{width: '24px', height: '24px'}} />
            <span>Create Team</span>
          </Link>

          <Link to="/players/create" className="dashboard-button" style={{height: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center', textDecoration: 'none'}}>
            <UserPlus style={{width: '24px', height: '24px'}} />
            <span>Add Player</span>
          </Link>
        </div>
      </div>

      {/* Recent Teams */}
      <div className="dashboard-card">
        <h2 style={{marginBottom: '8px'}}>Recent Teams</h2>
        <p style={{color: '#666', marginBottom: '16px'}}>
          Recently created or updated teams
        </p>
        {teams.length > 0 ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {teams.slice(0, 5).map((team) => (
              <div
                key={team.id}
                style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #d4d4d4', borderRadius: '8px', transition: 'background-color 0.2s'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div>
                  <h4 style={{fontWeight: '500', margin: '0 0 4px 0'}}>{team.name}</h4>
                  <p style={{fontSize: '14px', color: '#666', margin: 0}}>
                    {team.division} • {team.age_group} • {team.skill_level}
                  </p>
                </div>
                <Link to={`/teams/${team.id}`} className="dashboard-button">
                  View
                </Link>
              </div>
            ))}
            {teams.length > 5 && (
              <div style={{paddingTop: '8px'}}>
                <Link to="/teams" className="dashboard-button" style={{width: '100%', textAlign: 'center', display: 'block'}}>
                  View All Teams
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div style={{textAlign: 'center', padding: '32px 0'}}>
            <Shield style={{width: '48px', height: '48px', margin: '0 auto 16px auto', color: '#666'}} />
            <h3 style={{fontSize: '18px', fontWeight: '500', marginBottom: '8px'}}>No teams yet</h3>
            <p style={{color: '#666', marginBottom: '16px'}}>
              Get started by creating your first team
            </p>
            <Link to="/teams/create" className="dashboard-button">
              Create Team
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}