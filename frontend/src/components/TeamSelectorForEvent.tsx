import { useEffect, useState, useCallback } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { Search, Users, Shield, AlertTriangle, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Team {
  id: number
  name: string
  organization: string
  division?: string
  age_group?: string
  skill_level?: string
  created_at: string
}

interface TeamSelectorForEventProps {
  selectedTeamIds: number[]
  onTeamsChange: (teamIds: number[]) => void
  disabled?: boolean
  className?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
} as const

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20
    }
  }
} as const

export default function TeamSelectorForEvent({
  selectedTeamIds,
  onTeamsChange,
  disabled = false,
  className = ''
}: TeamSelectorForEventProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    const filtered = teams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.division?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.age_group?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredTeams(filtered)
  }, [teams, searchTerm])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      const data = await response.json()
      const teamsArray = data.teams || data
      setTeams(teamsArray)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load teams'
      setError(errorMessage)
      console.error('Fetch teams error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTeamToggle = useCallback((teamId: number) => {
    if (disabled) return

    const newSelectedIds = selectedTeamIds.includes(teamId)
      ? selectedTeamIds.filter(id => id !== teamId)
      : [...selectedTeamIds, teamId]

    onTeamsChange(newSelectedIds)
  }, [selectedTeamIds, onTeamsChange, disabled])

  const handleSelectAll = useCallback(() => {
    if (disabled) return

    if (selectedTeamIds.length === filteredTeams.length) {
      onTeamsChange([])
    } else {
      onTeamsChange(filteredTeams.map(team => team.id))
    }
  }, [selectedTeamIds, filteredTeams, onTeamsChange, disabled])

  const handleClearSelection = useCallback(() => {
    if (disabled) return
    onTeamsChange([])
  }, [onTeamsChange, disabled])

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="glass-card p-6">
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full"
            />
            <span className="ml-3 text-gray-600">Loading teams...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="glass-card p-6 border-red-500/20">
          <div className="flex items-center space-x-2 text-red-600 mb-4">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Error loading teams</span>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={fetchTeams}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="glass-card glass-card-hover p-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Teams
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedTeamIds.length} of {filteredTeams.length} teams selected
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleSelectAll}
              disabled={disabled || filteredTeams.length === 0}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {selectedTeamIds.length === filteredTeams.length ? (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Deselect All
                </>
              ) : (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Select All
                </>
              )}
            </Button>
            {selectedTeamIds.length > 0 && (
              <Button
                onClick={handleClearSelection}
                disabled={disabled}
                variant="outline"
                size="sm"
                className="text-xs text-red-600 border-red-300 hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </motion.div>

        {/* Search */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search teams by name, organization, division..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={disabled}
              className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50"
            />
          </div>
        </motion.div>

        {/* Teams List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          <AnimatePresence>
            {filteredTeams.map((team, index) => (
              <motion.div
                key={team.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95 }}
                custom={index}
                className={`group relative p-4 rounded-lg border transition-all duration-200 ${
                  selectedTeamIds.includes(team.id)
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 shadow-sm'
                    : 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/70'
                } ${
                  disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                onClick={() => handleTeamToggle(team.id)}
              >
                <div className="flex items-center space-x-4">
                  {/* Checkbox */}
                  <Checkbox
                    checked={selectedTeamIds.includes(team.id)}
                    disabled={disabled}
                    onChange={() => handleTeamToggle(team.id)}
                  />

                  {/* Team Icon */}
                  <div className={`p-2 rounded-lg transition-colors ${
                    selectedTeamIds.includes(team.id)
                      ? 'bg-blue-100 dark:bg-blue-800/30'
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                  }`}>
                    <Shield className={`h-4 w-4 ${
                      selectedTeamIds.includes(team.id)
                        ? 'text-blue-600'
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>

                  {/* Team Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {team.name}
                      </h4>
                      {selectedTeamIds.includes(team.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-blue-600"
                        >
                          <Check className="h-4 w-4" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {team.organization}
                    </p>
                    {(team.division || team.age_group) && (
                      <div className="flex items-center space-x-2 mt-1">
                        {team.division && (
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                            {team.division}
                          </span>
                        )}
                        {team.age_group && (
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                            {team.age_group}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredTeams.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              {searchTerm ? 'No teams found' : 'No teams available'}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'Teams will appear here when they are added to the system'
              }
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Selected Teams Summary */}
      <AnimatePresence>
        {selectedTeamIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-4"
          >
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selected Teams ({selectedTeamIds.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedTeamIds.map(teamId => {
                const team = teams.find(t => t.id === teamId)
                if (!team) return null

                return (
                  <motion.span
                    key={teamId}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"
                  >
                    {team.name}
                    {!disabled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTeamToggle(teamId)
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </motion.span>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}