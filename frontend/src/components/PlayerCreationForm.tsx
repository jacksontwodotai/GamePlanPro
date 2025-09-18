import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Calendar, MapPin, AlertTriangle, UserPlus, Save } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface PlayerFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  gender: string
  organization: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relation: string
  medical_alerts: string
  address: string
}

interface ValidationErrors {
  [key: string]: string
}

interface PlayerCreationFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (player: any) => void
}

const initialFormData: PlayerFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  organization: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relation: '',
  medical_alerts: '',
  address: ''
}

const genderOptions = [
  { value: '', label: 'Select Gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
]

const relationshipOptions = [
  { value: '', label: 'Select Relationship' },
  { value: 'parent', label: 'Parent' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' }
]

export default function PlayerCreationForm({ isOpen, onClose, onSuccess }: PlayerCreationFormProps) {
  const [formData, setFormData] = useState<PlayerFormData>(initialFormData)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { execute, loading, error } = useApi()

  const validateEmail = (email: string): boolean => {
    if (!email) return true // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Phone is optional
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/
    return phoneRegex.test(phone)
  }

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}

    // Required fields
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required'
    }
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required'
    }
    if (!formData.organization.trim()) {
      errors.organization = 'Organization is required'
    }

    // Email validation
    if (formData.email && !validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    // Phone validation
    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number'
    }

    // Date of birth validation
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth)
      const today = new Date()
      if (birthDate > today) {
        errors.date_of_birth = 'Date of birth cannot be in the future'
      }
    }

    // Gender validation
    if (formData.gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(formData.gender)) {
      errors.gender = 'Please select a valid gender'
    }

    // Emergency contact phone validation
    if (formData.emergency_contact_phone && !validatePhone(formData.emergency_contact_phone)) {
      errors.emergency_contact_phone = 'Please enter a valid emergency contact phone number'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof PlayerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Filter out empty optional fields
      const submitData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value && value.trim()) {
          acc[key] = value.trim()
        }
        return acc
      }, {} as any)

      const newPlayer = await execute('/api/players', {
        method: 'POST',
        body: submitData
      })

      // Reset form
      setFormData(initialFormData)
      setValidationErrors({})

      // Call success callback
      if (onSuccess) {
        onSuccess(newPlayer)
      }

      // Close dialog
      onClose()
    } catch (err) {
      console.error('Failed to create player:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(initialFormData)
    setValidationErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card glass-card-hover max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg glow-border">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="gradient-text text-3xl font-bold">
            Create New Player
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Add a new player to the system with comprehensive profile information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Error creating player</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
            </motion.div>
          )}

          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground transition-colors ${
                    validationErrors.first_name
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-border focus:border-blue-500'
                  }`}
                  placeholder="Enter first name"
                />
                {validationErrors.first_name && (
                  <p className="text-sm text-red-500">{validationErrors.first_name}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground transition-colors ${
                    validationErrors.last_name
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-border focus:border-blue-500'
                  }`}
                  placeholder="Enter last name"
                />
                {validationErrors.last_name && (
                  <p className="text-sm text-red-500">{validationErrors.last_name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-background text-foreground transition-colors ${
                      validationErrors.email
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-border focus:border-blue-500'
                    }`}
                    placeholder="Enter email address"
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-sm text-red-500">{validationErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-background text-foreground transition-colors ${
                      validationErrors.phone
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-border focus:border-blue-500'
                    }`}
                    placeholder="Enter phone number"
                  />
                </div>
                {validationErrors.phone && (
                  <p className="text-sm text-red-500">{validationErrors.phone}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-background text-foreground transition-colors ${
                      validationErrors.date_of_birth
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-border focus:border-blue-500'
                    }`}
                  />
                </div>
                {validationErrors.date_of_birth && (
                  <p className="text-sm text-red-500">{validationErrors.date_of_birth}</p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground transition-colors ${
                    validationErrors.gender
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-border focus:border-blue-500'
                  }`}
                >
                  {genderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {validationErrors.gender && (
                  <p className="text-sm text-red-500">{validationErrors.gender}</p>
                )}
              </div>

              {/* Organization */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">
                  Organization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground transition-colors ${
                    validationErrors.organization
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-border focus:border-blue-500'
                  }`}
                  placeholder="Enter organization name"
                />
                {validationErrors.organization && (
                  <p className="text-sm text-red-500">{validationErrors.organization}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg bg-background text-foreground transition-colors border-border focus:border-blue-500 resize-none"
                    placeholder="Enter full address"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-6 pt-6 border-t border-border">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Emergency Contact
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Emergency Contact Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground transition-colors border-border focus:border-blue-500"
                  placeholder="Enter contact name"
                />
              </div>

              {/* Emergency Contact Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-background text-foreground transition-colors ${
                      validationErrors.emergency_contact_phone
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-border focus:border-blue-500'
                    }`}
                    placeholder="Enter contact phone"
                  />
                </div>
                {validationErrors.emergency_contact_phone && (
                  <p className="text-sm text-red-500">{validationErrors.emergency_contact_phone}</p>
                )}
              </div>

              {/* Emergency Contact Relationship */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Relationship
                </label>
                <select
                  value={formData.emergency_contact_relation}
                  onChange={(e) => handleInputChange('emergency_contact_relation', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground transition-colors border-border focus:border-blue-500"
                >
                  {relationshipOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-6 pt-6 border-t border-border">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Medical Information
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Medical Alerts & Notes
              </label>
              <textarea
                value={formData.medical_alerts}
                onChange={(e) => handleInputChange('medical_alerts', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground transition-colors border-border focus:border-blue-500 resize-none"
                placeholder="Enter any medical conditions, allergies, medications, or other important medical information..."
              />
              <p className="text-xs text-muted-foreground">
                Include any relevant medical conditions, allergies, medications, or special considerations
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading || isSubmitting}
              className="px-6"
            >
              Cancel
            </Button>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={loading || isSubmitting}
                className="px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
              >
                {loading || isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {loading || isSubmitting ? 'Creating Player...' : 'Create Player'}
              </Button>
            </motion.div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}