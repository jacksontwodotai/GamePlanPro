import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  Settings,
  Building2,
  MapPin,
  Users,
  Calendar,
  AlertTriangle,
  Loader2,
  X,
  Plus,
  Check,
  Trash2
} from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'

interface Venue {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  capacity?: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface VenueAmenity {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface VenueAmenityAssociation {
  amenity_id: string
  quantity?: number
  notes?: string
  amenity: VenueAmenity
  created_at: string
  updated_at: string
}

interface AmenityFormData {
  amenity_id: string
  quantity: number
  notes: string
}

export default function VenueDetailPage() {
  const navigate = useNavigate()
  const { venueId } = useParams<{ venueId: string }>()

  const [venue, setVenue] = useState<Venue | null>(null)
  const [venueAmenities, setVenueAmenities] = useState<VenueAmenityAssociation[]>([])
  const [availableAmenities, setAvailableAmenities] = useState<VenueAmenity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [selectedAmenities, setSelectedAmenities] = useState<AmenityFormData[]>([])

  useEffect(() => {
    if (!venueId) {
      setError('No venue ID provided')
      setLoading(false)
      return
    }

    fetchVenueData()
  }, [venueId])

  const fetchVenueData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch venue details and amenities in parallel
      const [venueResponse, amenitiesResponse] = await Promise.all([
        fetch(`/api/venues/${venueId}`),
        fetch(`/api/venues/${venueId}/amenities`)
      ])

      if (!venueResponse.ok) {
        if (venueResponse.status === 404) {
          throw new Error('Venue not found')
        }
        throw new Error(`Failed to fetch venue (${venueResponse.status})`)
      }

      if (!amenitiesResponse.ok) {
        throw new Error(`Failed to fetch venue amenities (${amenitiesResponse.status})`)
      }

      const [venueData, amenitiesData] = await Promise.all([
        venueResponse.json(),
        amenitiesResponse.json()
      ])

      setVenue(venueData)
      setVenueAmenities(amenitiesData)

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch venue data'
      setError(message)
      console.error('Error fetching venue data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableAmenities = async () => {
    try {
      const response = await fetch('/api/venue-amenities?limit=1000')
      if (!response.ok) {
        throw new Error('Failed to fetch available amenities')
      }
      const data = await response.json()
      setAvailableAmenities(data.filter((amenity: VenueAmenity) => amenity.is_active))
    } catch (error) {
      console.error('Error fetching available amenities:', error)
    }
  }

  const handleOpenModal = async () => {
    await fetchAvailableAmenities()

    // Initialize selected amenities with current associations
    const currentAmenities = venueAmenities.map(assoc => ({
      amenity_id: assoc.amenity_id,
      quantity: assoc.quantity || 1,
      notes: assoc.notes || ''
    }))

    setSelectedAmenities(currentAmenities)
    setModalOpen(true)
  }

  const handleAmenityToggle = (amenityId: string, checked: boolean) => {
    if (checked) {
      setSelectedAmenities(prev => [
        ...prev,
        { amenity_id: amenityId, quantity: 1, notes: '' }
      ])
    } else {
      setSelectedAmenities(prev => prev.filter(a => a.amenity_id !== amenityId))
    }
  }

  const handleAmenityUpdate = (amenityId: string, field: 'quantity' | 'notes', value: string | number) => {
    setSelectedAmenities(prev => prev.map(amenity =>
      amenity.amenity_id === amenityId
        ? { ...amenity, [field]: value }
        : amenity
    ))
  }

  const handleSaveAmenities = async () => {
    try {
      setModalLoading(true)

      const currentAmenityIds = venueAmenities.map(a => a.amenity_id)
      const selectedAmenityIds = selectedAmenities.map(a => a.amenity_id)

      // Find additions, updates, and removals
      const toAdd = selectedAmenities.filter(a => !currentAmenityIds.includes(a.amenity_id))
      const toUpdate = selectedAmenities.filter(a => currentAmenityIds.includes(a.amenity_id))
      const toRemove = currentAmenityIds.filter(id => !selectedAmenityIds.includes(id))

      // Process additions
      if (toAdd.length > 0) {
        const response = await fetch(`/api/venues/${venueId}/amenities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            associations: toAdd.map(a => ({
              amenity_id: a.amenity_id,
              quantity: a.quantity,
              notes: a.notes
            }))
          })
        })
        if (!response.ok) {
          throw new Error('Failed to add amenities')
        }
      }

      // Process updates
      for (const amenity of toUpdate) {
        const response = await fetch(`/api/venues/${venueId}/amenities/${amenity.amenity_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantity: amenity.quantity,
            notes: amenity.notes
          })
        })
        if (!response.ok) {
          throw new Error(`Failed to update amenity ${amenity.amenity_id}`)
        }
      }

      // Process removals
      for (const amenityId of toRemove) {
        const response = await fetch(`/api/venues/${venueId}/amenities/${amenityId}`, {
          method: 'DELETE'
        })
        if (!response.ok) {
          throw new Error(`Failed to remove amenity ${amenityId}`)
        }
      }

      // Refresh venue amenities
      await fetchVenueData()
      setModalOpen(false)

    } catch (error) {
      console.error('Error saving amenities:', error)
      // Handle error display if needed
    } finally {
      setModalLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleBackToList = () => {
    navigate('/dashboard/venues')
  }

  const handleEditVenue = () => {
    navigate(`/dashboard/venues/${venueId}/edit`)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-gray-400">Loading venue details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Error Loading Venue</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={fetchVenueData}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={handleBackToList}
              className="border-zinc-600 text-gray-300 hover:bg-zinc-700"
            >
              Back to Venues
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Venue Not Found</h3>
          <p className="text-gray-400 mb-4">The venue you're looking for doesn't exist or has been deleted.</p>
          <Button
            onClick={handleBackToList}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Back to Venues
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="border-zinc-600 text-gray-300 hover:bg-zinc-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Venues
          </Button>
          <h1 className="text-2xl font-bold text-white">Venue Details</h1>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleEditVenue}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Venue
          </Button>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleOpenModal}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Amenities
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Manage Venue Amenities</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {availableAmenities.map((amenity) => {
                  const isSelected = selectedAmenities.some(a => a.amenity_id === amenity.id)
                  const selectedAmenity = selectedAmenities.find(a => a.amenity_id === amenity.id)

                  return (
                    <div key={amenity.id} className="border border-zinc-700 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleAmenityToggle(amenity.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white">{amenity.name}</h4>
                          </div>
                          {amenity.description && (
                            <p className="text-sm text-gray-400 mb-3">{amenity.description}</p>
                          )}

                          {isSelected && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`quantity-${amenity.id}`} className="text-gray-300">
                                  Quantity
                                </Label>
                                <Input
                                  id={`quantity-${amenity.id}`}
                                  type="number"
                                  min="1"
                                  value={selectedAmenity?.quantity || 1}
                                  onChange={(e) => handleAmenityUpdate(amenity.id, 'quantity', parseInt(e.target.value) || 1)}
                                  className="bg-zinc-800 border-zinc-600 text-white"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`notes-${amenity.id}`} className="text-gray-300">
                                  Notes
                                </Label>
                                <Textarea
                                  id={`notes-${amenity.id}`}
                                  placeholder="Optional notes..."
                                  value={selectedAmenity?.notes || ''}
                                  onChange={(e) => handleAmenityUpdate(amenity.id, 'notes', e.target.value)}
                                  className="bg-zinc-800 border-zinc-600 text-white"
                                  rows={2}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="border-zinc-600 text-gray-300 hover:bg-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAmenities}
                  disabled={modalLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Venue Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 rounded-lg border border-zinc-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-orange-500" />
                {venue.name}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                venue.is_active
                  ? 'bg-green-900 text-green-300 border border-green-600'
                  : 'bg-red-900 text-red-300 border border-red-600'
              }`}>
                {venue.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-4">
              {(venue.address || venue.city || venue.state || venue.zip_code) && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-white">
                      {venue.address && <span>{venue.address}</span>}
                      {venue.address && (venue.city || venue.state || venue.zip_code) && <br />}
                      {venue.city && <span>{venue.city}</span>}
                      {venue.city && venue.state && <span>, </span>}
                      {venue.state && <span>{venue.state}</span>}
                      {venue.zip_code && <span> {venue.zip_code}</span>}
                    </p>
                  </div>
                </div>
              )}

              {venue.capacity && (
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <p className="text-white">
                    Capacity: <span className="font-medium">{venue.capacity.toLocaleString()}</span>
                  </p>
                </div>
              )}

              {venue.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-white mb-2">Description</h3>
                  <p className="text-gray-300 leading-relaxed">{venue.description}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timestamps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 rounded-lg border border-zinc-700 p-6"
          >
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-orange-500" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Created</p>
                <p className="text-white">{formatDate(venue.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Last Updated</p>
                <p className="text-white">{formatDate(venue.updated_at)}</p>
              </div>
            </div>
          </motion.div>

          {/* Amenities Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 rounded-lg border border-zinc-700 p-6"
          >
            <h3 className="text-lg font-medium text-white mb-4">
              Amenities ({venueAmenities.length})
            </h3>
            {venueAmenities.length > 0 ? (
              <div className="space-y-3">
                {venueAmenities.map((assoc) => (
                  <div key={assoc.amenity_id} className="bg-zinc-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-white">{assoc.amenity.name}</h4>
                      {assoc.quantity && (
                        <span className="text-sm text-gray-400">Qty: {assoc.quantity}</span>
                      )}
                    </div>
                    {assoc.notes && (
                      <p className="text-sm text-gray-400">{assoc.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No amenities configured</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}