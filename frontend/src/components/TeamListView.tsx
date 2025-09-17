import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Search, Plus, Edit, Trash2, Shield, AlertTriangle } from 'lucide-react'

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
    // Filter teams based on search term
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
      setTeams(data)
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

      // Refresh teams list
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

      // Refresh teams list
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

      // Refresh teams list
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
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600">
            Manage your organization's teams
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Search Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by team name, organization, division..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-lg text-gray-900">{team.name}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(team)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(team)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-gray-600">{team.organization}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {team.division && (
                  <div>
                    <span className="font-medium">Division:</span> {team.division}
                  </div>
                )}
                {team.age_group && (
                  <div>
                    <span className="font-medium">Age Group:</span> {team.age_group}
                  </div>
                )}
                {team.skill_level && (
                  <div>
                    <span className="font-medium">Skill Level:</span> {team.skill_level}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTeams.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'No teams found' : 'No teams yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'Get started by creating your first team'
              }
            </p>
            {!searchTerm && (
              <Button onClick={openCreateForm}>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Team Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Add a new team to your organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Team Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter team name"
                className={formErrors.name ? 'border-destructive' : ''}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Organization *</label>
              <Input
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="Enter organization"
                className={formErrors.organization ? 'border-destructive' : ''}
              />
              {formErrors.organization && (
                <p className="text-sm text-destructive mt-1">{formErrors.organization}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Division</label>
              <Input
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                placeholder="e.g., Premier, Division 1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Age Group</label>
              <Input
                value={formData.age_group}
                onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                placeholder="e.g., Under 16, Adult"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Skill Level</label>
              <Input
                value={formData.skill_level}
                onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                placeholder="e.g., Beginner, Intermediate, Advanced"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Team Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter team name"
                className={formErrors.name ? 'border-destructive' : ''}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Organization *</label>
              <Input
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="Enter organization"
                className={formErrors.organization ? 'border-destructive' : ''}
              />
              {formErrors.organization && (
                <p className="text-sm text-destructive mt-1">{formErrors.organization}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Division</label>
              <Input
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                placeholder="e.g., Premier, Division 1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Age Group</label>
              <Input
                value={formData.age_group}
                onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                placeholder="e.g., Under 16, Adult"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Skill Level</label>
              <Input
                value={formData.skill_level}
                onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                placeholder="e.g., Beginner, Intermediate, Advanced"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTeam} disabled={formLoading}>
              {formLoading ? 'Updating...' : 'Update Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTeam?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeam} disabled={formLoading}>
              {formLoading ? 'Deleting...' : 'Delete Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}