import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  X,
  Users,
  Phone,
  Mail,
  Calendar,
  MapPin,
  AlertTriangle,
  Shield,
  User,
  Heart,
  CheckCircle,
  Lock,
  Unlock
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useApi } from '../hooks/useApi'

interface Player {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  organization: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relation?: string
  medical_alerts?: string
  address?: string
  created_at: string
}

interface PlayerFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  organization: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relation: string
  medical_alerts: string
  address: string
}

interface UserPermissions {
  canEditPlayer: boolean
  canEditMedicalInfo: boolean
  role: 'admin' | 'coach' | 'viewer'
  requiresSecondaryAuth: boolean
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
} as const

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
} as const

const PlayerProfileEdit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: player, loading: fetchLoading, error: fetchError, execute: fetchPlayer } = useApi<Player>()
  const { loading: updateLoading, error: updateError, execute: updatePlayer } = useApi()

  const [userPermissions] = useState<UserPermissions>({
    canEditPlayer: true,
    canEditMedicalInfo: true, // In real app, this would come from auth context
    role: 'admin',
    requiresSecondaryAuth: false
  })

  const [formData, setFormData] = useState<PlayerFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    organization: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    medical_alerts: '',
    address: ''
  })

  const [formErrors, setFormErrors] = useState<Partial<PlayerFormData>>({})
  const [showMedicalSection, setShowMedicalSection] = useState(false)
  const [medicalAuthConfirmed, setMedicalAuthConfirmed] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    if (id) {
      loadPlayerData(id)
    }
  }, [id])

  useEffect(() => {
    if (player) {
      populateForm(player)
    }
  }, [player])

  const loadPlayerData = async (playerId: string) => {
    try {
      await fetchPlayer(`/api/players/${playerId}`)
    } catch (err) {
      console.error('Failed to fetch player:', err)
    }
  }

  const populateForm = (playerData: Player) => {
    setFormData({
      first_name: playerData.first_name || '',
      last_name: playerData.last_name || '',
      email: playerData.email || '',
      phone: playerData.phone || '',
      date_of_birth: playerData.date_of_birth || '',
      organization: playerData.organization || '',
      emergency_contact_name: playerData.emergency_contact_name || '',
      emergency_contact_phone: playerData.emergency_contact_phone || '',
      emergency_contact_relation: playerData.emergency_contact_relation || '',
      medical_alerts: playerData.medical_alerts || '',
      address: playerData.address || ''
    })
    setHasUnsavedChanges(false)
  }

  const handleInputChange = (field: keyof PlayerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const errors: Partial<PlayerFormData> = {}

    // Required field validation
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required'
    }
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required'
    }
    if (!formData.organization.trim()) {
      errors.organization = 'Organization is required'
    }

    // Email format validation
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address'
      }
    }

    // Phone format validation
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[+]?[\d\s()-.]{10,}$/
      const digitCount = formData.phone.replace(/\D/g, '').length
      if (!phoneRegex.test(formData.phone) || digitCount < 10) {
        errors.phone = 'Please enter a valid phone number (minimum 10 digits)'
      }
    }

    // Emergency contact phone validation
    if (formData.emergency_contact_phone && formData.emergency_contact_phone.trim()) {
      const phoneRegex = /^[+]?[\d\s()-.]{10,}$/
      const digitCount = formData.emergency_contact_phone.replace(/\D/g, '').length
      if (!phoneRegex.test(formData.emergency_contact_phone) || digitCount < 10) {
        errors.emergency_contact_phone = 'Please enter a valid emergency contact phone number'
      }
    }

    // Date of birth validation
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()

      if (birthDate > today) {
        errors.date_of_birth = 'Date of birth cannot be in the future'
      } else if (age > 120) {
        errors.date_of_birth = 'Please enter a valid date of birth'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    if (!player?.id) {
      return
    }

    try {
      await updatePlayer(`/api/players/${player.id}`, {
        method: 'PUT',
        body: formData
      })

      setHasUnsavedChanges(false)
      setShowSuccessMessage(true)

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)

      // Refresh player data to show updated values
      await loadPlayerData(player.id.toString())
    } catch (err) {
      console.error('Failed to update player:', err)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setConfirmCancel(true)
    } else {
      navigateBack()
    }
  }

  const confirmCancelChanges = () => {
    setConfirmCancel(false)
    navigateBack()
  }

  const navigateBack = () => {
    if (player?.id) {
      navigate(`/players/view/${player.id}`)
    } else {
      navigate('/players/list')
    }
  }

  const handleMedicalAuthConfirm = () => {
    setMedicalAuthConfirmed(true)
    setShowMedicalSection(true)
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 100, -100, 0],
              y: [0, -100, 100, 0],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-r from-blue-200/20 to-blue-400/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full"
          />
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Loading Player Data</h3>
            <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch the player information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (fetchError || !player) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 100, -100, 0],
              y: [0, -100, 100, 0],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-r from-red-200/20 to-red-400/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card glass-card-hover p-8 text-center"
          >
            <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unable to Load Player</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {fetchError || 'Failed to load player data for editing.'}
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/players/list')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Player List
              </Button>
              {id && (
                <Button
                  onClick={() => loadPlayerData(id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try Again
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!userPermissions.canEditPlayer) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card glass-card-hover p-8 text-center"
          >
            <Lock className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You do not have permission to edit player profiles.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate(`/players/view/${player.id}`)}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              View Player Profile
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="min-h-screen relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, -100, 0],
            y: [0, -100, 100, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-r from-green-200/20 to-green-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 150, 0],
            y: [0, 150, -150, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-gradient-to-r from-blue-300/20 to-blue-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Success Message */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-4 border-green-500/20 bg-green-50/50 dark:bg-green-900/20"
            >
              <div className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Player profile updated successfully!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Update Error */}
        <AnimatePresence>
          {updateError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-4 border-red-500/20 bg-red-50/50 dark:bg-red-900/20"
            >
              <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Failed to update player: {updateError}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <motion.div
          variants={itemVariants}
          className="glass-card glass-card-hover p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Edit {player.first_name} {player.last_name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">Update player profile information</p>
                  {hasUnsavedChanges && (
                    <p className="text-sm text-orange-600 dark:text-orange-400">• Unsaved changes</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateLoading || !hasUnsavedChanges}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Personal Information Card */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card glass-card-hover glow-border">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name *
                    </label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="Enter first name"
                      className={`${
                        formErrors.first_name
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.first_name && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {formErrors.first_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name *
                    </label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Enter last name"
                      className={`${
                        formErrors.last_name
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.last_name && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {formErrors.last_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Organization *
                    </label>
                    <Input
                      value={formData.organization}
                      onChange={(e) => handleInputChange('organization', e.target.value)}
                      placeholder="Enter organization"
                      className={`${
                        formErrors.organization
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.organization && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {formErrors.organization}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className={`${
                        formErrors.date_of_birth
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    {formErrors.date_of_birth && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {formErrors.date_of_birth}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main St, City, State, ZIP"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Information Card */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card glass-card-hover glow-border">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Phone className="h-5 w-5 mr-2 text-green-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="player@example.com"
                    className={`${
                      formErrors.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className={`${
                      formErrors.phone
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {formErrors.phone}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Emergency Contact Card */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card glass-card-hover glow-border">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Heart className="h-5 w-5 mr-2 text-red-600" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Name
                  </label>
                  <Input
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    placeholder="Emergency contact name"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Phone
                  </label>
                  <Input
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    placeholder="Emergency contact phone"
                    className={`${
                      formErrors.emergency_contact_phone
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  {formErrors.emergency_contact_phone && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {formErrors.emergency_contact_phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Relationship
                  </label>
                  <Input
                    value={formData.emergency_contact_relation}
                    onChange={(e) => handleInputChange('emergency_contact_relation', e.target.value)}
                    placeholder="Parent, Guardian, etc."
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Medical Information Card - Enhanced Security */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card glass-card-hover glow-border border-orange-200/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-orange-600" />
                    Medical Information
                  </div>
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-orange-600 font-medium">SENSITIVE DATA</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!userPermissions.canEditMedicalInfo ? (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                    <div className="flex items-center text-red-700 dark:text-red-400">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      <div>
                        <p className="font-medium">Access Restricted</p>
                        <p className="text-sm">You do not have permission to edit medical information.</p>
                      </div>
                    </div>
                  </div>
                ) : !showMedicalSection ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-lg">
                      <div className="flex items-center text-orange-700 dark:text-orange-400 mb-3">
                        <Shield className="h-5 w-5 mr-2" />
                        <div>
                          <p className="font-medium">Secure Medical Information Access</p>
                          <p className="text-sm">This section contains sensitive medical data that requires confirmation to access.</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleMedicalAuthConfirm}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      Confirm Access to Medical Information
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-lg">
                      <div className="flex items-center text-orange-700 dark:text-orange-400 text-sm">
                        <Shield className="h-4 w-4 mr-2" />
                        <span>Editing confidential medical information - handle with care</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Medical Alerts & Conditions
                      </label>
                      <textarea
                        value={formData.medical_alerts}
                        onChange={(e) => handleInputChange('medical_alerts', e.target.value)}
                        rows={4}
                        placeholder="Enter any medical conditions, allergies, or important notes..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 resize-none"
                      />
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                      <Shield className="h-3 w-3 inline mr-1" />
                      All medical information is confidential and protected. Changes are logged for audit purposes.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center space-x-4 pt-6"
        >
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={updateLoading}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Changes
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateLoading || !hasUnsavedChanges}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateLoading ? 'Saving Changes...' : 'Save Player Profile'}
          </Button>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmCancel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card glass-card-hover p-6 max-w-md w-full"
            >
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-orange-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Discard Changes?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You have unsaved changes. Are you sure you want to discard them and return to the previous page?
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmCancel(false)}
                    className="flex-1"
                  >
                    Keep Editing
                  </Button>
                  <Button
                    onClick={confirmCancelChanges}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Discard Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default PlayerProfileEdit