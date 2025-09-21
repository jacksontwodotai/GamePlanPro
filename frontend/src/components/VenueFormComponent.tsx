import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin,
  Building,
  Hash,
  Users,
  FileText,
  Check,
  X,
  AlertTriangle
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog'
import { useApi } from '../hooks/useApi'

interface Venue {
  id?: string
  name: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  capacity?: number
  description?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

interface VenueFormComponentProps {
  venue?: Venue | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: (venue: Venue) => void
  className?: string
}

interface FormData {
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  capacity: string
  description: string
  is_active: boolean
}

interface FormErrors {
  name?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  capacity?: string
  description?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.2
    }
  }
}

export default function VenueFormComponent({
  venue = null,
  isOpen,
  onClose,
  onSuccess,
  className = ''
}: VenueFormComponentProps) {
  const isEditMode = Boolean(venue?.id)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    capacity: '',
    description: '',
    is_active: true
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const { loading: submitting, error: submitError, execute: submitVenue } = useApi<Venue>()

  // Populate form data when venue prop changes
  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name || '',
        address: venue.address || '',
        city: venue.city || '',
        state: venue.state || '',
        zip_code: venue.zip_code || '',
        capacity: venue.capacity ? venue.capacity.toString() : '',
        description: venue.description || '',
        is_active: venue.is_active !== false
      })
    } else {
      resetForm()
    }
    setErrors({})
    setShowSuccessMessage(false)
  }, [venue, isOpen])

  const resetForm = () => {
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
    setErrors({})
    setShowSuccessMessage(false)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Venue name is required'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Venue name must be 100 characters or less'
    }

    // Validate address length
    if (formData.address && formData.address.length > 200) {
      newErrors.address = 'Address must be 200 characters or less'
    }

    // Validate city length
    if (formData.city && formData.city.length > 50) {
      newErrors.city = 'City must be 50 characters or less'
    }

    // Validate state length
    if (formData.state && formData.state.length > 50) {
      newErrors.state = 'State must be 50 characters or less'
    }

    // Validate zip code format
    if (formData.zip_code) {
      const zipPattern = /^\d{5}(-\d{4})?$/
      if (!zipPattern.test(formData.zip_code)) {
        newErrors.zip_code = 'Zip code must be in format 12345 or 12345-6789'
      }
    }

    // Validate capacity
    if (formData.capacity) {
      const capacity = parseInt(formData.capacity)
      if (isNaN(capacity) || capacity < 0 || capacity > 999999) {
        newErrors.capacity = 'Capacity must be a number between 0 and 999,999'
      }
    }

    // Validate description length
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const venueData = {
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        zip_code: formData.zip_code.trim() || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        description: formData.description.trim() || undefined,
        is_active: formData.is_active
      }

      let result
      if (isEditMode && venue?.id) {
        result = await submitVenue(`/api/venues/${venue.id}`, {
          method: 'PUT',
          body: JSON.stringify(venueData)
        })
      } else {
        result = await submitVenue('/api/venues', {
          method: 'POST',
          body: JSON.stringify(venueData)
        })
      }

      if (result) {
        setShowSuccessMessage(true)
        setTimeout(() => {
          setShowSuccessMessage(false)
          onSuccess?.(result)
          onClose()
        }, 1500)
      }
    } catch (error) {
      console.error('Submit venue error:', error)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      resetForm()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {isEditMode ? 'Edit Venue' : 'Create New Venue'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the venue information below.'
              : 'Fill out the form below to create a new venue.'
            }
          </DialogDescription>
        </DialogHeader>

        <motion.form
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Success Message */}
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert className="border-green-200 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Venue {isEditMode ? 'updated' : 'created'} successfully!
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Submit Error */}
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {submitError}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Basic Information */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Venue Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter venue name"
                    className={errors.name ? 'border-red-500' : ''}
                    maxLength={100}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter venue description"
                    className={`w-full px-3 py-2 border rounded-md resize-none h-20 ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.description && (
                      <p className="text-red-500 text-sm">{errors.description}</p>
                    )}
                    <p className="text-gray-500 text-sm ml-auto">
                      {formData.description.length}/1000
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Capacity
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange('capacity', e.target.value)}
                      placeholder="Enter venue capacity"
                      className={`pl-10 ${errors.capacity ? 'border-red-500' : ''}`}
                      min="0"
                      max="999999"
                    />
                  </div>
                  {errors.capacity && (
                    <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Location Information */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter street address"
                    className={errors.address ? 'border-red-500' : ''}
                    maxLength={200}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Enter city"
                      className={errors.city ? 'border-red-500' : ''}
                      maxLength={50}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <Input
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Enter state"
                      className={errors.state ? 'border-red-500' : ''}
                      maxLength={50}
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Zip Code</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={formData.zip_code}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      placeholder="12345 or 12345-6789"
                      className={`pl-10 ${errors.zip_code ? 'border-red-500' : ''}`}
                      maxLength={10}
                    />
                  </div>
                  {errors.zip_code && (
                    <p className="text-red-500 text-sm mt-1">{errors.zip_code}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Active venue (available for event scheduling)
                  </label>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="min-w-[100px]"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              isEditMode ? 'Update Venue' : 'Create Venue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}