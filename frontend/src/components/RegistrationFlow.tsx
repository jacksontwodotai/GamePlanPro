import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle, Calendar, Users, DollarSign, Clock, Search, Filter } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useApi } from '../hooks/useApi'
import PaymentForm from './PaymentForm'
import PaymentConfirmation from './PaymentConfirmation'

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

const steps = [
  { id: 'programs', title: 'Select Program', description: 'Choose from available programs' },
  { id: 'player', title: 'Player Information', description: 'Enter player details' },
  { id: 'payment', title: 'Payment', description: 'Complete your payment' },
  { id: 'confirmation', title: 'Confirmation', description: 'Registration complete' }
]

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
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

export default function RegistrationFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [programs, setPrograms] = useState<Program[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([])
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSeason, setFilterSeason] = useState('')
  const [playerData, setPlayerData] = useState<PlayerFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    medical_alerts: '',
    address: ''
  })
  const [registrationNotes, setRegistrationNotes] = useState('')
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})
  const [registrationResult, setRegistrationResult] = useState<any>(null)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [paymentError, setPaymentError] = useState('')

  const { loading, error, execute } = useApi<any>()

  useEffect(() => {
    loadPrograms()
  }, [])

  useEffect(() => {
    filterPrograms()
  }, [programs, searchTerm, filterSeason])

  const loadPrograms = async () => {
    try {
      const response = await execute('/api/programs', {
        method: 'GET'
      })

      // Filter to only show active programs with open registration
      const availablePrograms = (response.programs || []).filter((program: Program) => {
        const now = new Date()
        const registrationOpen = new Date(program.registration_open_date)
        const registrationClose = new Date(program.registration_close_date)

        return program.is_active &&
               now >= registrationOpen &&
               now <= registrationClose
      })

      setPrograms(availablePrograms)
    } catch (err) {
      console.error('Failed to load programs:', err)
    }
  }

  const filterPrograms = () => {
    let filtered = programs

    if (searchTerm) {
      filtered = filtered.filter(program =>
        program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterSeason) {
      filtered = filtered.filter(program => program.season === filterSeason)
    }

    setFilteredPrograms(filtered)
  }

  const validatePlayerData = (): boolean => {
    const errors: { [key: string]: string } = {}

    if (!playerData.first_name.trim()) {
      errors.first_name = 'First name is required'
    }

    if (!playerData.last_name.trim()) {
      errors.last_name = 'Last name is required'
    }

    if (!playerData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(playerData.email)) {
      errors.email = 'Email is invalid'
    }

    if (!playerData.phone.trim()) {
      errors.phone = 'Phone number is required'
    }

    if (!playerData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required'
    }

    if (!playerData.gender) {
      errors.gender = 'Gender is required'
    }

    if (!playerData.emergency_contact_name.trim()) {
      errors.emergency_contact_name = 'Emergency contact name is required'
    }

    if (!playerData.emergency_contact_phone.trim()) {
      errors.emergency_contact_phone = 'Emergency contact phone is required'
    }

    if (!playerData.emergency_contact_relation.trim()) {
      errors.emergency_contact_relation = 'Emergency contact relation is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(program)
    setCurrentStep(1)
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validatePlayerData()) {
        return
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  }

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleSubmitRegistration = async () => {
    if (!selectedProgram || !validatePlayerData()) {
      return
    }

    try {
      // First create/find the player
      const playerResponse = await execute('/api/players', {
        method: 'POST',
        body: {
          ...playerData,
          organization: 'Public Registration' // Default for public registrations
        }
      })

      const playerId = playerResponse.player?.id

      if (!playerId) {
        throw new Error('Failed to create player profile')
      }

      // Then create the registration
      const registrationResponse = await execute('/api/registrations', {
        method: 'POST',
        body: {
          player_id: playerId,
          program_id: selectedProgram.id,
          notes: registrationNotes || null
        }
      })

      setRegistrationResult(registrationResponse)
      setCurrentStep(2) // Move to payment step
    } catch (err) {
      console.error('Registration failed:', err)
    }
  }

  const handlePaymentSuccess = (result: any) => {
    setPaymentResult(result)
    setCurrentStep(3) // Move to confirmation step
  }

  const handlePaymentError = (error: string) => {
    setPaymentError(error)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getUniqueSeasons = () => {
    return Array.from(new Set(programs.map(p => p.season).filter(Boolean)))
  }

  const isRegistrationOpen = (program: Program) => {
    const now = new Date()
    const registrationClose = new Date(program.registration_close_date)
    return now <= registrationClose
  }

  const getCapacityStatus = (program: Program) => {
    // For now, we'll assume capacity is available since we don't have registration count data
    // In a real implementation, this would check current registration count vs max_capacity
    if (!program.max_capacity) return 'Available'
    return 'Available' // This would be calculated from actual registration data
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Program Registration</h1>
          <p className="text-gray-600 mt-2">Join our sports programs and start your journey</p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="flex items-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="ml-3 text-left">
                  <p className={`text-sm font-medium ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
          >
            {error}
          </motion.div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Program Selection */}
            {currentStep === 0 && (
              <div className="space-y-6">
                {/* Search and Filter */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search programs..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-64"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <Select value={filterSeason} onValueChange={setFilterSeason}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by season" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Seasons</SelectItem>
                            {getUniqueSeasons().map((season) => (
                              <SelectItem key={season} value={season || ''}>
                                {season}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {(searchTerm || filterSeason) && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchTerm('')
                            setFilterSeason('')
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Programs List */}
                <div className="grid gap-4">
                  {loading ? (
                    <div className="text-center py-8">Loading programs...</div>
                  ) : filteredPrograms.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <p className="text-gray-500">No programs available for registration</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredPrograms.map((program) => (
                      <motion.div
                        key={program.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                        className="cursor-pointer"
                        onClick={() => handleProgramSelect(program)}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  {program.name}
                                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                    {getCapacityStatus(program)}
                                  </span>
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {program.description || 'No description provided'}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <div>
                                  <p className="font-medium">{program.season}</p>
                                  <p className="text-gray-500">Season</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-green-500" />
                                <div>
                                  <p className="font-medium">{formatDate(program.start_date)} - {formatDate(program.end_date)}</p>
                                  <p className="text-gray-500">Program Dates</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-purple-500" />
                                <div>
                                  <p className="font-medium">{program.max_capacity || 'Unlimited'}</p>
                                  <p className="text-gray-500">Capacity</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <div>
                                  <p className="font-medium">{formatCurrency(program.base_fee)}</p>
                                  <p className="text-gray-500">Registration Fee</p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Registration Deadline</p>
                                  <p className="text-sm text-gray-500">{formatDate(program.registration_close_date)}</p>
                                </div>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleProgramSelect(program)
                                  }}
                                  disabled={!isRegistrationOpen(program)}
                                >
                                  {isRegistrationOpen(program) ? 'Select Program' : 'Registration Closed'}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Player Information */}
            {currentStep === 1 && selectedProgram && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Selected Program</CardTitle>
                    <CardDescription>
                      {selectedProgram.name} - {selectedProgram.season}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span>Registration Fee: {formatCurrency(selectedProgram.base_fee)}</span>
                      <Button variant="outline" onClick={() => setCurrentStep(0)}>
                        Change Program
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Player Information</CardTitle>
                    <CardDescription>
                      Please provide the player's details for registration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">First Name *</label>
                        <Input
                          value={playerData.first_name}
                          onChange={(e) => setPlayerData({ ...playerData, first_name: e.target.value })}
                          className={validationErrors.first_name ? 'border-red-500' : ''}
                        />
                        {validationErrors.first_name && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.first_name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Last Name *</label>
                        <Input
                          value={playerData.last_name}
                          onChange={(e) => setPlayerData({ ...playerData, last_name: e.target.value })}
                          className={validationErrors.last_name ? 'border-red-500' : ''}
                        />
                        {validationErrors.last_name && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.last_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Email *</label>
                        <Input
                          type="email"
                          value={playerData.email}
                          onChange={(e) => setPlayerData({ ...playerData, email: e.target.value })}
                          className={validationErrors.email ? 'border-red-500' : ''}
                        />
                        {validationErrors.email && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone *</label>
                        <Input
                          type="tel"
                          value={playerData.phone}
                          onChange={(e) => setPlayerData({ ...playerData, phone: e.target.value })}
                          className={validationErrors.phone ? 'border-red-500' : ''}
                        />
                        {validationErrors.phone && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                        <Input
                          type="date"
                          value={playerData.date_of_birth}
                          onChange={(e) => setPlayerData({ ...playerData, date_of_birth: e.target.value })}
                          className={validationErrors.date_of_birth ? 'border-red-500' : ''}
                        />
                        {validationErrors.date_of_birth && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.date_of_birth}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Gender *</label>
                        <Select
                          value={playerData.gender}
                          onValueChange={(value) => setPlayerData({ ...playerData, gender: value })}
                        >
                          <SelectTrigger className={validationErrors.gender ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        {validationErrors.gender && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.gender}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <textarea
                        value={playerData.address}
                        onChange={(e) => setPlayerData({ ...playerData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={2}
                        placeholder="Player's address"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Emergency Contact Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Emergency Contact Name *</label>
                          <Input
                            value={playerData.emergency_contact_name}
                            onChange={(e) => setPlayerData({ ...playerData, emergency_contact_name: e.target.value })}
                            className={validationErrors.emergency_contact_name ? 'border-red-500' : ''}
                          />
                          {validationErrors.emergency_contact_name && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.emergency_contact_name}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Emergency Contact Phone *</label>
                          <Input
                            type="tel"
                            value={playerData.emergency_contact_phone}
                            onChange={(e) => setPlayerData({ ...playerData, emergency_contact_phone: e.target.value })}
                            className={validationErrors.emergency_contact_phone ? 'border-red-500' : ''}
                          />
                          {validationErrors.emergency_contact_phone && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.emergency_contact_phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">Relationship to Player *</label>
                        <Input
                          value={playerData.emergency_contact_relation}
                          onChange={(e) => setPlayerData({ ...playerData, emergency_contact_relation: e.target.value })}
                          className={validationErrors.emergency_contact_relation ? 'border-red-500' : ''}
                          placeholder="e.g., Parent, Guardian, Spouse"
                        />
                        {validationErrors.emergency_contact_relation && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.emergency_contact_relation}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Medical Alerts / Special Needs</label>
                      <textarea
                        value={playerData.medical_alerts}
                        onChange={(e) => setPlayerData({ ...playerData, medical_alerts: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="Any medical conditions, allergies, or special requirements"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Registration Notes (Optional)</label>
                      <textarea
                        value={registrationNotes}
                        onChange={(e) => setRegistrationNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={2}
                        placeholder="Any additional notes or comments"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Programs
                  </Button>
                  <Button onClick={handleSubmitRegistration} disabled={loading}>
                    {loading ? 'Processing...' : 'Complete Registration'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {/* Payment Step */}
            {currentStep === 2 && registrationResult && selectedProgram && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Payment</h2>
                  <p className="text-gray-600">
                    Complete your registration by paying for {selectedProgram.name}
                  </p>
                </div>

                {paymentError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                    {paymentError}
                  </div>
                )}

                <PaymentForm
                  amount={selectedProgram.base_fee}
                  programRegistrationId={registrationResult.registration.id}
                  programName={selectedProgram.name}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Player Information
                  </Button>
                </div>
              </div>
            )}

            {/* Confirmation Step */}
            {currentStep === 3 && paymentResult && selectedProgram && (
              <PaymentConfirmation
                paymentResult={paymentResult}
                programName={selectedProgram.name}
                playerName={`${playerData.first_name} ${playerData.last_name}`}
                amount={selectedProgram.base_fee}
                onDownloadReceipt={() => {
                  // TODO: Implement receipt download
                  console.log('Download receipt')
                }}
              />
            )}

            {/* Legacy confirmation for non-payment flow */}
            {currentStep === 3 && !paymentResult && registrationResult && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl text-green-800">Registration Successful!</CardTitle>
                    <CardDescription>
                      Your registration has been submitted and is pending confirmation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Registration Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Program:</span> {selectedProgram?.name}
                        </div>
                        <div>
                          <span className="font-medium">Season:</span> {selectedProgram?.season}
                        </div>
                        <div>
                          <span className="font-medium">Player:</span> {playerData.first_name} {playerData.last_name}
                        </div>
                        <div>
                          <span className="font-medium">Registration Fee:</span> {formatCurrency(selectedProgram?.base_fee || 0)}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Registration ID:</span> {registrationResult.registration?.id}
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 text-blue-800">Next Steps</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• You will receive a confirmation email shortly</li>
                        <li>• Payment instructions will be provided</li>
                        <li>• Registration will be confirmed upon payment</li>
                        <li>• Program details and schedules will be sent once confirmed</li>
                      </ul>
                    </div>

                    <div className="flex justify-center space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentStep(0)
                          setSelectedProgram(null)
                          setPlayerData({
                            first_name: '',
                            last_name: '',
                            email: '',
                            phone: '',
                            date_of_birth: '',
                            gender: '',
                            emergency_contact_name: '',
                            emergency_contact_phone: '',
                            emergency_contact_relation: '',
                            medical_alerts: '',
                            address: ''
                          })
                          setRegistrationNotes('')
                          setRegistrationResult(null)
                        }}
                      >
                        Register Another Player
                      </Button>
                      <Button onClick={() => window.location.href = '/'}>
                        Return to Home
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}