import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { useApi } from '../../hooks/useApi'

interface FormField {
  id: string
  field_name: string
  field_type: 'text' | 'number' | 'date' | 'email' | 'tel' | 'select' | 'radio' | 'checkbox' | 'textarea'
  label: string
  placeholder?: string
  is_required: boolean
  validation_regex?: string
  error_message?: string
  options?: Array<{ value: string; label: string }>
  sort_order: number
}

interface RegistrationForm {
  id: string
  name: string
  description?: string
  fields: FormField[]
}

interface FlowState {
  currentStep: number
  registrationId: string | null
  selectedProgram: {
    id: string
    name: string
  } | null
  formData: FormData
  feeCalculation: unknown
  paymentIntent: unknown
  completedSteps: Set<number>
}

interface CustomFormRendererProps {
  flowState: FlowState
  onNext: (data?: Record<string, unknown>) => void
  onBack: () => void
  onUpdateFlowState: (updates: Partial<FlowState>) => void
}

interface FormData {
  [key: string]: string | boolean | number
}

interface ValidationErrors {
  [key: string]: string
}

export default function CustomFormRenderer({ flowState, onNext, onBack, onUpdateFlowState }: CustomFormRendererProps) {
  const { execute } = useApi()
  const [registrationForm, setRegistrationForm] = useState<RegistrationForm | null>(null)
  const [formData, setFormData] = useState<FormData>({})
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load registration form when component mounts or program changes
  useEffect(() => {
    if (flowState.selectedProgram?.id) {
      loadRegistrationForm()
    }
  }, [flowState.selectedProgram?.id, loadRegistrationForm])

  // Initialize form data from flow state
  useEffect(() => {
    if (flowState.formData && Object.keys(flowState.formData).length > 0) {
      setFormData(flowState.formData)
    }
  }, [flowState.formData])

  const loadRegistrationForm = async () => {
    if (!flowState.selectedProgram?.id) return

    setLoading(true)
    try {
      const response = await execute(`/api/programs/${flowState.selectedProgram.id}/registration-form`)
      if (response) {
        setRegistrationForm(response)
        // Initialize form data with default values
        const initialData: FormData = {}
        response.fields.forEach((field: FormField) => {
          if (field.field_type === 'checkbox') {
            initialData[field.field_name] = false
          } else {
            initialData[field.field_name] = ''
          }
        })
        setFormData(prev => ({ ...initialData, ...prev }))
      }
    } catch (error) {
      console.error('Failed to load registration form:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateField = useCallback((field: FormField, value: string | boolean | number): string | null => {
    // Required field validation
    if (field.is_required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return field.error_message || `${field.label} is required`
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null
    }

    // Regex validation
    if (field.validation_regex && typeof value === 'string') {
      try {
        const regex = new RegExp(field.validation_regex)
        if (!regex.test(value)) {
          return field.error_message || `${field.label} format is invalid`
        }
      } catch {
        console.error('Invalid regex pattern:', field.validation_regex)
      }
    }

    // Type-specific validation
    switch (field.field_type) {
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value as string)) {
          return field.error_message || 'Please enter a valid email address'
        }
        break
      }

      case 'tel': {
        const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
        if (!phoneRegex.test(value as string)) {
          return field.error_message || 'Please enter a valid phone number'
        }
        break
      }

      case 'number': {
        if (isNaN(Number(value))) {
          return field.error_message || 'Please enter a valid number'
        }
        break
      }

      case 'date': {
        const dateValue = new Date(value as string)
        if (isNaN(dateValue.getTime())) {
          return field.error_message || 'Please enter a valid date'
        }
        break
      }
    }

    return null
  }, [])

  const handleFieldChange = useCallback((fieldName: string, value: string | boolean | number, field: FormField) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))

    // Real-time validation
    const error = validateField(field, value)
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: error || ''
    }))

    // Update flow state
    onUpdateFlowState({
      formData: { ...formData, [fieldName]: value }
    })
  }, [formData, validateField, onUpdateFlowState])

  const validateAllFields = useCallback((): boolean => {
    if (!registrationForm) return false

    const errors: ValidationErrors = {}
    let isValid = true

    registrationForm.fields.forEach((field) => {
      const error = validateField(field, formData[field.field_name])
      if (error) {
        errors[field.field_name] = error
        isValid = false
      }
    })

    setValidationErrors(errors)
    return isValid
  }, [registrationForm, formData, validateField])

  const handleSubmit = async () => {
    if (!validateAllFields()) {
      return
    }

    if (!flowState.registrationId) {
      console.error('No registration ID available')
      return
    }

    setSubmitting(true)
    try {
      await execute(`/api/registration-flow/${flowState.registrationId}/submit-form`, {
        method: 'POST',
        data: { form_data: formData }
      })

      // Move to next step
      onNext({ formData, formCompleted: true })
    } catch (error) {
      console.error('Failed to submit form:', error)
      setValidationErrors(prev => ({
        ...prev,
        _general: 'Failed to submit form. Please try again.'
      }))
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.field_name] || ''
    const error = validationErrors[field.field_name]
    const hasError = Boolean(error)

    const commonProps = {
      id: field.field_name,
      name: field.field_name,
      placeholder: field.placeholder || '',
      className: `w-full ${hasError ? 'border-red-500' : ''}`,
      required: field.is_required
    }

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <Input
            {...commonProps}
            type={field.field_type}
            value={value as string}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value, field)}
          />
        )

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            value={value as string}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value, field)}
          />
        )

      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
            value={value as string}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value, field)}
          />
        )

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            className={`min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${hasError ? 'border-red-500' : ''}`}
            value={value as string}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value, field)}
          />
        )

      case 'select':
        return (
          <Select
            {...commonProps}
            value={value as string}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value, field)}
          >
            <option value="">Select an option...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.field_name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleFieldChange(field.field_name, e.target.value, field)}
                  className="text-blue-600"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name={field.field_name}
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.field_name, e.target.checked, field)}
              className="text-blue-600"
            />
            <span className="text-sm">{field.label}</span>
          </label>
        )

      default:
        return (
          <Input
            {...commonProps}
            type="text"
            value={value as string}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value, field)}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading registration form...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!registrationForm) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-gray-600 mb-4">No registration form found for this program.</p>
              <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>
                  Back
                </Button>
                <Button onClick={() => onNext()}>
                  Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sortedFields = [...registrationForm.fields].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{registrationForm.name}</CardTitle>
          {registrationForm.description && (
            <CardDescription>{registrationForm.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {validationErrors._general && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{validationErrors._general}</p>
              </div>
            )}

            {sortedFields.map((field) => (
              <div key={field.id} className="space-y-2">
                {field.field_type !== 'checkbox' && (
                  <label htmlFor={field.field_name} className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}

                {renderField(field)}

                {validationErrors[field.field_name] && (
                  <p className="text-red-500 text-sm">{validationErrors[field.field_name]}</p>
                )}
              </div>
            ))}

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="min-w-[120px]"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}