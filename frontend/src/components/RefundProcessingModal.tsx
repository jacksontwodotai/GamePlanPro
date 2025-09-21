import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUpDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Receipt,
  FileText,
  AlertCircle,
  Info
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { useApi } from '../hooks/useApi'

interface Payment {
  id: string
  amount: number
  status: string
  payment_method: string
  created_at: string
  refund_amount?: number
  program_registrations?: {
    programs?: {
      name: string
    }
    players?: {
      first_name: string
      last_name: string
    }
    users?: {
      first_name: string
      last_name: string
    }
  }
}

interface RefundProcessingModalProps {
  isOpen: boolean
  onClose: () => void
  payment: Payment | null
  onRefundSuccess?: (refundResult: any) => void
}

interface RefundFormData {
  amount: string
  reason: string
  isFullRefund: boolean
}

interface RefundResult {
  success: boolean
  message: string
  request_id?: string
  refund_id?: string
  gateway_refund_id?: string
  refund_amount?: number
}

const MIN_REASON_LENGTH = 10
const MAX_REFUND_DECIMAL_PLACES = 2

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 }
  }
}

export default function RefundProcessingModal({
  isOpen,
  onClose,
  payment,
  onRefundSuccess
}: RefundProcessingModalProps) {
  const { loading, execute } = useApi()

  const [formData, setFormData] = useState<RefundFormData>({
    amount: '',
    reason: '',
    isFullRefund: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [refundResult, setRefundResult] = useState<RefundResult | null>(null)
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Track form changes for unsaved changes detection
  useEffect(() => {
    const hasChanges = formData.reason.trim() !== '' ||
                      (!formData.isFullRefund && formData.amount.trim() !== '')
    setHasUnsavedChanges(hasChanges && !refundResult)
  }, [formData, refundResult])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && payment) {
      setFormData({
        amount: '',
        reason: '',
        isFullRefund: true
      })
      setErrors({})
      setRefundResult(null)
      setHasUnsavedChanges(false)
    }
  }, [isOpen, payment])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate reason
    if (!formData.reason.trim()) {
      newErrors.reason = 'Refund reason is required'
    } else if (formData.reason.trim().length < MIN_REASON_LENGTH) {
      newErrors.reason = `Reason must be at least ${MIN_REASON_LENGTH} characters`
    } else if (formData.reason.trim().length > 500) {
      newErrors.reason = 'Reason must be less than 500 characters'
    }

    // Validate amount for partial refunds
    if (!formData.isFullRefund) {
      if (!formData.amount.trim()) {
        newErrors.amount = 'Refund amount is required for partial refunds'
      } else {
        const amount = parseFloat(formData.amount)

        if (isNaN(amount)) {
          newErrors.amount = 'Refund amount must be a valid number'
        } else if (amount <= 0) {
          newErrors.amount = 'Refund amount must be greater than zero'
        } else if (payment && amount > payment.amount) {
          newErrors.amount = `Refund amount cannot exceed original payment of ${formatCurrency(payment.amount)}`
        } else if (payment?.refund_amount && amount > (payment.amount - payment.refund_amount)) {
          const availableAmount = payment.amount - payment.refund_amount
          newErrors.amount = `Refund amount cannot exceed available amount of ${formatCurrency(availableAmount)}`
        } else {
          // Check decimal places
          const decimalPlaces = (formData.amount.split('.')[1] || '').length
          if (decimalPlaces > MAX_REFUND_DECIMAL_PLACES) {
            newErrors.amount = `Amount can have at most ${MAX_REFUND_DECIMAL_PLACES} decimal places`
          }
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!payment || !validateForm()) {
      return
    }

    setIsProcessing(true)
    setErrors({})

    try {
      const payload: { reason: string; amount?: number } = {
        reason: formData.reason.trim()
      }

      // Only include amount for partial refunds
      if (!formData.isFullRefund) {
        payload.amount = parseFloat(formData.amount)
      }

      const response = await execute(`/api/payments/${payment.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result: RefundResult = {
        success: true,
        message: response.message || 'Refund processed successfully',
        request_id: response.request_id,
        refund_id: response.refund_id,
        gateway_refund_id: response.gateway_refund_id,
        refund_amount: formData.isFullRefund ? payment.amount : parseFloat(formData.amount)
      }

      setRefundResult(result)
      setHasUnsavedChanges(false)

      if (onRefundSuccess) {
        onRefundSuccess({
          ...response,
          refund_amount: result.refund_amount
        })
      }

    } catch (error: any) {
      const result: RefundResult = {
        success: false,
        message: error.message || 'Failed to process refund'
      }
      setRefundResult(result)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (hasUnsavedChanges && !refundResult) {
      setShowCloseConfirmation(true)
    } else {
      onClose()
    }
  }

  const handleConfirmClose = () => {
    setShowCloseConfirmation(false)
    setHasUnsavedChanges(false)
    onClose()
  }

  const handleAmountTypeChange = (isFullRefund: boolean) => {
    setFormData(prev => ({
      ...prev,
      isFullRefund,
      amount: isFullRefund ? '' : prev.amount
    }))
    setErrors(prev => ({ ...prev, amount: '' }))
  }

  const getPlayerName = (): string => {
    if (!payment?.program_registrations) return 'Unknown Player'

    const reg = payment.program_registrations
    const firstName = reg.players?.first_name || reg.users?.first_name || ''
    const lastName = reg.players?.last_name || reg.users?.last_name || ''

    return `${firstName} ${lastName}`.trim() || 'Unknown Player'
  }

  const getProgramName = (): string => {
    return payment?.program_registrations?.programs?.name || 'Unknown Program'
  }

  const getAvailableRefundAmount = (): number => {
    if (!payment) return 0
    return payment.amount - (payment.refund_amount || 0)
  }

  if (!payment) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-blue-600" />
              Process Refund
            </DialogTitle>
            <DialogDescription>
              Process a full or partial refund for this payment transaction
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {refundResult ? (
              // Success/Error Result View
              <motion.div
                key="result"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <Card className={`border-l-4 ${refundResult.success ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${
                        refundResult.success
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {refundResult.success ? (
                          <CheckCircle className="h-8 w-8" />
                        ) : (
                          <XCircle className="h-8 w-8" />
                        )}
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${
                          refundResult.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {refundResult.success ? 'Refund Processed Successfully' : 'Refund Failed'}
                        </h3>
                        <p className="text-gray-600 mt-1">{refundResult.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {refundResult.success && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {refundResult.refund_amount && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Refund Amount</Label>
                          <p className="text-lg font-bold text-green-600 mt-1">
                            {formatCurrency(refundResult.refund_amount)}
                          </p>
                        </div>
                      )}
                      {refundResult.request_id && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Request ID</Label>
                          <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                            {refundResult.request_id}
                          </p>
                        </div>
                      )}
                    </div>

                    {(refundResult.refund_id || refundResult.gateway_refund_id) && (
                      <div className="space-y-2">
                        {refundResult.refund_id && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Refund ID</Label>
                            <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                              {refundResult.refund_id}
                            </p>
                          </div>
                        )}
                        {refundResult.gateway_refund_id && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Gateway Refund ID</Label>
                            <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                              {refundResult.gateway_refund_id}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">What happens next?</span>
                      </div>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• The refund has been initiated with the payment gateway</li>
                        <li>• Customer will typically see the refund in 3-5 business days</li>
                        <li>• Payment status will be updated to reflect the refund</li>
                        <li>• Customer will receive an email notification</li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button onClick={onClose}>
                    Close
                  </Button>
                </div>
              </motion.div>
            ) : (
              // Refund Form View
              <motion.div
                key="form"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                {/* Payment Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Receipt className="h-5 w-5" />
                      Payment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Player</Label>
                        <p className="font-medium text-gray-900 mt-1">{getPlayerName()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Program</Label>
                        <p className="font-medium text-gray-900 mt-1">{getProgramName()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Original Payment</Label>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          {formatCurrency(payment.amount)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Available for Refund</Label>
                        <p className="text-xl font-bold text-green-600 mt-1">
                          {formatCurrency(getAvailableRefundAmount())}
                        </p>
                      </div>
                    </div>

                    {payment.refund_amount && payment.refund_amount > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">
                            Previous refunds: {formatCurrency(payment.refund_amount)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Refund Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Refund Type Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <DollarSign className="h-5 w-5" />
                        Refund Amount
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="full-refund"
                            name="refundType"
                            checked={formData.isFullRefund}
                            onChange={() => handleAmountTypeChange(true)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <Label htmlFor="full-refund" className="flex items-center gap-2">
                            Full Refund
                            <Badge variant="secondary">
                              {formatCurrency(getAvailableRefundAmount())}
                            </Badge>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="partial-refund"
                            name="refundType"
                            checked={!formData.isFullRefund}
                            onChange={() => handleAmountTypeChange(false)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <Label htmlFor="partial-refund">Partial Refund</Label>
                        </div>

                        {!formData.isFullRefund && (
                          <div className="ml-6 space-y-2">
                            <Label htmlFor="refund-amount">Partial Refund Amount</Label>
                            <Input
                              id="refund-amount"
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={getAvailableRefundAmount()}
                              placeholder="0.00"
                              value={formData.amount}
                              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                              className={errors.amount ? 'border-red-300' : ''}
                            />
                            {errors.amount && (
                              <p className="text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.amount}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Maximum refundable amount: {formatCurrency(getAvailableRefundAmount())}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Refund Reason */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5" />
                        Refund Reason *
                      </CardTitle>
                      <CardDescription>
                        Provide a detailed reason for this refund (minimum {MIN_REASON_LENGTH} characters)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Enter the reason for this refund (e.g., customer request, billing error, service cancellation, etc.)"
                        value={formData.reason}
                        onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                        className={`min-h-24 ${errors.reason ? 'border-red-300' : ''}`}
                        maxLength={500}
                      />
                      <div className="flex justify-between items-center mt-2">
                        {errors.reason ? (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.reason}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500">
                            {formData.reason.length}/{MIN_REASON_LENGTH} minimum characters
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {formData.reason.length}/500
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Warning Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 mb-1">Important Notice</p>
                        <p className="text-amber-700">
                          This action will initiate a refund with the payment gateway.
                          This action cannot be undone. The customer will receive an email notification
                          and typically see the refund in 3-5 business days.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isProcessing}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing Refund...
                        </>
                      ) : (
                        <>
                          <ArrowUpDown className="h-4 w-4 mr-2" />
                          Process Refund
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <AlertDialog open={showCloseConfirmation} onOpenChange={setShowCloseConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Discard Changes?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in the refund form. Are you sure you want to close without processing the refund?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-red-600 hover:bg-red-700">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}