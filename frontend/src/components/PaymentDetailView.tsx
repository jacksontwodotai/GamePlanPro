import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CreditCard,
  User,
  Calendar,
  Building,
  Phone,
  Mail,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Download,
  Eye,
  ArrowUpDown,
  DollarSign,
  Hash,
  MapPin,
  Info,
  Users,
  Activity
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { useApi } from '../hooks/useApi'
import { toast } from 'sonner'

interface PaymentDetail {
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
    total_amount_due: number
    balance_due: number
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
      start_date: string
      end_date: string
      base_fee: number
      max_capacity: number
    }
    players: {
      id: string
      first_name: string
      last_name: string
      email: string
      phone: string
      date_of_birth: string
      emergency_contact_name: string
      emergency_contact_phone: string
    }
  }
}

interface PaymentDetailViewProps {
  paymentId?: string
  onNavigateBack?: () => void
}

const statusConfig = {
  completed: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    label: 'Completed',
    description: 'Payment processed successfully'
  },
  pending: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    label: 'Pending',
    description: 'Payment is being processed'
  },
  failed: {
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    label: 'Failed',
    description: 'Payment processing failed'
  },
  refunded: {
    color: 'bg-blue-100 text-blue-800',
    icon: ArrowUpDown,
    label: 'Refunded',
    description: 'Payment has been refunded'
  },
  cancelled: {
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle,
    label: 'Cancelled',
    description: 'Payment was cancelled'
  }
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  }
}

export default function PaymentDetailView({ paymentId: propPaymentId, onNavigateBack }: PaymentDetailViewProps) {
  const { paymentId: urlPaymentId } = useParams<{ paymentId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loading, error, execute } = useApi<PaymentDetail>()

  // Get payment ID from props, URL params, or search params
  const paymentId = propPaymentId || urlPaymentId || searchParams.get('payment_id')

  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchPaymentDetails = useCallback(async () => {
    if (!paymentId) {
      return
    }

    try {
      const response = await execute(`/api/payments/${paymentId}`)
      setPayment(response)
    } catch (err) {
      console.error('Error fetching payment details:', err)
    }
  }, [paymentId, execute])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchPaymentDetails()
    setIsRefreshing(false)
  }, [fetchPaymentDetails])

  const handleNavigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack()
    } else {
      navigate('/admin/payments')
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  useEffect(() => {
    fetchPaymentDetails()
  }, [fetchPaymentDetails])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPaymentMethodDisplay = (method: string): string => {
    const methodMap: Record<string, string> = {
      'stripe': 'Credit Card (Stripe)',
      'cash': 'Cash',
      'check': 'Check',
      'bank_transfer': 'Bank Transfer'
    }
    return methodMap[method] || method.charAt(0).toUpperCase() + method.slice(1)
  }

  const getTimeSinceCreation = (): string => {
    if (!payment) return ''
    const now = new Date()
    const created = new Date(payment.created_at)
    const diffMs = now.getTime() - created.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  if (!paymentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment ID Required</h3>
            <p className="text-gray-600 text-center mb-4">
              No payment ID provided. Please provide a valid payment ID.
            </p>
            <Button onClick={handleNavigateBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-8">
            <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Payment Details</h3>
            <p className="text-gray-600 text-center">
              Fetching comprehensive payment information...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Not Found</h3>
            <p className="text-gray-600 text-center mb-4">
              {error || 'The payment could not be found or you do not have permission to view it.'}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={handleNavigateBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = statusConfig[payment.status]
  const StatusIcon = statusInfo.icon

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleNavigateBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Payments
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Eye className="h-8 w-8 text-blue-600" />
                  Payment Details
                </h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive payment transaction information
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 lg:mt-0">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Payment Status Header */}
        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${statusInfo.color.replace('text-', 'bg-').replace('-800', '-100')}`}>
                    <StatusIcon className={`h-8 w-8 ${statusInfo.color.replace('bg-', 'text-').replace('-100', '-600')}`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Payment #{payment.id.slice(0, 8)}...
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      <span className="text-sm text-gray-600">{statusInfo.description}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 lg:mt-0 text-right">
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-sm text-gray-600">{getTimeSinceCreation()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Information */}
          <motion.div variants={itemVariants} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {payment.id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(payment.id, 'Payment ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Method</label>
                    <p className="font-medium text-gray-900 mt-1">
                      {getPaymentMethodDisplay(payment.payment_method)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge className={`${statusInfo.color} mt-1`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Transaction IDs */}
                <div className="space-y-3">
                  {payment.transaction_id && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded break-all">
                          {payment.transaction_id}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(payment.transaction_id!, 'Transaction ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {payment.gateway_payment_id && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Gateway Payment ID</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded break-all">
                          {payment.gateway_payment_id}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(payment.gateway_payment_id!, 'Gateway Payment ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Timeline */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Timeline
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <span className="font-medium">Payment Created</span>
                        <p className="text-gray-600">{formatDateTime(payment.created_at)}</p>
                      </div>
                    </div>
                    {payment.updated_at !== payment.created_at && (
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          payment.status === 'completed' ? 'bg-green-500' :
                          payment.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <span className="font-medium">Status Updated</span>
                          <p className="text-gray-600">{formatDateTime(payment.updated_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Refund Information */}
            {(payment.refund_amount && payment.refund_amount > 0) || payment.refund_reason ? (
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <ArrowUpDown className="h-5 w-5" />
                    Refund Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {payment.refund_amount && payment.refund_amount > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Refund Amount</label>
                      <p className="text-lg font-bold text-blue-700 mt-1">
                        {formatCurrency(payment.refund_amount)}
                      </p>
                    </div>
                  )}
                  {payment.refund_reason && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Refund Reason</label>
                      <p className="text-gray-900 mt-1">{payment.refund_reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Failure Information */}
            {payment.status === 'failed' && payment.failure_reason && (
              <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    Failure Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Failure Reason</label>
                    <p className="text-red-700 mt-1">{payment.failure_reason}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Registration & Player Information */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Registration Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Registration Information
                  </div>
                  <Link
                    to={`/admin/registrations/${payment.program_registrations.id}`}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Registration
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Registration ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {payment.program_registrations.id.slice(0, 8)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(payment.program_registrations.id, 'Registration ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Registration Status</label>
                    <p className="font-medium text-gray-900 mt-1 capitalize">
                      {payment.program_registrations.status}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Registration Date</label>
                    <p className="text-gray-900 mt-1">
                      {formatDate(payment.program_registrations.registration_date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount Paid</label>
                    <p className="font-bold text-gray-900 mt-1">
                      {formatCurrency(payment.program_registrations.amount_paid)}
                    </p>
                  </div>
                </div>

                {payment.program_registrations.notes && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Registration Notes</label>
                      <p className="text-gray-900 mt-1">{payment.program_registrations.notes}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Financial Summary */}
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4" />
                    Financial Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Program Fee:</span>
                      <span className="font-medium">{formatCurrency(payment.program_registrations.programs.base_fee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Due:</span>
                      <span className="font-medium">{formatCurrency(payment.program_registrations.total_amount_due)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-medium text-green-600">{formatCurrency(payment.program_registrations.amount_paid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Balance Due:</span>
                      <span className={`font-medium ${payment.program_registrations.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(payment.program_registrations.balance_due)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Program Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Program Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Program Name</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {payment.program_registrations.programs.name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Season</label>
                    <p className="text-gray-900 mt-1">{payment.program_registrations.programs.season}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Program Fee</label>
                    <p className="font-bold text-gray-900 mt-1">
                      {formatCurrency(payment.program_registrations.programs.base_fee)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date</label>
                    <p className="text-gray-900 mt-1">
                      {formatDate(payment.program_registrations.programs.start_date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Date</label>
                    <p className="text-gray-900 mt-1">
                      {formatDate(payment.program_registrations.programs.end_date)}
                    </p>
                  </div>
                </div>
                {payment.program_registrations.programs.description && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <p className="text-gray-900 mt-1">{payment.program_registrations.programs.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Player Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Player Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Player Name</label>
                    <p className="font-semibold text-gray-900 mt-1">
                      {`${payment.program_registrations.players?.first_name || payment.program_registrations.users?.first_name || ''} ${payment.program_registrations.players?.last_name || payment.program_registrations.users?.last_name || ''}`}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900 mt-1">
                      {payment.program_registrations.players?.email || payment.program_registrations.users?.email}
                    </p>
                  </div>
                  {payment.program_registrations.players?.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900 mt-1">{payment.program_registrations.players.phone}</p>
                    </div>
                  )}
                  {payment.program_registrations.players?.date_of_birth && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                      <p className="text-gray-900 mt-1">
                        {formatDate(payment.program_registrations.players.date_of_birth)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                {payment.program_registrations.players?.emergency_contact_name && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Emergency Contact</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Contact Name</label>
                          <p className="text-gray-900 mt-1">
                            {payment.program_registrations.players.emergency_contact_name}
                          </p>
                        </div>
                        {payment.program_registrations.players.emergency_contact_phone && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Contact Phone</label>
                            <p className="text-gray-900 mt-1">
                              {payment.program_registrations.players.emergency_contact_phone}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Organization */}
                {payment.program_registrations.users?.organization && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Organization</label>
                      <p className="text-gray-900 mt-1">{payment.program_registrations.users.organization}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}