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
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
  Filter,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AmenityTypeForm from './AmenityTypeForm'

interface AmenityType {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Notification {
  type: 'success' | 'error' | 'warning'
  message: string
}

const AmenityTypeManagement = () => {
  const [amenityTypes, setAmenityTypes] = useState<AmenityType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [notification, setNotification] = useState<Notification | null>(null)

  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAmenityType, setSelectedAmenityType] = useState<AmenityType | null>(null)

  const showNotification = (type: Notification['type'], message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const fetchAmenityTypes = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchTerm) params.append('name', searchTerm)
      if (showActiveOnly) params.append('is_active', 'true')
      params.append('sort_by', 'name')
      params.append('sort_order', 'asc')

      const response = await fetch(`/api/venue-amenities?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch amenity types')
      }

      const data = await response.json()
      setAmenityTypes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch amenity types')
      showNotification('error', 'Failed to load amenity types')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAmenityType = async (data: { name: string; description?: string }) => {
    try {
      const response = await fetch('/api/venue-amenities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create amenity type')
      }

      await fetchAmenityTypes()
      setShowCreateForm(false)
      showNotification('success', 'Amenity type created successfully!')
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to create amenity type')
    }
  }

  const handleEditAmenityType = async (data: { name: string; description?: string }) => {
    if (!selectedAmenityType) return

    try {
      const response = await fetch(`/api/venue-amenities/${selectedAmenityType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update amenity type')
      }

      await fetchAmenityTypes()
      setShowEditForm(false)
      setSelectedAmenityType(null)
      showNotification('success', 'Amenity type updated successfully!')
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to update amenity type')
    }
  }

  const handleDeleteAmenityType = async () => {
    if (!selectedAmenityType) return

    try {
      const response = await fetch(`/api/venue-amenities/${selectedAmenityType.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete amenity type')
      }

      await fetchAmenityTypes()
      setShowDeleteDialog(false)
      setSelectedAmenityType(null)
      showNotification('success', 'Amenity type deleted successfully!')
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Failed to delete amenity type')
    }
  }

  const handleSearch = () => {
    fetchAmenityTypes()
  }

  const clearSearch = () => {
    setSearchTerm('')
    setTimeout(() => fetchAmenityTypes(), 0)
  }

  const toggleActiveFilter = () => {
    setShowActiveOnly(!showActiveOnly)
    setTimeout(() => fetchAmenityTypes(), 0)
  }

  useEffect(() => {
    fetchAmenityTypes()
  }, [])

  if (loading && amenityTypes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-500">Loading amenity types...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            } text-white`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Amenity Type Management</h1>
        <p className="text-gray-600">Manage global amenity types for venues</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search amenity types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSearch}
                className="whitespace-nowrap"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>

              <Button
                variant={showActiveOnly ? "default" : "outline"}
                onClick={toggleActiveFilter}
                className="whitespace-nowrap"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showActiveOnly ? 'Active Only' : 'All'}
              </Button>
            </div>
          </div>

          {/* Create Button */}
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Amenity Type
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Amenity Types</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <Button
            onClick={fetchAmenityTypes}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Amenity Types Grid */}
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {amenityTypes.map((amenityType) => (
              <motion.div
                key={amenityType.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-orange-500 mr-2" />
                      <h3 className="font-semibold text-gray-900 truncate">{amenityType.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAmenityType(amenityType)
                          setShowEditForm(true)
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAmenityType(amenityType)
                          setShowDeleteDialog(true)
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {amenityType.description || 'No description provided'}
                  </p>

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded-full ${
                      amenityType.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {amenityType.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span>
                      Created {new Date(amenityType.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && amenityTypes.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No amenity types found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || !showActiveOnly
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first amenity type'}
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Amenity Type
          </Button>
        </div>
      )}

      {/* Create Form Modal */}
      <AmenityTypeForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateAmenityType}
        title="Create New Amenity Type"
      />

      {/* Edit Form Modal */}
      <AmenityTypeForm
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false)
          setSelectedAmenityType(null)
        }}
        onSubmit={handleEditAmenityType}
        title="Edit Amenity Type"
        initialData={selectedAmenityType ? {
          name: selectedAmenityType.name,
          description: selectedAmenityType.description || ''
        } : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Amenity Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedAmenityType?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
            <p className="text-sm text-yellow-700">
              Warning: If this amenity type is currently associated with venues, you may encounter issues.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAmenityType}
            >
              Delete Amenity Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AmenityTypeManagement