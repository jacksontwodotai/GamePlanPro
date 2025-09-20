import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Save, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { useApi } from '../hooks/useApi'
import FieldOptionEditor from './FieldOptionEditor'

interface FormField {
  id: string
  field_name: string
  field_label: string
  field_type: string
  is_required: boolean
  placeholder_text?: string
  help_text?: string
  validation_rules?: any
  default_value?: string
  sort_order: number
  form_field_options?: FormFieldOption[]
}

interface FormFieldOption {
  id: string
  field_id: string
  option_label: string
  option_value: string
  sort_order: number
}

interface FormFieldEditorProps {
  field: FormField | null
  isOpen: boolean
  onClose: () => void
  onSave: (field: FormField) => void
  formId: string
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'tel', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'password', label: 'Password' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Select Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Button' },
  { value: 'date', label: 'Date' },
  { value: 'datetime-local', label: 'Date & Time' },
  { value: 'time', label: 'Time' },
  { value: 'file', label: 'File Upload' },
  { value: 'hidden', label: 'Hidden Field' }
]

const SELECTION_FIELD_TYPES = ['select', 'checkbox', 'radio']

export default function FormFieldEditor({ field, isOpen, onClose, onSave, formId }: FormFieldEditorProps) {
  const [fieldData, setFieldData] = useState<Partial<FormField>>({
    field_name: '',
    field_label: '',
    field_type: 'text',
    is_required: false,
    placeholder_text: '',
    help_text: '',
    default_value: '',
    sort_order: 0
  })
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})
  const [options, setOptions] = useState<FormFieldOption[]>([])
  const { loading, error, execute } = useApi()

  // Get auth token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    if (field) {
      setFieldData({
        id: field.id,
        field_name: field.field_name,
        field_label: field.field_label,
        field_type: field.field_type,
        is_required: field.is_required,
        placeholder_text: field.placeholder_text || '',
        help_text: field.help_text || '',
        default_value: field.default_value || '',
        sort_order: field.sort_order
      })
      setOptions(field.form_field_options || [])
    } else {
      // Reset for new field
      setFieldData({
        field_name: '',
        field_label: '',
        field_type: 'text',
        is_required: false,
        placeholder_text: '',
        help_text: '',
        default_value: '',
        sort_order: 0
      })
      setOptions([])
    }
    setValidationErrors({})
  }, [field])

  const validateField = (): boolean => {
    const errors: { [key: string]: string } = {}

    if (!fieldData.field_name?.trim()) {
      errors.field_name = 'Field name is required'
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(fieldData.field_name)) {
      errors.field_name = 'Field name must start with a letter and contain only letters, numbers, and underscores'
    }

    if (!fieldData.field_label?.trim()) {
      errors.field_label = 'Field label is required'
    } else if (fieldData.field_label.trim().length < 1 || fieldData.field_label.trim().length > 200) {
      errors.field_label = 'Field label must be between 1-200 characters'
    }

    if (!fieldData.field_type) {
      errors.field_type = 'Field type is required'
    }

    // Validate selection-based fields have at least one option
    if (SELECTION_FIELD_TYPES.includes(fieldData.field_type!) && ['select', 'radio'].includes(fieldData.field_type!)) {
      if (options.length === 0) {
        errors.options = `${fieldData.field_type} fields must have at least one option`
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateField()) return

    try {
      let savedField: FormField

      if (field?.id && field.id.startsWith('field_')) {
        // Existing field from server
        const response = await execute(`/api/form-builder/fields/${field.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: {
            field_name: fieldData.field_name!.trim(),
            label: fieldData.field_label!.trim(),
            field_type: fieldData.field_type!,
            is_required: fieldData.is_required || false,
            default_value: fieldData.default_value?.trim() || null,
            placeholder: fieldData.placeholder_text?.trim() || null,
            order_index: fieldData.sort_order || 0,
            validation_regex: null // Can be extended later
          }
        })
        savedField = response.field
      } else {
        // New field (create via form update)
        savedField = {
          id: field?.id || `field_${Date.now()}`,
          field_name: fieldData.field_name!.trim(),
          field_label: fieldData.field_label!.trim(),
          field_type: fieldData.field_type!,
          is_required: fieldData.is_required || false,
          placeholder_text: fieldData.placeholder_text?.trim() || null,
          help_text: fieldData.help_text?.trim() || null,
          default_value: fieldData.default_value?.trim() || null,
          sort_order: fieldData.sort_order || 0,
          form_field_options: options
        }
      }

      // Include options in the saved field
      savedField.form_field_options = options

      onSave(savedField)
      onClose()
    } catch (err) {
      console.error('Failed to save field:', err)
    }
  }

  const handleClose = () => {
    setValidationErrors({})
    onClose()
  }

  const handleFieldTypeChange = (newType: string) => {
    setFieldData({ ...fieldData, field_type: newType })

    // Clear options if changing away from selection-based field
    if (!SELECTION_FIELD_TYPES.includes(newType)) {
      setOptions([])
    }
  }

  const isSelectionField = SELECTION_FIELD_TYPES.includes(fieldData.field_type!)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{field ? 'Edit Field' : 'Add Field'}</span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Field Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Field Settings</h3>

              <div>
                <label htmlFor="field-name" className="block text-sm font-medium mb-1">
                  Field Name *
                </label>
                <Input
                  id="field-name"
                  value={fieldData.field_name || ''}
                  onChange={(e) => setFieldData({ ...fieldData, field_name: e.target.value })}
                  className={validationErrors.field_name ? 'border-red-500' : ''}
                  placeholder="e.g., first_name"
                />
                {validationErrors.field_name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.field_name}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Used internally, must start with letter and contain only letters, numbers, underscores
                </p>
              </div>

              <div>
                <label htmlFor="field-label" className="block text-sm font-medium mb-1">
                  Field Label *
                </label>
                <Input
                  id="field-label"
                  value={fieldData.field_label || ''}
                  onChange={(e) => setFieldData({ ...fieldData, field_label: e.target.value })}
                  className={validationErrors.field_label ? 'border-red-500' : ''}
                  placeholder="e.g., First Name"
                />
                {validationErrors.field_label && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.field_label}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Displayed to users on the form
                </p>
              </div>

              <div>
                <label htmlFor="field-type" className="block text-sm font-medium mb-1">
                  Field Type *
                </label>
                <Select
                  value={fieldData.field_type}
                  onValueChange={handleFieldTypeChange}
                >
                  <SelectTrigger className={validationErrors.field_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.field_type && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.field_type}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-required"
                  checked={fieldData.is_required || false}
                  onChange={(e) => setFieldData({ ...fieldData, is_required: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is-required" className="text-sm font-medium">
                  Required Field
                </label>
              </div>

              <div>
                <label htmlFor="placeholder" className="block text-sm font-medium mb-1">
                  Placeholder Text
                </label>
                <Input
                  id="placeholder"
                  value={fieldData.placeholder_text || ''}
                  onChange={(e) => setFieldData({ ...fieldData, placeholder_text: e.target.value })}
                  placeholder="e.g., Enter your first name"
                />
              </div>

              <div>
                <label htmlFor="help-text" className="block text-sm font-medium mb-1">
                  Help Text
                </label>
                <textarea
                  id="help-text"
                  value={fieldData.help_text || ''}
                  onChange={(e) => setFieldData({ ...fieldData, help_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Additional instructions for this field"
                />
              </div>

              <div>
                <label htmlFor="default-value" className="block text-sm font-medium mb-1">
                  Default Value
                </label>
                <Input
                  id="default-value"
                  value={fieldData.default_value || ''}
                  onChange={(e) => setFieldData({ ...fieldData, default_value: e.target.value })}
                  placeholder="Default field value (optional)"
                />
              </div>
            </div>

            {/* Field Options for Selection-Based Fields */}
            {isSelectionField && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Field Options</h3>
                  {validationErrors.options && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.options}</p>
                  )}
                </div>

                <FieldOptionEditor
                  fieldId={field?.id || 'new'}
                  fieldType={fieldData.field_type!}
                  options={options}
                  onOptionsChange={setOptions}
                  formId={formId}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Field'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}