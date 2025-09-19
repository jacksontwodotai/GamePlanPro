import { useEffect, useState } from 'react'
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
import { Search, Plus, Edit, Trash2, Shield, AlertTriangle, Sparkles, Zap } from 'lucide-react'
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

interface TeamFormData {
  name: string
  organization: string
  division: string
  age_group: string
  skill_level: string
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

export default function TeamListView() {
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    organization: '',
    division: '',
    age_group: '',
    skill_level: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<TeamFormData>>({})

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
      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      const data = await response.json()
      const teamsArray = data.teams || data
      setTeams(teamsArray)
      setError(null)
    } catch (err) {
      setError('Failed to load teams')
      console.error('Fetch teams error:', err)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (data: TeamFormData): boolean => {
    const errors: Partial<TeamFormData> = {}

    if (!data.name.trim()) {
      errors.name = 'Team name is required'
    }
    if (!data.organization.trim()) {
      errors.organization = 'Organization is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateTeam = async () => {
    if (!validateForm(formData)) return

    try {
      setFormLoading(true)
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create team')
      }

      await fetchTeams()
      setShowCreateForm(false)
      resetForm()
    } catch (err) {
      console.error('Create team error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditTeam = async () => {
    if (!selectedTeam || !validateForm(formData)) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update team')
      }

      await fetchTeams()
      setShowEditForm(false)
      resetForm()
      setSelectedTeam(null)
    } catch (err) {
      console.error('Update team error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update team')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete team')
      }

      await fetchTeams()
      setShowDeleteDialog(false)
      setSelectedTeam(null)
    } catch (err) {
      console.error('Delete team error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete team')
    } finally {
      setFormLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      organization: '',
      division: '',
      age_group: '',
      skill_level: ''
    })
    setFormErrors({})
  }

  const openCreateForm = () => {
    resetForm()
    setShowCreateForm(true)
  }

  const openEditForm = (team: Team) => {
    setSelectedTeam(team)
    setFormData({
      name: team.name,
      organization: team.organization,
      division: team.division || '',
      age_group: team.age_group || '',
      skill_level: team.skill_level || ''
    })
    setFormErrors({})
    setShowEditForm(true)
  }

  const openDeleteDialog = (team: Team) => {
    setSelectedTeam(team)
    setShowDeleteDialog(true)
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
            x: [0, 150, 0],
            y: [0, -150, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-32 left-32 w-96 h-96 bg-gradient-to-r from-gray-200/20 to-gray-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 150, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-r from-gray-300/20 to-gray-500/20 rounded-full blur-3xl"
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
              <span className="gradient-text">Teams</span>
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-400 text-lg"
            >
              Manage your organization's teams
            </motion.p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreateForm}
            className="button-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Team</span>
          </motion.button>
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

        {/* Search */}
        <motion.div
          variants={itemVariants}
          className="glass-card glass-card-hover p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-gray-600" />
            Search Teams
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by team name, organization, division..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50"
            />
          </div>
        </motion.div>

        {/* Teams Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredTeams.map((team, index) => (
              <motion.div
                key={team.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover="hover"
                custom={index}
                className="relative group"
              >
                <motion.div
                  variants={cardHoverVariants}
                  className="glass-card glass-card-hover p-6 h-full relative overflow-hidden glow-border"
                >
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 opacity-5 group-hover:opacity-10 transition-opacity duration-300" />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="p-3 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-lg"
                        >
                          <Shield className="h-5 w-5 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{team.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{team.organization}</p>
                        </div>
                      </div>
                      <motion.div
                        animate={{
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="text-gray-400"
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                    </div>

                    <div className="space-y-2 text-sm mb-6">
                      {team.division && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Division:</span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{team.division}</span>
                        </div>
                      )}
                      {team.age_group && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Age Group:</span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{team.age_group}</span>
                        </div>
                      )}
                      {team.skill_level && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Skill Level:</span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{team.skill_level}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openEditForm(team)}
                        className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm transition-colors flex items-center justify-center"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openDeleteDialog(team)}
                        className="flex-1 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm transition-colors flex items-center justify-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </motion.button>
                    </div>
                  </div>

                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        <AnimatePresence>
          {filteredTeams.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card p-12 text-center"
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Shield className="h-16 w-16 mx-auto text-gray-300 mb-6" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                {searchTerm ? 'No teams found' : 'No teams yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Get started by creating your first team'
                }
              </p>
              {!searchTerm && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openCreateForm}
                  className="button-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create Team</span>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create/Edit/Delete Dialogs remain similar but with updated styling */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="glass-card border-gray-200/50 dark:border-gray-700/50">
            <DialogHeader>
              <DialogTitle className="gradient-text text-2xl">Create New Team</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Add a new team to your organization
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Team Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter team name"
                  className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm ${formErrors.name ? 'border-red-500' : 'border-gray-200/50 dark:border-gray-700/50'}`}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Organization *</label>
                <Input
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="Enter organization"
                  className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm ${formErrors.organization ? 'border-red-500' : 'border-gray-200/50 dark:border-gray-700/50'}`}
                />
                {formErrors.organization && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.organization}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Division</label>
                <Input
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  placeholder="e.g., Premier, Division 1"
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Age Group</label>
                <Input
                  value={formData.age_group}
                  onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                  placeholder="e.g., Under 16, Adult"
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Skill Level</label>
                <Input
                  value={formData.skill_level}
                  onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateTeam}
                disabled={formLoading}
                className="button-primary"
              >
                <span>{formLoading ? 'Creating...' : 'Create Team'}</span>
              </motion.button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog - Enhanced with better styling */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="glass-card glass-card-hover max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-center pb-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-xl glow-border floating-element">
                  <Edit className="w-8 h-8 text-white" />
                </div>
              </div>
              <DialogTitle className="gradient-text text-4xl font-bold mb-2">Edit Team</DialogTitle>
              <DialogDescription className="text-lg text-muted-foreground">
                Update team information for <span className="font-semibold text-foreground">{selectedTeam?.name}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">
              {/* Team Information Card */}
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  Team Information
                </h3>

                <div className="space-y-6">
                  {/* Name and Organization - Required Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground uppercase tracking-wide">
                        Team Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter team name"
                        className={`w-full px-4 py-3 text-lg rounded-lg border-2 bg-white dark:bg-gray-800 text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                          formErrors.name
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        }`}
                      />
                      {formErrors.name && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground uppercase tracking-wide">
                        Organization <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        placeholder="Enter organization"
                        className={`w-full px-4 py-3 text-lg rounded-lg border-2 bg-white dark:bg-gray-800 text-foreground placeholder:text-muted-foreground transition-all duration-200 ${
                          formErrors.organization
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        }`}
                      />
                      {formErrors.organization && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          {formErrors.organization}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground uppercase tracking-wide">Division</label>
                      <Input
                        value={formData.division}
                        onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                        placeholder="e.g., Premier, Division 1"
                        className="w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground uppercase tracking-wide">Age Group</label>
                      <Input
                        value={formData.age_group}
                        onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                        placeholder="e.g., Under 16, Adult"
                        className="w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-foreground uppercase tracking-wide">Skill Level</label>
                      <Input
                        value={formData.skill_level}
                        onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                        placeholder="e.g., Beginner, Intermediate, Advanced"
                        className="w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 pt-6 border-t border-border gap-4">
              <Button
                variant="outline"
                onClick={() => setShowEditForm(false)}
                className="px-8 py-3 text-base font-medium border-2 border-gray-300 hover:bg-gray-100 transition-all duration-200"
              >
                Cancel
              </Button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEditTeam}
                disabled={formLoading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-base flex items-center gap-2"
              >
                {formLoading && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                )}
                <span>{formLoading ? 'Updating Team...' : 'Update Team'}</span>
              </motion.button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="glass-card border-gray-200/50 dark:border-gray-700/50">
            <DialogHeader>
              <DialogTitle className="text-2xl text-red-600">Delete Team</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete "{selectedTeam?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDeleteTeam}
                disabled={formLoading}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                {formLoading ? 'Deleting...' : 'Delete Team'}
              </motion.button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  )
}