import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  MapPin,
  Users,
  Edit3,
  Trash2,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Building,
  Home,
  Map
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog'
import { useApi } from '../hooks/useApi'

interface Venue {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  capacity?: number
  description?: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

interface VenuesResponse {
  venues: Venue[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface VenueManagementProps {
  className?: string
  onCreateVenue?: () => void
  onEditVenue?: (venueId: string) => void
}

type SortField = 'name' | 'city' | 'capacity' | 'created_at'
type SortDirection = 'asc' | 'desc'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3
    }
  }
}

export default function VenueManagement({
  className = '',
  onCreateVenue,
  onEditVenue
}: VenueManagementProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [venueToDelete, setVenueToDelete] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [cityFilter, setCityFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // API hooks
  const { data: venuesData, loading, error, execute: fetchVenues } = useApi<VenuesResponse>()
  const { loading: deleting, execute: deleteVenue } = useApi()

  // Fetch venues with current filters and pagination
  const loadVenues = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      })

      if (cityFilter) {
        params.append('city', cityFilter)
      }

      if (activeFilter !== 'all') {
        params.append('is_active', (activeFilter === 'active').toString())
      }

      await fetchVenues(`/api/venues?${params}`)
    } catch (err) {
      console.error('Failed to load venues:', err)
    }
  }, [fetchVenues, currentPage, pageSize, cityFilter, activeFilter])

  // Load venues on mount and when filters change
  useEffect(() => {
    loadVenues()
  }, [loadVenues])

  // Filter and sort venues client-side for search functionality
  const filteredAndSortedVenues = React.useMemo(() => {
    let filtered = venuesData?.venues || []

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1

      // Convert to strings for comparison if needed
      if (typeof aValue === 'string') aValue = aValue.toLowerCase()
      if (typeof bValue === 'string') bValue = bValue.toLowerCase()

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [venuesData?.venues, searchQuery, sortField, sortDirection])

  // Handle venue deletion
  const handleDeleteVenue = async () => {
    if (!venueToDelete) return

    try {
      await deleteVenue(`/api/venues/${venueToDelete}`, { method: 'DELETE' })
      setShowDeleteConfirm(false)
      setVenueToDelete(null)
      setShowDetails(false)
      setSelectedVenue(null)
      await loadVenues() // Refresh venue list
    } catch (err) {
      console.error('Failed to delete venue:', err)
    }
  }

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Get unique cities for filter
  const availableCities = React.useMemo(() => {
    const cities = new Set<string>()
    venuesData?.venues?.forEach(venue => {
      if (venue.city) cities.add(venue.city)
    })
    return Array.from(cities).sort()
  }, [venuesData?.venues])

  // Handle view venue details
  const handleViewDetails = (venue: Venue) => {
    setSelectedVenue(venue)
    setShowDetails(true)
  }

  // Handle edit venue
  const handleEditVenue = (venueId: string) => {
    if (onEditVenue) {
      onEditVenue(venueId)
    }
    setShowDetails(false)
  }

  // Handle delete confirmation
  const handleDeleteClick = (venueId: string) => {
    setVenueToDelete(venueId)
    setShowDeleteConfirm(true)
  }

  // Pagination
  const totalPages = venuesData?.pagination?.pages || 1
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`space-y-6 ${className}`}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Venue Management
                  </CardTitle>
                  <p className="text-gray-600">Manage venue information and settings</p>
                </div>
              </div>
              <Button
                onClick={() => onCreateVenue && onCreateVenue()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Venue
              </Button>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div variants={itemVariants}>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Filters and Search */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search venues by name, address, city, or description..."
                  className="pl-10"
                />
              </div>

              {/* City Filter */}
              <div className="w-full md:w-48">
                <select
                  value={cityFilter}
                  onChange={(e) => {
                    setCityFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Cities</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Active Filter */}
              <div className="w-full md:w-32">
                <select
                  value={activeFilter}
                  onChange={(e) => {
                    setActiveFilter(e.target.value as typeof activeFilter)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Venue List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Map className="h-5 w-5 mr-2 text-blue-600" />
              Venues ({venuesData?.pagination?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading venues...</span>
              </div>
            ) : filteredAndSortedVenues.length > 0 ? (
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg font-semibold text-sm text-gray-700">
                  <button
                    onClick={() => handleSort('name')}
                    className="col-span-3 flex items-center space-x-1 hover:text-blue-600 transition-colors text-left"
                  >
                    <span>Name</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                  <div className="col-span-3">Address</div>
                  <button
                    onClick={() => handleSort('city')}
                    className="col-span-2 flex items-center space-x-1 hover:text-blue-600 transition-colors text-left"
                  >
                    <span>City</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleSort('capacity')}
                    className="col-span-1 flex items-center space-x-1 hover:text-blue-600 transition-colors text-left"
                  >
                    <span>Capacity</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Venue Rows */}
                {filteredAndSortedVenues.map((venue) => (
                  <div
                    key={venue.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 border border-gray-200 rounded-lg hover:shadow-md transition-all bg-white"
                  >
                    <div className="col-span-3">
                      <div className="font-semibold text-gray-900">{venue.name}</div>
                    </div>
                    <div className="col-span-3 text-sm text-gray-600">
                      {venue.address || 'No address'}
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">
                      {venue.city || '-'}
                      {venue.state && `, ${venue.state}`}
                    </div>
                    <div className="col-span-1 text-sm text-gray-600 flex items-center">
                      {venue.capacity ? (
                        <>
                          <Users className="h-3 w-3 mr-1" />
                          {venue.capacity}
                        </>
                      ) : (
                        '-'
                      )}
                    </div>
                    <div className="col-span-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          venue.is_active !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {venue.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(venue)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVenue(venue.id)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(venue.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No venues found</p>
                <p className="text-sm">
                  {searchQuery || cityFilter || activeFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Create your first venue to get started'}
                </p>
                {!searchQuery && !cityFilter && activeFilter === 'all' && (
                  <Button
                    className="mt-4"
                    onClick={() => onCreateVenue && onCreateVenue()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Venue
                  </Button>
                )}
              </div>
            )}

            {/* Pagination */}
            {venuesData && venuesData.pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {venuesData.pagination.page} of {venuesData.pagination.pages} pages
                  ({venuesData.pagination.total} total venues)
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!canGoPrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="px-3 py-1 text-sm font-medium">
                    {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!canGoNext}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Venue Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-500" />
              Venue Details
            </DialogTitle>
          </DialogHeader>

          {selectedVenue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedVenue.name}</h3>
                  <div className="flex items-center mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedVenue.is_active !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedVenue.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                {selectedVenue.capacity && (
                  <div className="text-right">
                    <div className="flex items-center justify-end">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-lg font-semibold">{selectedVenue.capacity}</span>
                    </div>
                    <div className="text-sm text-gray-500">Capacity</div>
                  </div>
                )}
              </div>

              {/* Address */}
              {(selectedVenue.address || selectedVenue.city) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Home className="h-4 w-4 mr-2 text-gray-400" />
                    Address
                  </h4>
                  <div className="text-gray-600">
                    {selectedVenue.address && (
                      <div>{selectedVenue.address}</div>
                    )}
                    {(selectedVenue.city || selectedVenue.state || selectedVenue.zip_code) && (
                      <div>
                        {selectedVenue.city}
                        {selectedVenue.state && `, ${selectedVenue.state}`}
                        {selectedVenue.zip_code && ` ${selectedVenue.zip_code}`}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedVenue.description && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedVenue.description}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t pt-4 text-sm text-gray-500">
                <div>Created: {new Date(selectedVenue.created_at).toLocaleDateString()}</div>
                <div>Updated: {new Date(selectedVenue.updated_at).toLocaleDateString()}</div>
              </div>
            </div>
          )}

          <DialogFooter className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDetails(false)}
            >
              Close
            </Button>
            {selectedVenue && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleEditVenue(selectedVenue.id)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteClick(selectedVenue.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this venue? This action cannot be undone and may affect associated events.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVenue}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Venue
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}