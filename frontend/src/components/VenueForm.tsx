import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Building2, MapPin, Users, FileText, AlertTriangle, ArrowLeft, Save, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

interface Venue {
  id?: string
  name: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  capacity?: number
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface VenueFormData {
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  capacity: string
  description: string
  is_active: boolean
}

interface VenueFormProps {
  mode: 'create' | 'edit'
  venue?: Venue
  onSubmit: (venueData: VenueFormData) => Promise<void>
  loading?: boolean
}

interface FormErrors {
  [key: string]: string
}

interface Notification {
  type: 'success' | 'error'
  message: string
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
} as const

export default function VenueForm({ mode, venue, onSubmit, loading = false }: VenueFormProps) {
  const navigate = useNavigate()

  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    capacity: '',
    description: '',
    is_active: true
  })

  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [notification, setNotification] = useState<Notification | null>(null)

  // Pre-populate form data when editing
  useEffect(() => {
    if (mode === 'edit' && venue) {
      setFormData({
        name: venue.name || '',
        address: venue.address || '',
        city: venue.city || '',
        state: venue.state || '',
        zip_code: venue.zip_code || '',
        capacity: venue.capacity ? venue.capacity.toString() : '',
        description: venue.description || '',
        is_active: venue.is_active
      })
    }
  }, [mode, venue])

  const handleInputChange = (field: keyof VenueFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    // Required field validations
    if (!formData.name.trim()) {
      errors.name = 'Venue name is required'
    } else if (formData.name.length > 255) {
      errors.name = 'Venue name must be 255 characters or less'
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required'
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required'
    }

    if (!formData.state.trim()) {
      errors.state = 'State is required'
    }

    if (!formData.zip_code.trim()) {
      errors.zip_code = 'ZIP code is required'
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip_code.trim())) {
      errors.zip_code = 'ZIP code must be in format 12345 or 12345-6789'
    }

    if (!formData.capacity.trim()) {
      errors.capacity = 'Capacity is required'
    } else {
      const capacity = parseInt(formData.capacity)
      if (isNaN(capacity) || capacity <= 0) {
        errors.capacity = 'Capacity must be a positive number'
      } else if (capacity > 1000000) {
        errors.capacity = 'Capacity seems unreasonably large'
      }
    }

    // Optional field validations
    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description must be 1000 characters or less'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      showNotification('error', 'Please correct the errors below')
      return
    }

    try {
      await onSubmit(formData)
      showNotification('success', `Venue ${mode === 'create' ? 'created' : 'updated'} successfully`)

      // Navigate back to venue list after successful submission
      setTimeout(() => {
        navigate('/dashboard/venues')
      }, 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to ${mode} venue`
      showNotification('error', message)
    }
  }

  const handleCancel = () => {
    navigate('/dashboard/venues')
  }

  const handleReset = () => {
    if (mode === 'create') {
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        capacity: '',
        description: '',
        is_active: true
      })
    } else if (venue) {
      setFormData({
        name: venue.name || '',
        address: venue.address || '',
        city: venue.city || '',
        state: venue.state || '',
        zip_code: venue.zip_code || '',
        capacity: venue.capacity ? venue.capacity.toString() : '',
        description: venue.description || '',
        is_active: venue.is_active
      })
    }
    setFormErrors({})
    showNotification('success', 'Form reset successfully')
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const formatTitle = () => {
    return mode === 'create' ? 'Create New Venue' : `Edit ${venue?.name || 'Venue'}`
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-zinc-600 text-gray-300 hover:bg-zinc-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Venues
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-orange-500" />
              <span>{formatTitle()}</span>
            </h1>
            <p className="text-gray-400 mt-2">
              {mode === 'create'
                ? 'Add a new venue to your venue management system'
                : 'Update venue information and settings'
              }
            </p>
          </div>
        </div>
      </motion.div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <motion.div variants={itemVariants} className="bg-zinc-800 rounded-lg p-8 border border-zinc-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-orange-500" />
              <span>Basic Information</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Venue Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Venue Name <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter venue name"
                  className="bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
                {formErrors.name && (
                  <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{formErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Capacity <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    placeholder="Enter capacity"
                    className="pl-10 bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                    disabled={loading}
                    min="1"
                  />
                </div>
                {formErrors.capacity && (
                  <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{formErrors.capacity}</span>
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant={formData.is_active ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInputChange('is_active', true)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    variant={!formData.is_active ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInputChange('is_active', false)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Inactive
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-orange-500" />
              <span>Address Information</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Street Address <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter street address"
                  className="bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
                {formErrors.address && (
                  <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{formErrors.address}</span>
                  </p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                  className="bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
                {formErrors.city && (
                  <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{formErrors.city}</span>
                  </p>
                )}
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Enter state"
                  className="bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
                {formErrors.state && (
                  <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{formErrors.state}</span>
                  </p>
                )}
              </div>

              {/* ZIP Code */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ZIP Code <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.zip_code}
                  onChange={(e) => handleInputChange('zip_code', e.target.value)}
                  placeholder="12345 or 12345-6789"
                  className="bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                  disabled={loading}
                />
                {formErrors.zip_code && (
                  <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{formErrors.zip_code}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-orange-500" />
              <span>Additional Information</span>
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
                <span className="text-gray-500 text-xs ml-2">(Optional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter venue description, amenities, or special notes..."
                rows={4}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                disabled={loading}
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-1">
                {formErrors.description ? (
                  <p className="text-red-400 text-sm flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{formErrors.description}</span>
                  </p>
                ) : (
                  <span></span>
                )}
                <span className="text-gray-500 text-xs">
                  {formData.description.length}/1000 characters
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-700">
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="border-zinc-600 text-gray-300 hover:bg-zinc-700"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={loading}
                className="border-zinc-600 text-gray-300 hover:bg-zinc-700"
              >
                Reset Form
              </Button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{mode === 'create' ? 'Creating...' : 'Updating...'}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{mode === 'create' ? 'Create Venue' : 'Update Venue'}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}