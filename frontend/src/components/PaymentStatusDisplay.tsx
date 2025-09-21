import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  CreditCard,
  Loader2,
  RefreshCw,
  Home,
  Download,
  Calendar
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useApi } from '../hooks/useApi'

interface PaymentStatusDisplayProps {
  paymentId?: string
  registrationId?: string
  onDownloadReceipt?: () => void
  onNavigateHome?: () => void
  className?: string
  showFullDetails?: boolean
}

interface PaymentData {
  id: string
  registration_id: string
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
  method: string
  transaction_id?: string
  gateway_payment_id?: string
  created_at: string
  updated_at: string
  failure_reason?: string
  refund_amount?: number
  refund_reason?: string
}

interface RegistrationData {
  id: string
  player_id: string
  program_id: string
  status: string
  total_amount_due: number
  balance_due: number
  program: {
    id: string
    name: string
    base_fee: number
  }
  form_data?: Record<string, any>
  financial_summary?: {
    total_amount_due: number
    amount_paid: number
    balance_due: number
  }
  payments?: PaymentData[]
}

type PaymentStatus = 'loading' | 'success' | 'pending' | 'failed' | 'error' | 'not_found'

const statusConfig = {
  loading: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'Loading...',
    message: 'Fetching payment information'
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    title: 'Payment Successful',
    message: 'Your payment has been processed successfully'
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: 'Payment Pending',
    message: 'Your payment is being processed'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Payment Failed',
    message: 'There was an issue processing your payment'
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Error',
    message: 'Unable to retrieve payment information'
  },
  not_found: {
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    title: 'Payment Not Found',
    message: 'The requested payment could not be found'
  }
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
}

export default function PaymentStatusDisplay({
  paymentId: propPaymentId,
  registrationId: propRegistrationId,
  onDownloadReceipt,
  onNavigateHome,
  className = '',
  showFullDetails = true
}: PaymentStatusDisplayProps) {
  const [searchParams] = useSearchParams()
  const { execute } = useApi()

  // Get IDs from props or URL params
  const paymentId = propPaymentId || searchParams.get('payment_id') || undefined
  const registrationId = propRegistrationId || searchParams.get('registration_id') || undefined

  const [status, setStatus] = useState<PaymentStatus>('loading')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchPaymentData = useCallback(async () => {
    if (!paymentId && !registrationId) {
      setStatus('error')
      setError('No payment ID or registration ID provided')
      return
    }

    setStatus('loading')
    setError(null)

    try {
      if (paymentId) {
        // Fetch payment data directly
        const response = await execute(`/api/payments/${paymentId}`)
        if (response) {
          setPaymentData(response)

          // Map payment status to display status
          switch (response.status) {
            case 'completed':
              setStatus('success')
              break
            case 'pending':
              setStatus('pending')
              break
            case 'failed':
            case 'cancelled':
              setStatus('failed')
              break
            default:
              setStatus('pending')
          }
        } else {
          setStatus('not_found')
        }
      } else if (registrationId) {
        // Fetch registration data with payment info
        const response = await execute(`/api/registration-flow/${registrationId}/status`)
        if (response) {
          setRegistrationData(response)

          // Get the most recent payment or determine status
          if (response.payments && response.payments.length > 0) {
            const latestPayment = response.payments[response.payments.length - 1]
            setPaymentData(latestPayment)

            switch (latestPayment.status) {
              case 'completed':
                setStatus('success')
                break
              case 'pending':
                setStatus('pending')
                break
              case 'failed':
              case 'cancelled':
                setStatus('failed')
                break
              default:
                setStatus('pending')
            }
          } else {
            // No payments found, but registration exists
            setStatus(response.balance_due > 0 ? 'pending' : 'success')
          }
        } else {
          setStatus('not_found')
        }
      }
    } catch (err: any) {
      console.error('Error fetching payment data:', err)
      setError(err.message || 'Failed to fetch payment information')
      setStatus('error')
    }
  }, [paymentId, registrationId, execute])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchPaymentData()
    setIsRefreshing(false)
  }, [fetchPaymentData])

  useEffect(() => {
    fetchPaymentData()
  }, [fetchPaymentData])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const config = statusConfig[status]
  const IconComponent = config.icon

  const playerName = registrationData?.form_data
    ? `${registrationData.form_data.first_name || ''} ${registrationData.form_data.last_name || ''}`.trim()
    : 'Player'

  const programName = registrationData?.program?.name || 'Program Registration'

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`w-full ${className}`}
    >
      <Card className={`${config.borderColor} border-2`}>
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mb-4`}>
            <IconComponent
              className={`h-8 w-8 ${config.color} ${status === 'loading' ? 'animate-spin' : ''}`}
            />
          </div>
          <CardTitle className={`text-xl ${config.color}`}>
            {config.title}
          </CardTitle>
          <CardDescription className="text-base">
            {error || config.message}
          </CardDescription>
        </CardHeader>

        {showFullDetails && (paymentData || registrationData) && (
          <CardContent className="space-y-6">
            {/* Payment/Registration Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Program Information */}
              {registrationData && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Program</label>
                  <p className="font-semibold">{programName}</p>
                </div>
              )}

              {/* Player Information */}
              {registrationData && playerName !== 'Player' && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Player</label>
                  <p className="font-semibold">{playerName}</p>
                </div>
              )}

              {/* Amount */}
              {paymentData && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Amount</label>
                  <p className={`text-lg font-bold ${config.color}`}>
                    {formatCurrency(paymentData.amount)}
                  </p>
                </div>
              )}

              {/* Payment Method */}
              {paymentData?.method && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Method</label>
                  <p className="font-medium capitalize">{paymentData.method.replace('_', ' ')}</p>
                </div>
              )}

              {/* Transaction Date */}
              {paymentData && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Transaction Date</label>
                  <p className="font-medium">{formatDate(paymentData.created_at)}</p>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    status === 'success' ? 'bg-green-500' :
                    status === 'pending' ? 'bg-yellow-500' :
                    status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <span className={`font-medium ${config.color}`}>
                    {status === 'success' ? 'Confirmed' :
                     status === 'pending' ? 'Processing' :
                     status === 'failed' ? 'Failed' : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction ID */}
            {paymentData?.transaction_id && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                <p className="text-sm font-mono break-all">{paymentData.transaction_id}</p>
              </div>
            )}

            {/* Gateway Payment ID */}
            {paymentData?.gateway_payment_id && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-600">Payment Reference</label>
                <p className="text-sm font-mono break-all">{paymentData.gateway_payment_id}</p>
              </div>
            )}

            {/* Failure Reason */}
            {status === 'failed' && paymentData?.failure_reason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <label className="text-sm font-medium text-red-700">Failure Reason</label>
                <p className="text-sm text-red-600">{paymentData.failure_reason}</p>
              </div>
            )}

            {/* Refund Information */}
            {paymentData?.refund_amount && paymentData.refund_amount > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <label className="text-sm font-medium text-yellow-700">Refund Information</label>
                <p className="text-sm text-yellow-600">
                  Refunded: {formatCurrency(paymentData.refund_amount)}
                  {paymentData.refund_reason && (
                    <span className="block">Reason: {paymentData.refund_reason}</span>
                  )}
                </p>
              </div>
            )}

            {/* Next Steps based on status */}
            {status === 'success' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  What's Next?
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You will receive a confirmation email shortly</li>
                  <li>• Program details and schedule will be sent via email</li>
                  <li>• Check your account dashboard for updates</li>
                  {registrationData && <li>• Contact support if you have any questions</li>}
                </ul>
              </div>
            )}

            {status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Payment Processing</h4>
                <p className="text-sm text-yellow-800">
                  Your payment is being processed. This may take a few minutes.
                  You will receive an email confirmation once the payment is complete.
                </p>
              </div>
            )}

            {status === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Payment Failed</h4>
                <p className="text-sm text-red-800">
                  Your payment could not be processed. Please try again or contact support for assistance.
                </p>
              </div>
            )}
          </CardContent>
        )}

        {/* Action Buttons */}
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing || status === 'loading'}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>

            {/* Download Receipt (only for successful payments) */}
            {status === 'success' && onDownloadReceipt && (
              <Button
                variant="outline"
                onClick={onDownloadReceipt}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Receipt
              </Button>
            )}

            {/* Navigate Home */}
            {onNavigateHome ? (
              <Button
                onClick={onNavigateHome}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                {status === 'success' ? 'Go to Dashboard' : 'Return Home'}
              </Button>
            ) : (
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                {status === 'success' ? 'Go to Dashboard' : 'Return Home'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}