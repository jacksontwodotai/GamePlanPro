import { useState, useEffect, useCallback } from 'react'
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
  ArrowUpDown,
  Users,
  Calendar,
  Settings,
  FileText,
  ArrowUp,
  ArrowDown
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
import { Badge } from './ui/badge'
import { useApi } from '../hooks/useApi'

interface Payment {
  id: string
  program_registration_id: string
  amount: number
  payment_method: string
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
  transaction_id?: string
  gateway_payment_id?: string
  failure_reason?: string
  refund_amount?: number
  refund_reason?: string
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
  completedAmount: number
  pendingAmount: number
  failedAmount: number
  refundedAmount: number
  completedCount: number
  pendingCount: number
  failedCount: number
  refundedCount: number
  avgPaymentAmount: number
  todaysRevenue: number
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
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 20
    }
  }
}

const statusConfig = {
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
  refunded: { color: 'bg-blue-100 text-blue-800', icon: ArrowUpDown },
  cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export default function AdminPaymentManagementDashboard() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalPayments: 0,
    totalAmount: 0,
    completedAmount: 0,
    pendingAmount: 0,
    failedAmount: 0,
    refundedAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0,
    avgPaymentAmount: 0,
    todaysRevenue: 0
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
  const [pageSize, setPageSize] = useState(25)
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [totalCount, setTotalCount] = useState(0)

  const { loading, error, execute } = useApi<{ payments: Payment[]; count?: number }>()

  const fetchPayments = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: '1', // Fetch all data for client-side processing
        limit: '1000', // Large limit to get all payments
        ...(filters.status && { status: filters.status }),
        ...(filters.method && { method: filters.method }),
        ...(filters.registration_id && { registration_id: filters.registration_id })
      })

      const response = await execute(`/api/payments?${queryParams}`)
      let paymentsData = response?.payments || []

      // Apply client-side filtering
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        paymentsData = paymentsData.filter((payment: Payment) => {
          const playerName = `${payment.program_registrations?.users?.first_name || payment.program_registrations?.players?.first_name || ''} ${payment.program_registrations?.users?.last_name || payment.program_registrations?.players?.last_name || ''}`.toLowerCase()
          const programName = payment.program_registrations?.programs?.name?.toLowerCase() || ''
          const transactionId = payment.id.toLowerCase()
          const gatewayPaymentId = payment.gateway_payment_id?.toLowerCase() || ''

          return playerName.includes(searchLower) ||
                 programName.includes(searchLower) ||
                 transactionId.includes(searchLower) ||
                 gatewayPaymentId.includes(searchLower)
        })
      }

      // Apply date range filtering
      if (filters.date_from || filters.date_to) {
        paymentsData = paymentsData.filter((payment: Payment) => {
          const paymentDate = new Date(payment.created_at)
          const fromDate = filters.date_from ? new Date(filters.date_from) : null
          const toDate = filters.date_to ? new Date(filters.date_to + 'T23:59:59') : null

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

        switch (sortField) {
          case 'amount':
            aValue = a.amount
            bValue = b.amount
            break
          case 'player_name':
            aValue = `${a.program_registrations?.users?.first_name || a.program_registrations?.players?.first_name || ''} ${a.program_registrations?.users?.last_name || a.program_registrations?.players?.last_name || ''}`
            bValue = `${b.program_registrations?.users?.first_name || b.program_registrations?.players?.first_name || ''} ${b.program_registrations?.users?.last_name || b.program_registrations?.players?.last_name || ''}`
            break
          case 'program_name':
            aValue = a.program_registrations?.programs?.name || ''
            bValue = b.program_registrations?.programs?.name || ''
            break
          case 'status':
            aValue = a.status
            bValue = b.status
            break
          case 'method':
            aValue = a.payment_method
            bValue = b.payment_method
            break
          case 'created_at':
          default:
            aValue = new Date(a.created_at).getTime()
            bValue = new Date(b.created_at).getTime()
            break
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })

      setPayments(paymentsData)
      setTotalCount(paymentsData.length)

      // Apply pagination
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      setFilteredPayments(paymentsData.slice(startIndex, endIndex))

      // Calculate comprehensive stats
      const stats: PaymentStats = {
        totalPayments: paymentsData.length,
        totalAmount: paymentsData.reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0),
        completedAmount: paymentsData.filter((p: Payment) => p.status === 'completed').reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0),
        pendingAmount: paymentsData.filter((p: Payment) => p.status === 'pending').reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0),
        failedAmount: paymentsData.filter((p: Payment) => p.status === 'failed').reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0),
        refundedAmount: paymentsData.filter((p: Payment) => p.status === 'refunded').reduce((sum: number, p: Payment) => sum + (p.refund_amount || p.amount || 0), 0),
        completedCount: paymentsData.filter((p: Payment) => p.status === 'completed').length,
        pendingCount: paymentsData.filter((p: Payment) => p.status === 'pending').length,
        failedCount: paymentsData.filter((p: Payment) => p.status === 'failed').length,
        refundedCount: paymentsData.filter((p: Payment) => p.status === 'refunded').length,
        avgPaymentAmount: paymentsData.length > 0 ? paymentsData.reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0) / paymentsData.length : 0,
        todaysRevenue: paymentsData.filter((p: Payment) => {
          const today = new Date().toDateString()
          const paymentDate = new Date(p.created_at).toDateString()
          return paymentDate === today && p.status === 'completed'
        }).reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0)
      }
      setStats(stats)

    } catch (err) {
      console.error('Failed to fetch payments:', err)
    }
  }, [filters, sortField, sortDirection, currentPage, pageSize, execute])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [filters, sortField, sortDirection])

  useEffect(() => {
    // Update filtered payments when page or page size changes
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    setFilteredPayments(payments.slice(startIndex, endIndex))
  }, [payments, currentPage, pageSize])

  const handleFilterChange = (key: keyof PaymentFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentMethodDisplay = (method: string) => {
    const methodMap: Record<string, string> = {
      'stripe': 'Credit Card',
      'cash': 'Cash',
      'check': 'Check',
      'bank_transfer': 'Bank Transfer'
    }
    return methodMap[method] || method.charAt(0).toUpperCase() + method.slice(1)
  }

  const exportPayments = () => {
    const csvData = payments.map(payment => ({
      'Transaction ID': payment.id,
      'Registration ID': payment.program_registration_id,
      'Player Name': `${payment.program_registrations?.users?.first_name || payment.program_registrations?.players?.first_name || ''} ${payment.program_registrations?.users?.last_name || payment.program_registrations?.players?.last_name || ''}`,
      'Program': payment.program_registrations?.programs?.name || '',
      'Amount': payment.amount,
      'Payment Method': getPaymentMethodDisplay(payment.payment_method),
      'Status': payment.status,
      'Date': formatDateTime(payment.created_at),
      'Gateway Payment ID': payment.gateway_payment_id || '',
      'Failure Reason': payment.failure_reason || '',
      'Refund Amount': payment.refund_amount || '',
      'Refund Reason': payment.refund_reason || ''
    }))

    const headers = Object.keys(csvData[0] || {})
    const csvString = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-payment-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

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
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="h-8 w-8 text-blue-600" />
                Payment Management Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Administrative control center for payment transactions</p>
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
                Export All
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Total Revenue</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                  </div>
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Total Payments</p>
                    <p className="text-xl font-bold text-gray-900">{stats.totalPayments}</p>
                  </div>
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Pending</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.pendingAmount)}</p>
                    <p className="text-xs text-gray-500">{stats.pendingCount} payments</p>
                  </div>
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Completed</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.completedAmount)}</p>
                    <p className="text-xs text-gray-500">{stats.completedCount} payments</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Failed</p>
                    <p className="text-xl font-bold text-gray-900">{stats.failedCount}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(stats.failedAmount)}</p>
                  </div>
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Today's Revenue</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.todaysRevenue)}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Advanced Filters */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search payments, players, programs..."
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
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  placeholder="Min Amount ($)"
                  value={filters.amount_min}
                  onChange={(e) => handleFilterChange('amount_min', e.target.value)}
                />

                <Input
                  type="number"
                  placeholder="Max Amount ($)"
                  value={filters.amount_max}
                  onChange={(e) => handleFilterChange('amount_max', e.target.value)}
                />
              </div>

              {Object.values(filters).some(value => value !== '') && (
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
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
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Payment Transactions</CardTitle>
                  <CardDescription>
                    Showing {filteredPayments.length} of {totalCount} payments
                    {filters.search || filters.status || filters.method || filters.registration_id || filters.date_from || filters.date_to || filters.amount_min || filters.amount_max
                      ? ' (filtered)' : ''}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 mt-4 lg:mt-0">
                  <span className="text-sm text-gray-600">Show:</span>
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map(size => (
                        <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-lg">Loading payment data...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12 text-red-600">
                  <AlertCircle className="h-8 w-8 mr-3" />
                  <span className="text-lg">{error}</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-4 px-3 font-semibold text-gray-700">
                          <button
                            className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                            onClick={() => handleSort('id')}
                          >
                            Transaction ID
                            {sortField === 'id' && (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-4 px-3 font-semibold text-gray-700">
                          <button
                            className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                            onClick={() => handleSort('player_name')}
                          >
                            Player
                            {sortField === 'player_name' && (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-4 px-3 font-semibold text-gray-700">
                          <button
                            className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                            onClick={() => handleSort('program_name')}
                          >
                            Program
                            {sortField === 'program_name' && (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-4 px-3 font-semibold text-gray-700">
                          <button
                            className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                            onClick={() => handleSort('amount')}
                          >
                            Amount
                            {sortField === 'amount' && (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-4 px-3 font-semibold text-gray-700">
                          <button
                            className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                            onClick={() => handleSort('method')}
                          >
                            Method
                            {sortField === 'method' && (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-4 px-3 font-semibold text-gray-700">
                          <button
                            className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                            onClick={() => handleSort('status')}
                          >
                            Status
                            {sortField === 'status' && (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-4 px-3 font-semibold text-gray-700">
                          <button
                            className="flex items-center gap-2 hover:text-gray-900 transition-colors"
                            onClick={() => handleSort('created_at')}
                          >
                            Date
                            {sortField === 'created_at' && (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            )}
                          </button>
                        </th>
                        <th className="text-center py-4 px-3 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filteredPayments.map((payment) => {
                          const statusInfo = statusConfig[payment.status]
                          const StatusIcon = statusInfo.icon
                          const playerName = `${payment.program_registrations?.users?.first_name || payment.program_registrations?.players?.first_name || ''} ${payment.program_registrations?.users?.last_name || payment.program_registrations?.players?.last_name || ''}`.trim()

                          return (
                            <motion.tr
                              key={payment.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="border-b hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-4 px-3">
                                <div className="font-mono text-sm text-gray-900">
                                  {payment.id.slice(0, 8)}...
                                </div>
                                <div className="text-xs text-gray-500">
                                  Reg: {payment.program_registration_id.slice(0, 8)}...
                                </div>
                              </td>
                              <td className="py-4 px-3">
                                <div>
                                  <p className="font-medium text-gray-900">{playerName}</p>
                                  <p className="text-sm text-gray-500">
                                    {payment.program_registrations?.users?.email || payment.program_registrations?.players?.email}
                                  </p>
                                </div>
                              </td>
                              <td className="py-4 px-3">
                                <div>
                                  <p className="font-medium text-gray-900">{payment.program_registrations?.programs?.name}</p>
                                  <p className="text-sm text-gray-500">{payment.program_registrations?.programs?.season}</p>
                                </div>
                              </td>
                              <td className="py-4 px-3">
                                <span className="font-bold text-gray-900">
                                  {formatCurrency(payment.amount)}
                                </span>
                                {payment.refund_amount && payment.refund_amount > 0 && (
                                  <div className="text-xs text-red-600">
                                    Refunded: {formatCurrency(payment.refund_amount)}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-3">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    {getPaymentMethodDisplay(payment.payment_method)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-3">
                                <Badge className={statusInfo.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-4 px-3 text-gray-900">
                                <div className="text-sm">
                                  {formatDate(payment.created_at)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(payment.created_at).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </td>
                              <td className="py-4 px-3 text-center">
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
                                    {payment.status === 'completed' && (
                                      <DropdownMenuItem>
                                        <ArrowUpDown className="h-4 w-4 mr-2" />
                                        Process Refund
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>

                  {filteredPayments.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">No payments found matching your criteria.</p>
                      <p className="text-sm">Try adjusting your filters or search terms.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Enhanced Payment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment Details
            </DialogTitle>
            <DialogDescription>
              Complete transaction and registration information
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              {/* Transaction Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Transaction #{selectedPayment.id.slice(0, 8)}...
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(selectedPayment.created_at)}
                    </p>
                  </div>
                  <div className="mt-2 lg:mt-0">
                    <Badge className={`${statusConfig[selectedPayment.status].color} text-base px-3 py-1`}>
                      {React.createElement(statusConfig[selectedPayment.status].icon, { className: "h-4 w-4 mr-1" })}
                      {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Information
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Amount:</span>
                      <span className="font-bold text-lg">{formatCurrency(selectedPayment.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Payment Method:</span>
                      <span>{getPaymentMethodDisplay(selectedPayment.payment_method)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Registration ID:</span>
                      <span className="font-mono">{selectedPayment.program_registration_id}</span>
                    </div>
                    {selectedPayment.gateway_payment_id && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Gateway Payment ID:</span>
                        <span className="font-mono text-xs">{selectedPayment.gateway_payment_id}</span>
                      </div>
                    )}
                    {selectedPayment.transaction_id && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Transaction ID:</span>
                        <span className="font-mono text-xs">{selectedPayment.transaction_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Player Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Player Information
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Name:</span>
                      <span>{`${selectedPayment.program_registrations?.users?.first_name || selectedPayment.program_registrations?.players?.first_name || ''} ${selectedPayment.program_registrations?.users?.last_name || selectedPayment.program_registrations?.players?.last_name || ''}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Email:</span>
                      <span>{selectedPayment.program_registrations?.users?.email || selectedPayment.program_registrations?.players?.email}</span>
                    </div>
                    {selectedPayment.program_registrations?.players?.phone && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Phone:</span>
                        <span>{selectedPayment.program_registrations.players.phone}</span>
                      </div>
                    )}
                    {selectedPayment.program_registrations?.users?.organization && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Organization:</span>
                        <span>{selectedPayment.program_registrations.users.organization}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Program Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Program & Registration Details
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Program:</span>
                    <span>{selectedPayment.program_registrations?.programs?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Season:</span>
                    <span>{selectedPayment.program_registrations?.programs?.season}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Registration Date:</span>
                    <span>{formatDate(selectedPayment.program_registrations?.registration_date || '')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Registration Status:</span>
                    <span className="capitalize">{selectedPayment.program_registrations?.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Program Fee:</span>
                    <span>{formatCurrency(selectedPayment.program_registrations?.programs?.base_fee || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Amount Paid:</span>
                    <span>{formatCurrency(selectedPayment.program_registrations?.amount_paid || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Failure/Refund Information */}
              {(selectedPayment.failure_reason || selectedPayment.refund_amount) && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Additional Information
                  </h4>
                  {selectedPayment.failure_reason && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <span className="font-medium text-red-700">Failure Reason:</span>
                      <p className="text-red-600 mt-1">{selectedPayment.failure_reason}</p>
                    </div>
                  )}
                  {selectedPayment.refund_amount && selectedPayment.refund_amount > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="font-medium text-blue-700">Refund Information:</span>
                      <div className="text-blue-600 mt-1">
                        <p>Amount: {formatCurrency(selectedPayment.refund_amount)}</p>
                        {selectedPayment.refund_reason && (
                          <p>Reason: {selectedPayment.refund_reason}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                {selectedPayment.status === 'completed' && (
                  <Button variant="outline">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Process Refund
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}