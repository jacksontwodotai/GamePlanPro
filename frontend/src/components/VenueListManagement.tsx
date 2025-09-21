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
  MapPin,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Building2,
  Users,
  Eye,
  Filter,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

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

interface VenueFilters {
  name: string
  city: string
  state: string
  minCapacity: string
  maxCapacity: string
  isActive: boolean | null
}

interface Notification {
  type: 'success' | 'error'
  message: string
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

export default function VenueListManagement() {
  const navigate = useNavigate()

  const [venues, setVenues] = useState<Venue[]>([])
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVenues, setTotalVenues] = useState(0)
  const venuesPerPage = 12

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<VenueFilters>({
    name: '',
    city: '',
    state: '',
    minCapacity: '',
    maxCapacity: '',
    isActive: null
  })

  // Dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Notification state
  const [notification, setNotification] = useState<Notification | null>(null)

  // Mock API functions (to be replaced with actual API calls)
  const fetchVenues = async (page: number = 1, venueFilters: VenueFilters) => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams({
        skip: ((page - 1) * venuesPerPage).toString(),
        limit: venuesPerPage.toString()
      })

      if (venueFilters.name) params.append('name', venueFilters.name)
      if (venueFilters.city) params.append('city', venueFilters.city)
      if (venueFilters.state) params.append('state', venueFilters.state)
      if (venueFilters.minCapacity) params.append('min_capacity', venueFilters.minCapacity)
      if (venueFilters.maxCapacity) params.append('max_capacity', venueFilters.maxCapacity)
      if (venueFilters.isActive !== null) params.append('is_active', venueFilters.isActive.toString())

      const response = await fetch(`/api/venues?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch venues')
      }

      const data = await response.json()

      // For now, mock the response structure since we don't have pagination metadata
      setVenues(data)
      setFilteredVenues(data)
      setTotalVenues(data.length)
      setTotalPages(Math.ceil(data.length / venuesPerPage))

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch venues')
      showNotification('error', 'Failed to load venues')
    } finally {
      setLoading(false)
    }
  }

  const deleteVenue = async (venueId: string) => {
    try {
      setDeleteLoading(true)

      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete venue')
      }

      // Remove venue from local state
      setVenues(prev => prev.filter(venue => venue.id !== venueId))
      setFilteredVenues(prev => prev.filter(venue => venue.id !== venueId))
      setTotalVenues(prev => prev - 1)

      showNotification('success', 'Venue deleted successfully')
      setShowDeleteDialog(false)
      setSelectedVenue(null)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete venue'
      setError(message)
      showNotification('error', message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleFilterChange = (key: keyof VenueFilters, value: string | boolean | null) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    setCurrentPage(1)
    fetchVenues(1, filters)
  }

  const clearFilters = () => {
    const clearedFilters: VenueFilters = {
      name: '',
      city: '',
      state: '',
      minCapacity: '',
      maxCapacity: '',
      isActive: null
    }
    setFilters(clearedFilters)
    setCurrentPage(1)
    fetchVenues(1, clearedFilters)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchVenues(page, filters)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteClick = (venue: Venue) => {
    setSelectedVenue(venue)
    setShowDeleteDialog(true)
  }

  const handleViewDetails = (venue: Venue) => {
    // TODO: Navigate to venue details page when implemented
    console.log('View details for venue:', venue.id)
    // For now, navigate to edit page as placeholder
    navigate(`/dashboard/venues/${venue.id}/edit`)
  }

  const handleEditVenue = (venue: Venue) => {
    navigate(`/dashboard/venues/${venue.id}/edit`)
  }

  const handleCreateVenue = () => {
    navigate('/dashboard/venues/new')
  }

  useEffect(() => {
    fetchVenues(1, filters)
  }, [])

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const showEllipsis = totalPages > 7

    if (showEllipsis) {
      // Always show first page
      pages.push(1)

      // Show ellipsis or pages around current page
      if (currentPage > 4) {
        pages.push('...')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }

      // Show ellipsis before last page if needed
      if (currentPage < totalPages - 3) {
        pages.push('...')
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages)
      }
    } else {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center space-x-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>

        <div className="flex space-x-1">
          {pages.map((page, index) => (
            page === '...' ? (
              <span key={index} className="px-3 py-2 text-gray-500">...</span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page as number)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center space-x-1"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const formatAddress = (venue: Venue) => {
    const parts = []
    if (venue.address) parts.push(venue.address)
    if (venue.city) parts.push(venue.city)
    if (venue.state) parts.push(venue.state)
    if (venue.zip_code) parts.push(venue.zip_code)
    return parts.join(', ') || 'No address provided'
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-orange-500" />
            <span>Venue Management</span>
          </h1>
          <p className="text-gray-400 mt-2">
            Manage venues and their details, amenities, and availability
          </p>
        </div>

        <Button
          onClick={handleCreateVenue}
          className="bg-orange-500 hover:bg-orange-600 text-white flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Venue</span>
        </Button>
      </motion.div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <motion.div variants={itemVariants} className="bg-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search venues by name..."
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
              className="pl-10 bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 border-zinc-600 text-gray-300 hover:bg-zinc-700"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {Object.values(filters).some(value => value !== '' && value !== null) && (
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
            )}
          </Button>

          <Button
            onClick={applyFilters}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Search
          </Button>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-zinc-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                  <Input
                    placeholder="Enter city"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                  <Input
                    placeholder="Enter state"
                    value={filters.state}
                    onChange={(e) => handleFilterChange('state', e.target.value)}
                    className="bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Min Capacity</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minCapacity}
                    onChange={(e) => handleFilterChange('minCapacity', e.target.value)}
                    className="bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Capacity</label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={filters.maxCapacity}
                    onChange={(e) => handleFilterChange('maxCapacity', e.target.value)}
                    className="bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-300">Status:</label>
                  <Button
                    variant={filters.isActive === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange('isActive', null)}
                    className="h-8"
                  >
                    All
                  </Button>
                  <Button
                    variant={filters.isActive === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange('isActive', true)}
                    className="h-8"
                  >
                    Active
                  </Button>
                  <Button
                    variant={filters.isActive === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange('isActive', false)}
                    className="h-8"
                  >
                    Inactive
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-400 hover:text-white flex items-center space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Clear Filters</span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results Summary */}
      {!loading && (
        <motion.div variants={itemVariants} className="text-gray-400 text-sm">
          Showing {filteredVenues.length} of {totalVenues} venues
          {filters.name && ` matching "${filters.name}"`}
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div variants={itemVariants} className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading venues...</p>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && !loading && (
        <motion.div variants={itemVariants} className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Error Loading Venues</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button
            onClick={() => fetchVenues(currentPage, filters)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Try Again
          </Button>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredVenues.length === 0 && (
        <motion.div variants={itemVariants} className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Venues Found</h3>
          <p className="text-gray-400 mb-4">
            {Object.values(filters).some(value => value !== '' && value !== null)
              ? "No venues match your current filters. Try adjusting your search criteria."
              : "Get started by creating your first venue."
            }
          </p>
          {Object.values(filters).some(value => value !== '' && value !== null) ? (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="border-zinc-600 text-gray-300 hover:bg-zinc-700"
            >
              Clear Filters
            </Button>
          ) : (
            <Button
              onClick={handleCreateVenue}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Create Your First Venue
            </Button>
          )}
        </motion.div>
      )}

      {/* Venues Grid */}
      {!loading && !error && filteredVenues.length > 0 && (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredVenues.map((venue) => (
            <motion.div
              key={venue.id}
              variants={itemVariants}
              whileHover="hover"
              initial="rest"
              animate="rest"
            >
              <motion.div
                variants={cardHoverVariants}
                className="bg-zinc-800 rounded-lg p-6 border border-zinc-700 hover:border-zinc-600 transition-colors"
              >
                {/* Venue Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{venue.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        venue.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {venue.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {venue.capacity && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Users className="h-3 w-3 mr-1" />
                          {venue.capacity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="mb-4">
                  <div className="flex items-start space-x-2 text-gray-400">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{formatAddress(venue)}</span>
                  </div>
                </div>

                {/* Description */}
                {venue.description && (
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm line-clamp-2">{venue.description}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-4 border-t border-zinc-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(venue)}
                    className="flex-1 border-zinc-600 text-gray-300 hover:bg-zinc-700"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditVenue(venue)}
                    className="flex-1 border-zinc-600 text-gray-300 hover:bg-zinc-700"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(venue)}
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredVenues.length > 0 && renderPagination()}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-zinc-800 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Delete Venue</span>
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete "{selectedVenue?.name}"? This action cannot be undone.
              {selectedVenue && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Deleting this venue may affect scheduled events and other related data.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteLoading}
              className="border-zinc-600 text-gray-300 hover:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedVenue && deleteVenue(selectedVenue.id)}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deleting...</span>
                </div>
              ) : (
                'Delete Venue'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}