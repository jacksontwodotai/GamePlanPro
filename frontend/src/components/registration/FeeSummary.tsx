import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { useApi } from '../../hooks/useApi'
import { DollarSign, Receipt, CreditCard, AlertCircle } from 'lucide-react'

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

interface FeeSummaryProps {
  flowState: FlowState
  onNext: (data?: Record<string, unknown>) => void
  onBack: () => void
  onUpdateFlowState: (updates: Partial<FlowState>) => void
}

export default function FeeSummary({ flowState, onNext, onBack, onUpdateFlowState }: FeeSummaryProps) {
  const { execute } = useApi()
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finalizing, setFinalizing] = useState(false)

  // Load registration status and fees
  const loadRegistrationStatus = useCallback(async () => {
    if (!flowState.registrationId) {
      setError('No registration ID available')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await execute(`/api/registration-flow/${flowState.registrationId}/status`)
      if (response) {
        setRegistrationStatus(response)
        // Update flow state with the latest fee calculation
        onUpdateFlowState({
          feeCalculation: response.financial_summary
        })
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load registration fees'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [flowState.registrationId, execute, onUpdateFlowState])

  // Load fees when component mounts or registration ID changes
  useEffect(() => {
    if (flowState.registrationId) {
      loadRegistrationStatus()
    }
  }, [flowState.registrationId, loadRegistrationStatus])

  // Handle proceed to payment
  const handleProceedToPayment = async () => {
    if (!flowState.registrationId) {
      setError('No registration ID available')
      return
    }

    setFinalizing(true)
    setError(null)

    try {
      const response = await execute(`/api/registration-flow/${flowState.registrationId}/finalize`, {
        method: 'POST'
      })

      if (response) {
        // Move to next step with finalization data
        onNext({
          feesConfirmed: true,
          finalizationResult: response,
          registrationFinalized: true
        })
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to finalize registration'
      setError(errorMessage)
    } finally {
      setFinalizing(false)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading fee summary...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!registrationStatus && !loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Unable to load fee information.</p>
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

  const financial = registrationStatus?.financial_summary
  const program = registrationStatus?.program || flowState.selectedProgram

  return (
    <div className="space-y-6">
      {/* Program Information */}
      {program && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              {program.name}
            </CardTitle>
            <CardDescription>
              {program.season && `${program.season} • `}Registration Fee Summary
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Fee Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Fee Breakdown
          </CardTitle>
          <CardDescription>Review all charges and fees before proceeding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Base Fee */}
          <div className="flex justify-between items-center py-2">
            <div>
              <p className="font-medium">Base Registration Fee</p>
              <p className="text-sm text-gray-600">Program registration cost</p>
            </div>
            <p className="font-medium">
              {formatCurrency(financial?.base_fee || program?.base_fee || registrationStatus?.total_amount_due || 0)}
            </p>
          </div>

          {/* Additional Fees */}
          {financial?.additional_fees && financial.additional_fees.length > 0 && (
            <>
              <hr className="my-4" />
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Additional Fees</h4>
                {financial.additional_fees.map((fee, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <div>
                      <p className="font-medium">{fee.name}</p>
                      {fee.description && (
                        <p className="text-sm text-gray-600">{fee.description}</p>
                      )}
                    </div>
                    <p className="font-medium">{formatCurrency(fee.amount)}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Discounts */}
          {financial?.discounts && financial.discounts.length > 0 && (
            <>
              <hr className="my-4" />
              <div className="space-y-3">
                <h4 className="font-medium text-green-700">Discounts Applied</h4>
                {financial.discounts.map((discount, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <div>
                      <p className="font-medium text-green-700">{discount.name}</p>
                      {discount.description && (
                        <p className="text-sm text-green-600">{discount.description}</p>
                      )}
                    </div>
                    <p className="font-medium text-green-700">-{formatCurrency(discount.amount)}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Subtotal and Tax */}
          {financial && (
            <>
              <hr className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Subtotal</p>
                  <p>{formatCurrency(financial.total_before_tax || financial.base_fee)}</p>
                </div>
                {financial.tax_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Tax</p>
                    <p>{formatCurrency(financial.tax_amount)}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Total Amount Due */}
          <hr className="my-4" />
          <div className="flex justify-between items-center py-3 bg-gray-50 px-4 rounded-lg">
            <div>
              <p className="font-semibold text-lg">Total Amount Due</p>
              {financial?.amount_paid > 0 && (
                <p className="text-sm text-gray-600">
                  Amount Paid: {formatCurrency(financial.amount_paid)}
                </p>
              )}
            </div>
            <p className="font-bold text-xl">
              {formatCurrency(registrationStatus?.balance_due || registrationStatus?.total_amount_due || 0)}
            </p>
          </div>

          {/* Payment Status */}
          {financial && financial.amount_paid > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="font-medium text-blue-900">Payment Status</p>
                  <p className="text-sm text-blue-700">
                    {financial.balance_due > 0
                      ? `Partial payment of ${formatCurrency(financial.amount_paid)} received. Remaining balance: ${formatCurrency(financial.balance_due)}`
                      : 'Payment completed in full'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {registrationStatus?.notes && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-2">Additional Notes</p>
              <p className="text-sm text-gray-700">{registrationStatus.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack} disabled={finalizing}>
              Back
            </Button>
            <Button
              onClick={handleProceedToPayment}
              disabled={finalizing || !registrationStatus}
              className="min-w-[160px]"
            >
              {finalizing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Finalizing...
                </div>
              ) : (
                'Proceed to Payment'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}