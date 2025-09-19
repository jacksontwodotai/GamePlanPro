import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  CreditCard,
  TrendingUp,
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpDown
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

interface Payment {
  id: string
  amount: number
  payment_method: string
  payment_method_details: Record<string, unknown>
  status: 'completed' | 'pending' | 'failed' | 'refunded'
  transaction_id?: string
  created_at: string
  updated_at: string
  program_registrations: {
    id: string
    amount_paid: number
    status: string
    registration_date: string
    notes: string
    users: {
      id: string
      first_name: string
      last_name: string
      email: string
      organization: string
    }
    programs: {
      id: string
      name: string
      description: string
      season: string
      base_fee: number
    }
    players: {
      id: string
      first_name: string
      last_name: string
      email: string
      phone: string
    }
  }
}

interface PaymentStats {
  totalPayments: number
  totalAmount: number
  pendingAmount: number
  refundedAmount: number
  completedCount: number
  pendingCount: number
  failedCount: number
  refundedCount: number
}

interface PaymentFilters {
  search: string
  status: string
  method: string
  registration_id: string
  date_from: string
  date_to: string
  amount_min: string
  amount_max: string
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
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-blue-100 text-blue-800'
}

const statusIcons = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle,
  refunded: ArrowUpDown
}

export default function PaymentHistoryDashboard() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalPayments: 0,
    totalAmount: 0,
    pendingAmount: 0,
    refundedAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0
  })
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    status: '',
    method: '',
    registration_id: '',
    date_from: '',
    date_to: '',
    amount_min: '',
    amount_max: ''
  })
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(20)
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const { loading, error, execute } = useApi<{ payments: Payment[]; pagination?: { total: number } }>()

  const fetchPayments = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.method && { method: filters.method }),
        ...(filters.registration_id && { registration_id: filters.registration_id })
      })

      const response = await execute(`/api/payments?${queryParams}`)
      let paymentsData = response.payments || []

      // Apply client-side filtering for fields not supported by backend
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        paymentsData = paymentsData.filter((payment: Payment) => {
          const playerName = `${payment.program_registrations?.users?.first_name || payment.program_registrations?.players?.first_name || ''} ${payment.program_registrations?.users?.last_name || payment.program_registrations?.players?.last_name || ''}`.toLowerCase()
          const programName = payment.program_registrations?.programs?.name?.toLowerCase() || ''
          const transactionId = payment.id.toLowerCase()

          return playerName.includes(searchLower) ||
                 programName.includes(searchLower) ||
                 transactionId.includes(searchLower)
        })
      }

      // Apply date range filtering
      if (filters.date_from || filters.date_to) {
        paymentsData = paymentsData.filter((payment: Payment) => {
          const paymentDate = new Date(payment.created_at)
          const fromDate = filters.date_from ? new Date(filters.date_from) : null
          const toDate = filters.date_to ? new Date(filters.date_to) : null

          if (fromDate && paymentDate < fromDate) return false
          if (toDate && paymentDate > toDate) return false
          return true
        })
      }

      // Apply amount range filtering
      if (filters.amount_min || filters.amount_max) {
        paymentsData = paymentsData.filter((payment: Payment) => {
          const amount = payment.amount
          const minAmount = filters.amount_min ? parseFloat(filters.amount_min) : null
          const maxAmount = filters.amount_max ? parseFloat(filters.amount_max) : null

          if (minAmount !== null && amount < minAmount) return false
          if (maxAmount !== null && amount > maxAmount) return false
          return true
        })
      }

      // Apply sorting
      paymentsData.sort((a: Payment, b: Payment) => {
        let aValue: string | number = ''
        let bValue: string | number = ''

        if (sortField === 'amount') {
          aValue = a.amount
          bValue = b.amount
        } else if (sortField === 'player_name') {
          aValue = `${a.program_registrations?.users?.first_name || a.program_registrations?.players?.first_name || ''} ${a.program_registrations?.users?.last_name || a.program_registrations?.players?.last_name || ''}`
          bValue = `${b.program_registrations?.users?.first_name || b.program_registrations?.players?.first_name || ''} ${b.program_registrations?.users?.last_name || b.program_registrations?.players?.last_name || ''}`
        } else if (sortField === 'program_name') {
          aValue = a.program_registrations?.programs?.name || ''
          bValue = b.program_registrations?.programs?.name || ''
        } else if (sortField === 'created_at') {
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })

      setPayments(paymentsData)

      // Calculate pagination for filtered results
      const filteredTotal = paymentsData.length
      setTotalPages(Math.ceil(filteredTotal / limit))

      // Calculate stats from all payments
      const allPayments = response.payments || []
      const stats: PaymentStats = {
        totalPayments: allPayments.length,
        totalAmount: allPayments.reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0),
        pendingAmount: allPayments.filter((p: Payment) => p.status === 'pending').reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0),
        refundedAmount: allPayments.filter((p: Payment) => p.status === 'refunded').reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0),
        completedCount: allPayments.filter((p: Payment) => p.status === 'completed').length,
        pendingCount: allPayments.filter((p: Payment) => p.status === 'pending').length,
        failedCount: allPayments.filter((p: Payment) => p.status === 'failed').length,
        refundedCount: allPayments.filter((p: Payment) => p.status === 'refunded').length
      }
      setStats(stats)

    } catch (err) {
      console.error('Failed to fetch payments:', err)
    }
  }, [currentPage, limit, filters, sortField, sortDirection, execute])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleFilterChange = (key: keyof PaymentFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      method: '',
      registration_id: '',
      date_from: '',
      date_to: '',
      amount_min: '',
      amount_max: ''
    })
    setCurrentPage(1)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getPaymentMethodDisplay = (method: string) => {
    if (method === 'stripe') {
      return 'Credit Card'
    }
    return method.charAt(0).toUpperCase() + method.slice(1)
  }

  const exportPayments = () => {
    // Create CSV data
    const csvData = payments.map(payment => ({
      'Transaction ID': payment.id,
      'Player Name': `${payment.program_registrations?.users?.first_name || payment.program_registrations?.players?.first_name || ''} ${payment.program_registrations?.users?.last_name || payment.program_registrations?.players?.last_name || ''}`,
      'Program': payment.program_registrations?.programs?.name || '',
      'Amount': payment.amount,
      'Payment Method': getPaymentMethodDisplay(payment.payment_method),
      'Status': payment.status,
      'Date': formatDateTime(payment.created_at),
      'Registration ID': payment.program_registrations?.id || ''
    }))

    // Convert to CSV string
    const headers = Object.keys(csvData[0] || {})
    const csvString = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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
              <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
              <p className="text-gray-600 mt-1">Track and manage payment transactions</p>
            </div>
            <div className="flex items-center gap-3 mt-4 lg:mt-0">
              <Button
                variant="outline"
                onClick={fetchPayments}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportPayments}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
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
                  <div className="p-3 rounded-full bg-green-100">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedCount}</p>
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
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search players, programs, transaction ID..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Payment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.method} onValueChange={(value) => handleFilterChange('method', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Methods</SelectItem>
                    <SelectItem value="stripe">Credit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Registration ID"
                  value={filters.registration_id}
                  onChange={(e) => handleFilterChange('registration_id', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                <Input
                  type="number"
                  placeholder="Min Amount"
                  value={filters.amount_min}
                  onChange={(e) => handleFilterChange('amount_min', e.target.value)}
                />

                <Input
                  type="number"
                  placeholder="Max Amount"
                  value={filters.amount_max}
                  onChange={(e) => handleFilterChange('amount_max', e.target.value)}
                />
              </div>

              {(filters.search || filters.status || filters.method || filters.registration_id || filters.date_from || filters.date_to || filters.amount_min || filters.amount_max) && (
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payments Table */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>
                Showing {payments.length} payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading payments...</span>
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
                        <th className="text-left py-3 px-4 font-medium text-gray-600">
                          <button
                            className="flex items-center gap-1 hover:text-gray-900"
                            onClick={() => handleSort('id')}
                          >
                            Transaction ID
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">
                          <button
                            className="flex items-center gap-1 hover:text-gray-900"
                            onClick={() => handleSort('player_name')}
                          >
                            Player
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">
                          <button
                            className="flex items-center gap-1 hover:text-gray-900"
                            onClick={() => handleSort('program_name')}
                          >
                            Program
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">
                          <button
                            className="flex items-center gap-1 hover:text-gray-900"
                            onClick={() => handleSort('amount')}
                          >
                            Amount
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Method</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">
                          <button
                            className="flex items-center gap-1 hover:text-gray-900"
                            onClick={() => handleSort('created_at')}
                          >
                            Date
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {payments.map((payment) => {
                          const StatusIcon = statusIcons[payment.status]
                          const playerName = `${payment.program_registrations?.users?.first_name || payment.program_registrations?.players?.first_name || ''} ${payment.program_registrations?.users?.last_name || payment.program_registrations?.players?.last_name || ''}`.trim()

                          return (
                            <motion.tr
                              key={payment.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="py-4 px-4">
                                <div className="font-mono text-sm text-gray-900">
                                  {payment.id.slice(0, 8)}...
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">{playerName}</p>
                                  <p className="text-sm text-gray-500">
                                    {payment.program_registrations?.users?.email || payment.program_registrations?.players?.email}
                                  </p>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">{payment.program_registrations?.programs?.name}</p>
                                  <p className="text-sm text-gray-500">{payment.program_registrations?.programs?.season}</p>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-medium text-gray-900">
                                  {formatCurrency(payment.amount)}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    {getPaymentMethodDisplay(payment.payment_method)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[payment.status]}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-gray-900">
                                {formatDateTime(payment.created_at)}
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
                                        setSelectedPayment(payment)
                                        setShowDetailsDialog(true)
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <Receipt className="h-4 w-4 mr-2" />
                                      Download Receipt
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

                  {payments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No payments found matching your criteria.
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

      {/* Payment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete transaction information
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Transaction Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Transaction ID:</span>
                      <span className="font-mono ml-2">{selectedPayment.id}</span>
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span> {formatCurrency(selectedPayment.amount)}
                    </div>
                    <div>
                      <span className="font-medium">Payment Method:</span> {getPaymentMethodDisplay(selectedPayment.payment_method)}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedPayment.status]}`}>
                        {React.createElement(statusIcons[selectedPayment.status], { className: "h-3 w-3" })}
                        {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {formatDateTime(selectedPayment.created_at)}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Player Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {`${selectedPayment.program_registrations?.users?.first_name || selectedPayment.program_registrations?.players?.first_name || ''} ${selectedPayment.program_registrations?.users?.last_name || selectedPayment.program_registrations?.players?.last_name || ''}`}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {selectedPayment.program_registrations?.users?.email || selectedPayment.program_registrations?.players?.email}
                    </div>
                    {selectedPayment.program_registrations?.players?.phone && (
                      <div>
                        <span className="font-medium">Phone:</span> {selectedPayment.program_registrations.players.phone}
                      </div>
                    )}
                    {selectedPayment.program_registrations?.users?.organization && (
                      <div>
                        <span className="font-medium">Organization:</span> {selectedPayment.program_registrations.users.organization}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Program & Registration Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Program:</span> {selectedPayment.program_registrations?.programs?.name}
                  </div>
                  <div>
                    <span className="font-medium">Season:</span> {selectedPayment.program_registrations?.programs?.season}
                  </div>
                  <div>
                    <span className="font-medium">Registration Date:</span> {formatDate(selectedPayment.program_registrations?.registration_date || '')}
                  </div>
                  <div>
                    <span className="font-medium">Registration Status:</span> {selectedPayment.program_registrations?.status}
                  </div>
                  <div>
                    <span className="font-medium">Program Fee:</span> {formatCurrency(selectedPayment.program_registrations?.programs?.base_fee || 0)}
                  </div>
                  <div>
                    <span className="font-medium">Registration ID:</span>
                    <span className="font-mono ml-2">{selectedPayment.program_registrations?.id}</span>
                  </div>
                </div>

                {selectedPayment.program_registrations?.programs?.description && (
                  <div className="mt-4">
                    <span className="font-medium">Program Description:</span>
                    <p className="mt-1 text-gray-600">{selectedPayment.program_registrations.programs.description}</p>
                  </div>
                )}

                {selectedPayment.program_registrations?.notes && (
                  <div className="mt-4">
                    <span className="font-medium">Registration Notes:</span>
                    <p className="mt-1 text-gray-600">{selectedPayment.program_registrations.notes}</p>
                  </div>
                )}
              </div>

              {selectedPayment.payment_method_details && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Payment Method Details</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(selectedPayment.payment_method_details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}