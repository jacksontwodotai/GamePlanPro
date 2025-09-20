import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Download, Home, Calendar, CreditCard, User, FileText, AlertCircle, Loader2, ExternalLink, Phone, Mail } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Link } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'

interface Program {
  id: string
  name: string
  base_fee: number
  season?: string
  start_date: string
  end_date: string
}

interface FormDataEntry {
  field_name: string
  field_value: string
  field_label: string
}

interface RegistrationDetails {
  id: string
  status: string
  total_amount_due: number
  balance_due: number
  amount_paid: number
  notes?: string
  created_at: string
  program: Program
  form_data: FormDataEntry[]
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

interface RegistrationConfirmationProps {
  flowState: FlowState
  onNext?: (data?: Record<string, unknown>) => void
  onBack?: () => void
  onUpdateFlowState?: (updates: Partial<FlowState>) => void
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
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
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
}

export default function RegistrationConfirmation({
  flowState,
  onNext,
  onBack,
  onUpdateFlowState
}: RegistrationConfirmationProps) {
  const { execute } = useApi()
  const [registrationDetails, setRegistrationDetails] = useState<RegistrationDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load final registration details
  const loadRegistrationDetails = useCallback(async () => {
    if (!flowState.registrationId) {
      setError('No registration ID available')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await execute(`/api/registration-flow/${flowState.registrationId}/status`)
      if (response) {
        setRegistrationDetails(response)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load registration details'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [flowState.registrationId, execute])

  // Load registration details when component mounts
  useEffect(() => {
    if (flowState.registrationId) {
      loadRegistrationDetails()
    }
  }, [flowState.registrationId, loadRegistrationDetails])

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
      day: 'numeric'
    })
  }

  const getPlayerName = (): string => {
    const formData = registrationDetails?.form_data || []
    const firstName = formData.find(f => f.field_name === 'first_name')?.field_value ||
                      flowState.formData?.first_name as string || ''
    const lastName = formData.find(f => f.field_name === 'last_name')?.field_value ||
                     flowState.formData?.last_name as string || ''
    return `${firstName} ${lastName}`.trim() || 'Player'
  }

  const getContactInfo = () => {
    const formData = registrationDetails?.form_data || []
    const email = formData.find(f => f.field_name === 'email')?.field_value ||
                  flowState.formData?.email as string
    const phone = formData.find(f => f.field_name === 'phone')?.field_value ||
                  flowState.formData?.phone as string
    return { email, phone }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading registration details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error || !registrationDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full max-w-2xl"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertCircle className="h-6 w-6 mr-2" />
                Registration Status Unknown
              </CardTitle>
              <CardDescription>
                We couldn't load your registration details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">What to do next:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Check your email for a confirmation message</li>
                  <li>• Contact support if you don't receive confirmation within 24 hours</li>
                  <li>• Have your registration ID ready when contacting support</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={loadRegistrationDetails} className="flex-1">
                  Retry Loading
                </Button>
                <Link to="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Determine if registration was successful
  const isSuccessful = registrationDetails.status === 'completed' ||
                      registrationDetails.status === 'confirmed' ||
                      (registrationDetails.balance_due <= 0 && registrationDetails.amount_paid > 0)

  const playerName = getPlayerName()
  const contactInfo = getContactInfo()
  const program = registrationDetails.program

  return (
    <div className={`min-h-screen ${isSuccessful ? 'bg-gradient-to-br from-green-50 to-blue-50' : 'bg-gradient-to-br from-yellow-50 to-orange-50'} flex items-center justify-center p-6`}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-4xl space-y-6"
      >
        {/* Success/Status Header */}
        <motion.div variants={itemVariants} className="text-center">
          <div className={`mx-auto w-20 h-20 ${isSuccessful ? 'bg-green-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center mb-4`}>
            {isSuccessful ? (
              <CheckCircle className="h-12 w-12 text-green-600" />
            ) : (
              <AlertCircle className="h-12 w-12 text-yellow-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSuccessful ? 'Registration Complete!' : 'Registration Submitted'}
          </h1>
          <p className="text-gray-600 text-lg">
            {isSuccessful
              ? `${playerName}'s registration for ${program.name} has been confirmed`
              : `${playerName}'s registration for ${program.name} is being processed`
            }
          </p>
        </motion.div>

        {/* Registration Summary Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Registration Summary
              </CardTitle>
              <CardDescription>
                Registration ID: {registrationDetails.id} • Submitted on {formatDate(registrationDetails.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Program Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Program</label>
                    <p className="text-lg font-semibold">{program.name}</p>
                    {program.season && (
                      <p className="text-sm text-gray-600">{program.season}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Program Dates</label>
                    <p className="text-sm">{formatDate(program.start_date)} - {formatDate(program.end_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Player Name</label>
                    <p className="text-lg font-semibold">{playerName}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Registration Status</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 ${isSuccessful ? 'bg-green-500' : 'bg-yellow-500'} rounded-full`}></div>
                      <span className={`font-medium ${isSuccessful ? 'text-green-600' : 'text-yellow-600'}`}>
                        {isSuccessful ? 'Confirmed' : 'Processing'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Fee</label>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(registrationDetails.total_amount_due)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Status</label>
                    <p className={`font-medium ${registrationDetails.balance_due <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {registrationDetails.balance_due <= 0
                        ? 'Paid in Full'
                        : `Balance Due: ${formatCurrency(registrationDetails.balance_due)}`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              {registrationDetails.amount_paid > 0 && (
                <>
                  <hr className="border-gray-200" />
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-900">Payment Received</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-green-700 font-medium">Amount Paid</label>
                        <p className="text-green-800 font-semibold">{formatCurrency(registrationDetails.amount_paid)}</p>
                      </div>
                      {registrationDetails.balance_due > 0 && (
                        <div>
                          <label className="text-green-700 font-medium">Remaining Balance</label>
                          <p className="text-green-800 font-semibold">{formatCurrency(registrationDetails.balance_due)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Form Data Summary */}
              {registrationDetails.form_data && registrationDetails.form_data.length > 0 && (
                <>
                  <hr className="border-gray-200" />
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Registration Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {registrationDetails.form_data.map((field, index) => (
                        <div key={index} className="space-y-1">
                          <label className="text-sm font-medium text-gray-600">{field.field_label}</label>
                          <p className="text-sm text-gray-900">{field.field_value || 'Not provided'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              {registrationDetails.notes && (
                <>
                  <hr className="border-gray-200" />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Additional Notes</h4>
                    <p className="text-sm text-blue-800">{registrationDetails.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Next Steps */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Immediate Steps</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>You will receive a confirmation email within 24 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Program details and schedule will be sent via email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Check your account dashboard for updates and announcements</span>
                    </li>
                    {registrationDetails.balance_due > 0 && (
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span>Outstanding balance must be paid before program start</span>
                      </li>
                    )}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Contact Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>support@gameplanpro.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>(555) 123-4567</span>
                    </div>
                    {contactInfo.email && (
                      <div className="text-xs text-gray-600">
                        All communication will be sent to: {contactInfo.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4" />
            Print Summary
          </Button>
          <Link to="/dashboard">
            <Button className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center text-sm text-gray-500">
          <p>Thank you for choosing GamePlan Pro!</p>
          <p className="mt-1">Questions? Contact our support team anytime.</p>
        </motion.div>
      </motion.div>
    </div>
  )
}