import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle, Calendar, Users, DollarSign, Clock } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useApi } from '../hooks/useApi'

// Import step components (placeholders for now)
import ProgramSelection from './registration/ProgramSelection'
import CustomFormRenderer from './registration/CustomFormRenderer'
import FeeSummary from './registration/FeeSummary'
import PaymentInitiator from './registration/PaymentInitiator'
import RegistrationConfirmation from './registration/RegistrationConfirmation'

interface Program {
  id: string
  name: string
  description?: string
  season?: string
  start_date: string
  end_date: string
  registration_open_date: string
  registration_close_date: string
  max_capacity?: number
  base_fee: number
  is_active: boolean
}

interface PlayerFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  gender: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relation: string
  medical_alerts: string
  address: string
}

interface RegistrationData {
  player_id?: string
  program_id: string
  notes: string
}

// Registration flow steps
const REGISTRATION_STEPS = [
  { id: 'program-selection', title: 'Select Program', description: 'Choose from available programs', component: 'ProgramSelection' },
  { id: 'form-completion', title: 'Complete Form', description: 'Fill out registration details', component: 'CustomFormRenderer' },
  { id: 'fee-summary', title: 'Review Fees', description: 'Review and confirm fees', component: 'FeeSummary' },
  { id: 'payment', title: 'Payment', description: 'Complete your payment', component: 'PaymentInitiator' },
  { id: 'confirmation', title: 'Confirmation', description: 'Registration complete', component: 'RegistrationConfirmation' }
]

// Registration flow state interface
interface RegistrationFlowState {
  currentStep: number
  registrationId: string | null
  selectedProgram: Program | null
  formData: Record<string, any>
  feeCalculation: any
  paymentIntent: any
  completedSteps: Set<number>
}

// Step component props interface
interface StepComponentProps {
  flowState: RegistrationFlowState
  onNext: (data?: any) => void
  onBack: () => void
  onUpdateFlowState: (updates: Partial<RegistrationFlowState>) => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
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

export default function RegistrationFlow() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { execute } = useApi()

  // Initialize flow state
  const [flowState, setFlowState] = useState<RegistrationFlowState>(() => {
    const stepFromUrl = searchParams.get('step')
    const currentStep = stepFromUrl ?
      REGISTRATION_STEPS.findIndex(step => step.id === stepFromUrl) : 0

    return {
      currentStep: Math.max(0, currentStep),
      registrationId: searchParams.get('registration_id'),
      selectedProgram: null,
      formData: {},
      feeCalculation: null,
      paymentIntent: null,
      completedSteps: new Set()
    }
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync URL with current step
  useEffect(() => {
    const currentStepData = REGISTRATION_STEPS[flowState.currentStep]
    if (currentStepData) {
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.set('step', currentStepData.id)
      if (flowState.registrationId) {
        newSearchParams.set('registration_id', flowState.registrationId)
      }
      setSearchParams(newSearchParams, { replace: true })
    }
  }, [flowState.currentStep, flowState.registrationId, searchParams, setSearchParams])

  // Load registration data if registration_id is present
  useEffect(() => {
    if (flowState.registrationId && !flowState.selectedProgram) {
      loadRegistrationData()
    }
  }, [flowState.registrationId])

  // Load existing registration data
  const loadRegistrationData = useCallback(async () => {
    if (!flowState.registrationId) return

    setLoading(true)
    setError(null)

    try {
      const response = await execute(`/api/registration-flow/${flowState.registrationId}/status`)
      if (response) {
        updateFlowState({
          selectedProgram: response.program,
          formData: response.form_data || {},
          feeCalculation: response.financial_summary
        })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load registration data')
    } finally {
      setLoading(false)
    }
  }, [flowState.registrationId, execute])

  // Update flow state
  const updateFlowState = useCallback((updates: Partial<RegistrationFlowState>) => {
    setFlowState(prev => ({ ...prev, ...updates }))
  }, [])

  // Navigation functions
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < REGISTRATION_STEPS.length) {
      updateFlowState({ currentStep: stepIndex })
    }
  }, [updateFlowState])

  const goToNextStep = useCallback((data?: any) => {
    // Mark current step as completed
    const newCompletedSteps = new Set(flowState.completedSteps)
    newCompletedSteps.add(flowState.currentStep)

    // Update flow state with any data from the step
    if (data) {
      updateFlowState({
        ...data,
        completedSteps: newCompletedSteps
      })
    } else {
      updateFlowState({ completedSteps: newCompletedSteps })
    }

    // Move to next step
    if (flowState.currentStep < REGISTRATION_STEPS.length - 1) {
      goToStep(flowState.currentStep + 1)
    }
  }, [flowState.currentStep, flowState.completedSteps, updateFlowState, goToStep])

  const goToPreviousStep = useCallback(() => {
    if (flowState.currentStep > 0) {
      goToStep(flowState.currentStep - 1)
    }
  }, [flowState.currentStep, goToStep])

  // Step validation
  const canProceedToStep = useCallback((stepIndex: number) => {
    // Can always go back or to current step
    if (stepIndex <= flowState.currentStep) return true

    // Can only proceed if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!flowState.completedSteps.has(i)) return false
    }
    return true
  }, [flowState.currentStep, flowState.completedSteps])

  // Render current step component
  const renderCurrentStep = () => {
    const currentStepData = REGISTRATION_STEPS[flowState.currentStep]
    const stepProps = {
      flowState,
      onNext: goToNextStep,
      onBack: goToPreviousStep,
      onUpdateFlowState: updateFlowState
    }

    switch (currentStepData.component) {
      case 'ProgramSelection':
        return <ProgramSelection {...stepProps} />
      case 'CustomFormRenderer':
        return <CustomFormRenderer {...stepProps} />
      case 'FeeSummary':
        return <FeeSummary {...stepProps} />
      case 'PaymentInitiator':
        return <PaymentInitiator {...stepProps} />
      case 'RegistrationConfirmation':
        return <RegistrationConfirmation {...stepProps} />
      default:
        return <div>Unknown step component: {currentStepData.component}</div>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading registration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {REGISTRATION_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < REGISTRATION_STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index < flowState.currentStep
                      ? 'bg-green-600 border-green-600 text-white'
                      : index === flowState.currentStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  } ${canProceedToStep(index) ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onClick={() => canProceedToStep(index) && goToStep(index)}
                >
                  {flowState.completedSteps.has(index) ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="ml-3 min-w-0">
                  <p className={`text-sm font-medium ${
                    index <= flowState.currentStep ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                  <p className={`text-xs ${
                    index <= flowState.currentStep ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {step.description}
                  </p>
                </div>
                {index < REGISTRATION_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    index < flowState.currentStep ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Current step content */}
        <motion.div
          key={flowState.currentStep}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-4xl mx-auto"
        >
          <AnimatePresence mode="wait">
            <motion.div variants={itemVariants}>
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}