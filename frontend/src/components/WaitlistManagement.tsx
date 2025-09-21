import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  List, Users, Clock, CheckCircle, XCircle, AlertTriangle,
  Filter, Search, RefreshCw, ArrowLeft, Edit, Trash2,
  Calendar, User, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useApi } from '../hooks/useApi'

interface WaitlistEntry {
  id: string
  program_id: string
  player_id: number
  status: 'Active' | 'Offered' | 'Accepted' | 'Declined' | 'Expired'
  waitlist_date: string
  offer_expiration_date?: string
  position_in_queue?: number
  notes?: string
  created_at: string
  updated_at: string
  player: {
    id: number
    first_name: string
    last_name: string
    full_name: string
    email: string
  }
}

interface Program {
  id: string
  name: string
}

interface WaitlistManagementProps {
  onBack: () => void
}

type ModalType = 'offer' | 'status' | 'remove' | null

const statusConfig = {
  Active: { color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
  Offered: { color: 'text-orange-600', bg: 'bg-orange-100', icon: Calendar },
  Accepted: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
  Declined: { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
  Expired: { color: 'text-gray-600', bg: 'bg-gray-100', icon: AlertTriangle }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
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

export default function WaitlistManagement({ onBack }: WaitlistManagementProps) {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalEntries, setTotalEntries] = useState(0)
  const [loading, setLoading] = useState(false)

  // Modal states
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null)
  const [offerExpirationHours, setOfferExpirationHours] = useState(48)
  const [newStatus, setNewStatus] = useState<string>('')
  const [statusNotes, setStatusNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { execute } = useApi()

  useEffect(() => {
    fetchPrograms()
    fetchWaitlistEntries()
  }, [selectedProgram, selectedStatus, currentPage, pageSize])

  const fetchPrograms = async () => {
    try {
      const response = await execute('/api/programs')
      if (response?.programs) {
        setPrograms(response.programs)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  const fetchWaitlistEntries = async () => {
    if (!selectedProgram || selectedProgram === 'all') {
      // For now, we'll show message that program selection is required
      setWaitlistEntries([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      })

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      const response = await execute(`/api/admin/registration/programs/${selectedProgram}/waitlist?${params}`)

      if (response) {
        setWaitlistEntries(response.waitlist_entries || [])
        setTotalPages(response.pagination?.total_pages || 1)
        setTotalEntries(response.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching waitlist entries:', error)
      setMessage({ type: 'error', text: 'Failed to fetch waitlist entries' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOfferExpired = (expirationDate?: string): boolean => {
    if (!expirationDate) return false
    return new Date(expirationDate) < new Date()
  }

  const filteredEntries = waitlistEntries.filter(entry => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      entry.player.full_name.toLowerCase().includes(searchLower) ||
      entry.player.email.toLowerCase().includes(searchLower)
    )
  })

  const handleOfferSpot = async () => {
    if (!selectedEntry) return

    setIsSubmitting(true)
    try {
      const response = await execute(`/api/admin/registration/waitlist/${selectedEntry.id}/offer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_expiration_hours: offerExpirationHours })
      })

      if (response) {
        setMessage({ type: 'success', text: 'Spot offered successfully' })
        closeModal()
        fetchWaitlistEntries()
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to offer spot' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedEntry || !newStatus) return

    setIsSubmitting(true)
    try {
      const response = await execute(`/api/admin/registration/waitlist/${selectedEntry.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: statusNotes.trim() || undefined
        })
      })

      if (response) {
        setMessage({
          type: 'success',
          text: `Status updated to ${newStatus}${response.registration_created ? ' and registration created' : ''}`
        })
        closeModal()
        fetchWaitlistEntries()
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update status' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveFromWaitlist = async () => {
    if (!selectedEntry) return

    setIsSubmitting(true)
    try {
      await execute(`/api/admin/registration/waitlist/${selectedEntry.id}`, {
        method: 'DELETE'
      })

      setMessage({ type: 'success', text: 'Player removed from waitlist successfully' })
      closeModal()
      fetchWaitlistEntries()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to remove from waitlist' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openModal = (type: ModalType, entry: WaitlistEntry) => {
    setSelectedEntry(entry)
    setModalType(type)
    setMessage(null)

    if (type === 'offer') {
      setOfferExpirationHours(48)
    } else if (type === 'status') {
      setNewStatus(entry.status)
      setStatusNotes('')
    }
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedEntry(null)
    setOfferExpirationHours(48)
    setNewStatus('')
    setStatusNotes('')
    setMessage(null)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const clearMessage = () => {
    setMessage(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Waitlist Management</h2>
            <p className="text-gray-600">Manage program waitlists and offer spots to players</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={fetchWaitlistEntries}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Message Display */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{message.text}</span>
              <Button variant="ghost" size="sm" onClick={clearMessage}>
                ×
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Offered">Offered</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Declined">Declined</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Player</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Size</label>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waitlist Entries */}
      {selectedProgram === 'all' ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Program</h3>
              <p className="text-gray-500">Please select a specific program to view its waitlist entries.</p>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-500">Loading waitlist entries...</span>
        </div>
      ) : filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Waitlist Entries</h3>
              <p className="text-gray-500">
                {searchTerm ? 'No entries match your search criteria.' : 'This program has no waitlist entries yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {filteredEntries.map((entry) => {
            const statusInfo = statusConfig[entry.status]
            const StatusIcon = statusInfo.icon
            const isExpired = entry.status === 'Offered' && isOfferExpired(entry.offer_expiration_date)

            return (
              <motion.div key={entry.id} variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <User className="h-10 w-10 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {entry.player.full_name}
                          </h3>
                          <p className="text-sm text-gray-500">{entry.player.email}</p>
                          <p className="text-sm text-gray-500">
                            Added: {formatDate(entry.waitlist_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {entry.status}
                            {isExpired && ' (Expired)'}
                          </div>
                          {entry.position_in_queue && (
                            <p className="text-sm text-gray-500 mt-1">
                              Position: #{entry.position_in_queue}
                            </p>
                          )}
                          {entry.offer_expiration_date && (
                            <p className={`text-sm mt-1 ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
                              Expires: {formatDate(entry.offer_expiration_date)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {entry.status === 'Active' && (
                            <Button
                              size="sm"
                              onClick={() => openModal('offer', entry)}
                              className="flex items-center space-x-1"
                            >
                              <Calendar className="h-4 w-4" />
                              <span>Offer Spot</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openModal('status', entry)}
                            className="flex items-center space-x-1"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Update Status</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openModal('remove', entry)}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Remove</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {entry.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Notes:</strong> {entry.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredEntries.length} of {totalEntries} entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Offer Spot Modal */}
      <Dialog open={modalType === 'offer'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Offer Spot to Player</DialogTitle>
            <DialogDescription>
              Offer a spot to {selectedEntry?.player.full_name} and set an expiration date for the offer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Offer Expiration (hours)
              </label>
              <Input
                type="number"
                value={offerExpirationHours}
                onChange={(e) => setOfferExpirationHours(parseInt(e.target.value) || 48)}
                min="1"
                max="168"
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                Offer will expire in {offerExpirationHours} hours
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={closeModal}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleOfferSpot}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Offering...' : 'Offer Spot'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Status Modal */}
      <Dialog open={modalType === 'status'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Waitlist Status</DialogTitle>
            <DialogDescription>
              Update the status for {selectedEntry?.player.full_name}'s waitlist entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Status
              </label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Offered">Offered</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Declined">Declined</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <Input
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add notes about this status change"
              />
            </div>

            {newStatus === 'Accepted' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ⚠️ Setting status to "Accepted" will automatically create a program registration for this player.
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={closeModal}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={isSubmitting || !newStatus}
                className="flex-1"
              >
                {isSubmitting ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Modal */}
      <Dialog open={modalType === 'remove'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove from Waitlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently remove {selectedEntry?.player.full_name} from the waitlist?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-4">
            <p className="text-sm text-red-800">
              ⚠️ This will permanently remove the player from the waitlist. They will need to be manually re-added if needed.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveFromWaitlist}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Removing...' : 'Remove from Waitlist'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}