import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  Filter,
  DollarSign,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useApi } from '../hooks/useApi'

interface Registration {
  id: string
  player_id: string
  program_id: string
  status: 'pending' | 'confirmed' | 'cancelled'
  registration_date: string
  notes: string | null
  amount_paid: number
  total_amount_due: number
  created_at: string
  updated_at: string
  users: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  programs: {
    id: string
    name: string
    season: string
    start_date: string
    end_date: string
    base_fee: number
  }
}

interface RegistrationStats {
  total: number
  pending: number
  confirmed: number
  cancelled: number
  totalRevenue: number
  pendingRevenue: number
}

interface RegistrationFilters {
  search: string
  status: string
  program_id: string
  payment_status: string
  date_from: string
  date_to: string
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
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  cancelled: XCircle
}

export default function RegistrationManagementDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [stats, setStats] = useState<RegistrationStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    totalRevenue: 0,
    pendingRevenue: 0
  })
  const [programs, setPrograms] = useState<{ id: string; name: string; season: string }[]>([])
  const [filters, setFilters] = useState<RegistrationFilters>({
    search: '',
    status: '',
    program_id: '',
    payment_status: '',
    date_from: '',
    date_to: ''
  })
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(20)

  const { loading, error, execute } = useApi<{ registrations: Registration[]; pagination?: { total: number } }>()

  const fetchRegistrations = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.program_id && { program_id: filters.program_id }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to })
      })

      const response = await execute(`/api/registrations?${queryParams}`)
      setRegistrations(response.registrations || [])

      if (response.pagination) {
        setTotalPages(Math.ceil(response.pagination.total / limit))
      }

      // Calculate stats
      const all = response.registrations || []
      const stats: RegistrationStats = {
        total: all.length,
        pending: all.filter((r: Registration) => r.status === 'pending').length,
        confirmed: all.filter((r: Registration) => r.status === 'confirmed').length,
        cancelled: all.filter((r: Registration) => r.status === 'cancelled').length,
        totalRevenue: all.reduce((sum: number, r: Registration) => sum + (r.amount_paid || 0), 0),
        pendingRevenue: all.filter((r: Registration) => r.status === 'pending').reduce((sum: number, r: Registration) => sum + (r.total_amount_due - (r.amount_paid || 0)), 0)
      }
      setStats(stats)

    } catch (err) {
      console.error('Failed to fetch registrations:', err)
    }
  }, [currentPage, limit, filters, execute])

  const fetchPrograms = useCallback(async () => {
    try {
      const response = await execute('/api/programs')
      setPrograms(response.programs || [])
    } catch (err) {
      console.error('Failed to fetch programs:', err)
    }
  }, [execute])

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  useEffect(() => {
    fetchRegistrations()
  }, [fetchRegistrations])

  const handleFilterChange = (key: keyof RegistrationFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      program_id: '',
      payment_status: '',
      date_from: '',
      date_to: ''
    })
    setCurrentPage(1)
  }

  const handleUpdateStatus = async () => {
    if (!selectedRegistration || !newStatus) return

    try {
      await execute(`/api/registrations/${selectedRegistration.id}`, {
        method: 'PUT',
        body: { status: newStatus }
      })

      await fetchRegistrations()
      setShowUpdateDialog(false)
      setSelectedRegistration(null)
      setNewStatus('')
    } catch (err) {
      console.error('Failed to update registration status:', err)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getPaymentStatus = (registration: Registration) => {
    const paid = registration.amount_paid || 0
    const due = registration.total_amount_due || 0

    if (paid === 0) return 'unpaid'
    if (paid >= due) return 'paid'
    return 'partial'
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'unpaid': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Registration Management</h1>
              <p className="text-gray-600 mt-1">Manage player registrations and track payments</p>
            </div>
            <div className="flex items-center gap-3 mt-4 lg:mt-0">
              <Button
                variant="outline"
                onClick={fetchRegistrations}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Confirmed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search players..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.program_id} onValueChange={(value) => handleFilterChange('program_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Programs</SelectItem>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.payment_status} onValueChange={(value) => handleFilterChange('payment_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partially Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  placeholder="From Date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />

                <Input
                  type="date"
                  placeholder="To Date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                />
              </div>

              {(filters.search || filters.status || filters.program_id || filters.payment_status || filters.date_from || filters.date_to) && (
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Registrations Table */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Registrations</CardTitle>
              <CardDescription>
                Showing {registrations.length} registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading registrations...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8 text-red-600">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  {error}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Player</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Program</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Payment</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {registrations.map((registration) => {
                          const StatusIcon = statusIcons[registration.status]
                          const paymentStatus = getPaymentStatus(registration)

                          return (
                            <motion.tr
                              key={registration.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {registration.users.first_name} {registration.users.last_name}
                                  </p>
                                  <p className="text-sm text-gray-500">{registration.users.email}</p>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">{registration.programs.name}</p>
                                  <p className="text-sm text-gray-500">{registration.programs.season}</p>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-gray-900">
                                {formatDate(registration.registration_date)}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[registration.status]}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(paymentStatus)}`}>
                                  {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {formatCurrency(registration.amount_paid || 0)} / {formatCurrency(registration.total_amount_due)}
                                  </p>
                                  {registration.amount_paid < registration.total_amount_due && (
                                    <p className="text-sm text-red-600">
                                      Balance: {formatCurrency(registration.total_amount_due - (registration.amount_paid || 0))}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedRegistration(registration)
                                        setShowDetailsDialog(true)
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedRegistration(registration)
                                        setNewStatus(registration.status)
                                        setShowUpdateDialog(true)
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Update Status
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Cancel Registration
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>

                  {registrations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No registrations found matching your criteria.
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Registration Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>
              Complete information for this registration
            </DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Player Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {selectedRegistration.users.first_name} {selectedRegistration.users.last_name}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {selectedRegistration.users.email}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {selectedRegistration.users.phone}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Program Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Program:</span> {selectedRegistration.programs.name}
                    </div>
                    <div>
                      <span className="font-medium">Season:</span> {selectedRegistration.programs.season}
                    </div>
                    <div>
                      <span className="font-medium">Dates:</span> {formatDate(selectedRegistration.programs.start_date)} - {formatDate(selectedRegistration.programs.end_date)}
                    </div>
                    <div>
                      <span className="font-medium">Fee:</span> {formatCurrency(selectedRegistration.programs.base_fee)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Registration Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedRegistration.status]}`}>
                      {selectedRegistration.status.charAt(0).toUpperCase() + selectedRegistration.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Registration Date:</span> {formatDate(selectedRegistration.registration_date)}
                  </div>
                  <div>
                    <span className="font-medium">Amount Paid:</span> {formatCurrency(selectedRegistration.amount_paid || 0)}
                  </div>
                  <div>
                    <span className="font-medium">Total Due:</span> {formatCurrency(selectedRegistration.total_amount_due)}
                  </div>
                </div>
                {selectedRegistration.notes && (
                  <div className="mt-4">
                    <span className="font-medium">Notes:</span>
                    <p className="mt-1 text-gray-600">{selectedRegistration.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Registration Status</DialogTitle>
            <DialogDescription>
              Change the status of this registration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus} disabled={!newStatus || loading}>
                {loading ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}