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
import { Search, Plus, Edit, Trash2, Users, AlertTriangle, Phone, Mail, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface Player {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  organization: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relation?: string
  medical_alerts?: string
  address?: string
  created_at: string
}

interface PlayerFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  organization: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relation: string
  medical_alerts: string
  address: string
}

export default function PlayerManagementInterface() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const playersPerPage = 9

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [formData, setFormData] = useState<PlayerFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    organization: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    medical_alerts: '',
    address: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<PlayerFormData>>({})

  useEffect(() => {
    fetchPlayers(1, searchTerm)
  }, [])

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchPlayers(1, searchTerm)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const fetchPlayers = async (page: number = currentPage, search: string = searchTerm) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: playersPerPage.toString(),
        search: search
      })
      const response = await fetch(`/api/players?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch players')
      }
      const data = await response.json()
      setPlayers(data.players)
      setTotalPages(data.pagination.totalPages)
      setTotalPlayers(data.pagination.total)
      setError(null)
    } catch (err) {
      setError('Failed to load players')
      console.error('Fetch players error:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const validateForm = (data: PlayerFormData): boolean => {
    const errors: Partial<PlayerFormData> = {}

    if (!data.first_name.trim()) {
      errors.first_name = 'First name is required'
    }
    if (!data.last_name.trim()) {
      errors.last_name = 'Last name is required'
    }
    if (!data.organization.trim()) {
      errors.organization = 'Organization is required'
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email format'
    }
    if (data.phone && !/^[\+]?[\d\s\-\(\)]{10,}$/.test(data.phone)) {
      errors.phone = 'Invalid phone number format'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreatePlayer = async () => {
    if (!validateForm(formData)) return

    try {
      setFormLoading(true)
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create player')
      }

      // Refresh players list
      await fetchPlayers(currentPage, searchTerm)
      setShowCreateForm(false)
      resetForm()
    } catch (err) {
      console.error('Create player error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create player')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditPlayer = async () => {
    if (!selectedPlayer || !validateForm(formData)) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/players/${selectedPlayer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update player')
      }

      // Refresh players list
      await fetchPlayers(currentPage, searchTerm)
      setShowEditForm(false)
      resetForm()
      setSelectedPlayer(null)
    } catch (err) {
      console.error('Update player error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update player')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeletePlayer = async () => {
    if (!selectedPlayer) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/players/${selectedPlayer.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete player')
      }

      // Refresh players list
      // Go back to page 1 if current page becomes empty after deletion
      const newPage = players.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
      setCurrentPage(newPage)
      await fetchPlayers(newPage, searchTerm)
      setShowDeleteDialog(false)
      setSelectedPlayer(null)
    } catch (err) {
      console.error('Delete player error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete player')
    } finally {
      setFormLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      organization: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: '',
      medical_alerts: '',
      address: ''
    })
    setFormErrors({})
  }

  const openCreateForm = () => {
    resetForm()
    setShowCreateForm(true)
  }

  const openEditForm = (player: Player) => {
    setSelectedPlayer(player)
    setFormData({
      first_name: player.first_name,
      last_name: player.last_name,
      email: player.email || '',
      phone: player.phone || '',
      date_of_birth: player.date_of_birth || '',
      organization: player.organization,
      emergency_contact_name: player.emergency_contact_name || '',
      emergency_contact_phone: player.emergency_contact_phone || '',
      emergency_contact_relation: player.emergency_contact_relation || '',
      medical_alerts: player.medical_alerts || '',
      address: player.address || ''
    })
    setFormErrors({})
    setShowEditForm(true)
  }

  const openDeleteDialog = (player: Player) => {
    setSelectedPlayer(player)
    setShowDeleteDialog(true)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      fetchPlayers(page, searchTerm)
    }
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Players</h1>
          <p className="text-muted-foreground">
            Manage player profiles and information
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Player
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
      <Card>
        <CardHeader>
          <CardTitle>Search Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player) => (
          <Card key={player.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    {player.first_name} {player.last_name}
                  </CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(player)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(player)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{player.organization}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {player.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{player.email}</span>
                  </div>
                )}
                {player.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{player.phone}</span>
                  </div>
                )}
                {player.date_of_birth && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Age {calculateAge(player.date_of_birth)}</span>
                  </div>
                )}
                {player.medical_alerts && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <span className="font-medium text-yellow-800">Medical Alert:</span>
                    <div className="text-yellow-700">{player.medical_alerts}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number
              if (totalPages <= 5) {
                page = i + 1
              } else if (currentPage <= 3) {
                page = i + 1
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i
              } else {
                page = currentPage - 2 + i
              }

              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="min-w-[40px]"
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Player Count Info */}
      {totalPlayers > 0 && (
        <div className="text-center text-sm text-muted-foreground mt-2">
          Showing {((currentPage - 1) * playersPerPage) + 1} - {Math.min(currentPage * playersPerPage, totalPlayers)} of {totalPlayers} players
        </div>
      )}

      {players.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'No players found' : 'No players yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'Get started by adding your first player'
              }
            </p>
            {!searchTerm && (
              <Button onClick={openCreateForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Player
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Player Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>
              Create a new player profile with contact and emergency information
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Basic Information</h4>

              <div>
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Enter first name"
                  className={formErrors.first_name ? 'border-destructive' : ''}
                />
                {formErrors.first_name && (
                  <p className="text-sm text-destructive mt-1">{formErrors.first_name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Enter last name"
                  className={formErrors.last_name ? 'border-destructive' : ''}
                />
                {formErrors.last_name && (
                  <p className="text-sm text-destructive mt-1">{formErrors.last_name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="player@email.com"
                  className={formErrors.email ? 'border-destructive' : ''}
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className={formErrors.phone ? 'border-destructive' : ''}
                />
                {formErrors.phone && (
                  <p className="text-sm text-destructive mt-1">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
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
            </div>

            {/* Emergency & Additional Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Emergency Contact</h4>

              <div>
                <label className="text-sm font-medium">Emergency Contact Name</label>
                <Input
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  placeholder="Contact person name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Emergency Contact Phone</label>
                <Input
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  placeholder="Emergency phone number"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Relationship</label>
                <Input
                  value={formData.emergency_contact_relation}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                  placeholder="Parent, Guardian, etc."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Medical Alerts</label>
                <Input
                  value={formData.medical_alerts}
                  onChange={(e) => setFormData({ ...formData, medical_alerts: e.target.value })}
                  placeholder="Allergies, conditions, medications..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Home address"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlayer} disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Player Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>
              Update player profile information
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Basic Information</h4>

              <div>
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Enter first name"
                  className={formErrors.first_name ? 'border-destructive' : ''}
                />
                {formErrors.first_name && (
                  <p className="text-sm text-destructive mt-1">{formErrors.first_name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Enter last name"
                  className={formErrors.last_name ? 'border-destructive' : ''}
                />
                {formErrors.last_name && (
                  <p className="text-sm text-destructive mt-1">{formErrors.last_name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="player@email.com"
                  className={formErrors.email ? 'border-destructive' : ''}
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className={formErrors.phone ? 'border-destructive' : ''}
                />
                {formErrors.phone && (
                  <p className="text-sm text-destructive mt-1">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
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
            </div>

            {/* Emergency & Additional Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Emergency Contact</h4>

              <div>
                <label className="text-sm font-medium">Emergency Contact Name</label>
                <Input
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  placeholder="Contact person name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Emergency Contact Phone</label>
                <Input
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  placeholder="Emergency phone number"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Relationship</label>
                <Input
                  value={formData.emergency_contact_relation}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                  placeholder="Parent, Guardian, etc."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Medical Alerts</label>
                <Input
                  value={formData.medical_alerts}
                  onChange={(e) => setFormData({ ...formData, medical_alerts: e.target.value })}
                  placeholder="Allergies, conditions, medications..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Home address"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPlayer} disabled={formLoading}>
              {formLoading ? 'Updating...' : 'Update Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Player</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPlayer?.first_name} {selectedPlayer?.last_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePlayer} disabled={formLoading}>
              {formLoading ? 'Deleting...' : 'Delete Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}