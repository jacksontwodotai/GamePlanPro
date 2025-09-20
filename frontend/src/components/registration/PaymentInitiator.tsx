import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { useApi } from '../../hooks/useApi'
import PaymentForm from '../PaymentForm'
import PaymentConfirmation from '../PaymentConfirmation'
import { CreditCard, AlertCircle, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'

interface Program {
  id: string
  name: string
  base_fee: number
  season?: string
}

interface RegistrationStatus {
  id: string
  status: string
  total_amount_due: number
  balance_due: number
  notes?: string
  program: Program
  financial_summary?: {
    base_fee: number
    additional_fees: Array<{
      name: string
      amount: number
      description?: string
    }>
    discounts: Array<{
      name: string
      amount: number
      description?: string
    }>
    total_before_tax: number
    tax_amount: number
    total_amount_due: number
    amount_paid: number
    balance_due: number
  }
}

interface FlowState {
  currentStep: number
  registrationId: string | null
  selectedProgram: Program | null
  formData: Record<string, unknown>
  feeCalculation: unknown
  paymentIntent: unknown
  completedSteps: Set<number>
}

interface PaymentInitiatorProps {
  flowState: FlowState
  onNext: (data?: Record<string, unknown>) => void
  onBack: () => void
  onUpdateFlowState: (updates: Partial<FlowState>) => void
}

type PaymentStage = 'loading' | 'ready' | 'processing' | 'success' | 'error'

export default function PaymentInitiator({ flowState, onNext, onBack, onUpdateFlowState }: PaymentInitiatorProps) {
  const { execute } = useApi()
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null)
  const [paymentStage, setPaymentStage] = useState<PaymentStage>('loading')
  const [error, setError] = useState<string | null>(null)
  const [paymentResult, setPaymentResult] = useState<any>(null)

  // Load registration status for payment
  const loadRegistrationStatus = useCallback(async () => {
    if (!flowState.registrationId) {
      setError('No registration ID available')
      setPaymentStage('error')
      return
    }

    setPaymentStage('loading')
    setError(null)

    try {
      const response = await execute(`/api/registration-flow/${flowState.registrationId}/status`)
      if (response) {
        setRegistrationStatus(response)

        // Check if payment is needed
        if (response.balance_due <= 0) {
          // No payment needed, proceed to confirmation
          setPaymentStage('success')
          setPaymentResult({
            paymentIntent: { id: 'no-payment-required', created: Date.now() / 1000 },
            payment: { amount: 0, status: 'no_payment_required' },
            message: 'Registration completed - no payment required'
          })
        } else {
          setPaymentStage('ready')
        }

        // Update flow state with the latest registration data
        onUpdateFlowState({
          feeCalculation: response.financial_summary,
          selectedProgram: response.program
        })
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load registration status'
      setError(errorMessage)
      setPaymentStage('error')
    }
  }, [flowState.registrationId, execute, onUpdateFlowState])

  // Load registration status when component mounts
  useEffect(() => {
    if (flowState.registrationId) {
      loadRegistrationStatus()
    }
  }, [flowState.registrationId, loadRegistrationStatus])

  // Handle payment success
  const handlePaymentSuccess = useCallback((result: any) => {
    setPaymentResult(result)
    setPaymentStage('success')
    setError(null)

    // Update flow state with payment completion
    onUpdateFlowState({
      paymentIntent: result.paymentIntent,
      completedSteps: new Set([...flowState.completedSteps, flowState.currentStep])
    })
  }, [onUpdateFlowState, flowState.completedSteps, flowState.currentStep])

  // Handle payment error
  const handlePaymentError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setPaymentStage('error')
  }, [])

  // Handle proceed to confirmation
  const handleProceedToConfirmation = useCallback(() => {
    onNext({
      paymentCompleted: true,
      paymentResult,
      registrationCompleted: true
    })
  }, [onNext, paymentResult])

  // Handle retry payment
  const handleRetryPayment = useCallback(() => {
    setError(null)
    setPaymentStage('ready')
  }, [])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Loading state
  if (paymentStage === 'loading') {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading payment information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (paymentStage === 'error') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Payment Error
            </CardTitle>
            <CardDescription>There was an issue processing your payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={loadRegistrationStatus}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state - show confirmation
  if (paymentStage === 'success' && paymentResult) {
    const program = registrationStatus?.program || flowState.selectedProgram
    const playerName = `${flowState.formData?.first_name || ''} ${flowState.formData?.last_name || ''}`.trim() || 'Player'
    const amount = registrationStatus?.balance_due || registrationStatus?.total_amount_due || 0

    return (
      <div className="space-y-6">
        {/* Success Header */}
        <Card>
          <CardContent className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {paymentResult.payment?.status === 'no_payment_required'
                ? 'Registration Complete!'
                : 'Payment Successful!'
              }
            </h2>
            <p className="text-gray-600">
              {program?.name && `Your registration for ${program.name} has been confirmed`}
            </p>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Registration Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Program</label>
                <p className="font-semibold">{program?.name || 'Unknown Program'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Player</label>
                <p className="font-semibold">{playerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Amount</label>
                <p className="text-lg font-bold text-green-600">
                  {amount > 0 ? formatCurrency(amount) : 'No Payment Required'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">Confirmed</span>
                </div>
              </div>
            </div>

            {paymentResult.paymentIntent && paymentResult.paymentIntent.id !== 'no-payment-required' && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                <p className="text-sm font-mono break-all">{paymentResult.paymentIntent.id}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You will receive a confirmation email shortly</li>
                <li>• Program details and schedule will be sent via email</li>
                <li>• Check your account dashboard for updates</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="py-6">
            <div className="flex justify-between">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleProceedToConfirmation}>
                Complete Registration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Ready for payment state
  if (paymentStage === 'ready' && registrationStatus) {
    const program = registrationStatus.program || flowState.selectedProgram
    const amount = registrationStatus.balance_due
    const playerName = `${flowState.formData?.first_name || ''} ${flowState.formData?.last_name || ''}`.trim() || 'Player'

    return (
      <div className="space-y-6">
        {/* Payment Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Complete Payment
            </CardTitle>
            <CardDescription>
              Secure payment for {program?.name} registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Amount Due</p>
                  <p className="text-sm text-gray-600">Registration fee for {playerName}</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(amount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <div className="flex justify-center">
          <PaymentForm
            amount={amount}
            programRegistrationId={flowState.registrationId!}
            programName={program?.name || 'Program Registration'}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>

        {/* Error Display */}
        {error && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <div>
                  <p className="font-medium">Payment Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRetryPayment}>
                  Try Again
                </Button>
                <Button variant="outline" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Fee Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <Card>
          <CardContent className="py-4">
            <div className="flex justify-start">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Fee Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fallback state
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Unable to initialize payment.</p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button onClick={loadRegistrationStatus}>
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}