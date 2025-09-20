import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  GripVertical,
  AlertCircle
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { useApi } from '../hooks/useApi'

interface FormFieldOption {
  id: string
  field_id: string
  option_label: string
  option_value: string
  sort_order: number
}

interface FieldOptionEditorProps {
  fieldId: string
  fieldType: string
  options: FormFieldOption[]
  onOptionsChange: (options: FormFieldOption[]) => void
  formId: string
}

interface NewOptionData {
  option_label: string
  option_value: string
}

interface EditingOption extends FormFieldOption {
  isEditing: boolean
  originalData?: FormFieldOption
}

export default function FieldOptionEditor({
  fieldId,
  fieldType,
  options,
  onOptionsChange,
  formId
}: FieldOptionEditorProps) {
  const [localOptions, setLocalOptions] = useState<EditingOption[]>([])
  const [newOption, setNewOption] = useState<NewOptionData>({ option_label: '', option_value: '' })
  const [isAddingOption, setIsAddingOption] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; option: FormFieldOption | null }>({
    isOpen: false,
    option: null
  })
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})
  const { loading, error, execute } = useApi()

  // Get auth token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // Convert regular options to editing options
  useEffect(() => {
    const editingOptions = options.map(option => ({
      ...option,
      isEditing: false
    }))
    setLocalOptions(editingOptions)
  }, [options])

  const validateOption = (label: string, value: string, excludeId?: string): string | null => {
    if (!label.trim()) {
      return 'Option label is required'
    }
    if (label.trim().length > 200) {
      return 'Option label must be 200 characters or less'
    }
    if (!value.trim()) {
      return 'Option value is required'
    }

    // Check for duplicate values
    const existingOption = localOptions.find(
      opt => opt.option_value === value.trim() && opt.id !== excludeId
    )
    if (existingOption) {
      return 'Option value must be unique within this field'
    }

    return null
  }

  const handleAddOption = async () => {
    const error = validateOption(newOption.option_label, newOption.option_value)
    if (error) {
      setValidationErrors({ newOption: error })
      return
    }

    setValidationErrors({})

    // For new fields (not yet saved), add to local state only
    if (fieldId === 'new' || fieldId.startsWith('field_')) {
      const localOption: EditingOption = {
        id: `temp_${Date.now()}`,
        field_id: fieldId,
        option_label: newOption.option_label.trim(),
        option_value: newOption.option_value.trim(),
        sort_order: localOptions.length,
        isEditing: false
      }

      const updatedOptions = [...localOptions, localOption]
      setLocalOptions(updatedOptions)
      onOptionsChange(updatedOptions.map(opt => ({
        id: opt.id,
        field_id: opt.field_id,
        option_label: opt.option_label,
        option_value: opt.option_value,
        sort_order: opt.sort_order
      })))

      setNewOption({ option_label: '', option_value: '' })
      setIsAddingOption(false)
      return
    }

    // For existing fields, make API call
    try {
      const response = await execute(`/api/form-builder/fields/${fieldId}/options`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: {
          option_label: newOption.option_label.trim(),
          option_value: newOption.option_value.trim(),
          sort_order: localOptions.length
        }
      })

      const addedOption: EditingOption = {
        ...response.option,
        isEditing: false
      }

      const updatedOptions = [...localOptions, addedOption]
      setLocalOptions(updatedOptions)
      onOptionsChange(updatedOptions.map(opt => ({
        id: opt.id,
        field_id: opt.field_id,
        option_label: opt.option_label,
        option_value: opt.option_value,
        sort_order: opt.sort_order
      })))

      setNewOption({ option_label: '', option_value: '' })
      setIsAddingOption(false)
    } catch (err) {
      console.error('Failed to add option:', err)
    }
  }

  const handleEditOption = (option: EditingOption) => {
    const updatedOptions = localOptions.map(opt =>
      opt.id === option.id
        ? { ...opt, isEditing: true, originalData: { ...opt } }
        : { ...opt, isEditing: false }
    )
    setLocalOptions(updatedOptions)
  }

  const handleSaveEdit = async (optionId: string) => {
    const option = localOptions.find(opt => opt.id === optionId)
    if (!option) return

    const error = validateOption(option.option_label, option.option_value, optionId)
    if (error) {
      setValidationErrors({ [optionId]: error })
      return
    }

    setValidationErrors({})

    // For new fields or temporary options, update local state only
    if (fieldId === 'new' || fieldId.startsWith('field_') || optionId.startsWith('temp_')) {
      const updatedOptions = localOptions.map(opt =>
        opt.id === optionId
          ? { ...opt, isEditing: false, originalData: undefined }
          : opt
      )
      setLocalOptions(updatedOptions)
      onOptionsChange(updatedOptions.map(opt => ({
        id: opt.id,
        field_id: opt.field_id,
        option_label: opt.option_label,
        option_value: opt.option_value,
        sort_order: opt.sort_order
      })))
      return
    }

    // For existing options, make API call
    try {
      const response = await execute(`/api/form-builder/options/${optionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: {
          option_label: option.option_label.trim(),
          option_value: option.option_value.trim(),
          sort_order: option.sort_order
        }
      })

      const updatedOptions = localOptions.map(opt =>
        opt.id === optionId
          ? { ...response.option, isEditing: false, originalData: undefined }
          : opt
      )
      setLocalOptions(updatedOptions)
      onOptionsChange(updatedOptions.map(opt => ({
        id: opt.id,
        field_id: opt.field_id,
        option_label: opt.option_label,
        option_value: opt.option_value,
        sort_order: opt.sort_order
      })))
    } catch (err) {
      console.error('Failed to update option:', err)
    }
  }

  const handleCancelEdit = (optionId: string) => {
    const updatedOptions = localOptions.map(opt => {
      if (opt.id === optionId && opt.originalData) {
        return { ...opt.originalData, isEditing: false, originalData: undefined }
      }
      return { ...opt, isEditing: false, originalData: undefined }
    })
    setLocalOptions(updatedOptions)
    setValidationErrors({})
  }

  const handleDeleteConfirm = (option: FormFieldOption) => {
    setDeleteConfirmation({ isOpen: true, option })
  }

  const handleDeleteOption = async () => {
    const option = deleteConfirmation.option
    if (!option) return

    // For new fields or temporary options, remove from local state only
    if (fieldId === 'new' || fieldId.startsWith('field_') || option.id.startsWith('temp_')) {
      const updatedOptions = localOptions.filter(opt => opt.id !== option.id)
      setLocalOptions(updatedOptions)
      onOptionsChange(updatedOptions.map(opt => ({
        id: opt.id,
        field_id: opt.field_id,
        option_label: opt.option_label,
        option_value: opt.option_value,
        sort_order: opt.sort_order
      })))
      setDeleteConfirmation({ isOpen: false, option: null })
      return
    }

    // For existing options, make API call
    try {
      await execute(`/api/form-builder/options/${option.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      const updatedOptions = localOptions.filter(opt => opt.id !== option.id)
      setLocalOptions(updatedOptions)
      onOptionsChange(updatedOptions.map(opt => ({
        id: opt.id,
        field_id: opt.field_id,
        option_label: opt.option_label,
        option_value: opt.option_value,
        sort_order: opt.sort_order
      })))
    } catch (err) {
      console.error('Failed to delete option:', err)
    }

    setDeleteConfirmation({ isOpen: false, option: null })
  }

  const handleMoveOption = (index: number, direction: 'up' | 'down') => {
    const newOptions = [...localOptions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex >= 0 && targetIndex < newOptions.length) {
      [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]]

      // Update sort orders
      const updatedOptions = newOptions.map((opt, idx) => ({
        ...opt,
        sort_order: idx
      }))

      setLocalOptions(updatedOptions)
      onOptionsChange(updatedOptions.map(opt => ({
        id: opt.id,
        field_id: opt.field_id,
        option_label: opt.option_label,
        option_value: opt.option_value,
        sort_order: opt.sort_order
      })))
    }
  }

  const handleOptionChange = (optionId: string, field: 'option_label' | 'option_value', value: string) => {
    const updatedOptions = localOptions.map(opt =>
      opt.id === optionId ? { ...opt, [field]: value } : opt
    )
    setLocalOptions(updatedOptions)
  }

  const handleAutoGenerateValue = (label: string) => {
    // Auto-generate value from label
    const value = label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .trim()
    return value
  }

  const isRequiredOptionField = ['select', 'radio'].includes(fieldType)
  const minOptionsRequired = isRequiredOptionField ? 1 : 0

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Field Options</h4>
              <p className="text-sm text-gray-500">
                {isRequiredOptionField && 'At least one option is required'}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddingOption(true)}
              disabled={isAddingOption}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Option
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          {/* Options List */}
          <div className="space-y-2">
            <AnimatePresence>
              {localOptions.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {option.isEditing ? (
                      <>
                        <div>
                          <Input
                            value={option.option_label}
                            onChange={(e) => handleOptionChange(option.id, 'option_label', e.target.value)}
                            placeholder="Option Label"
                            className={validationErrors[option.id] ? 'border-red-500' : ''}
                          />
                        </div>
                        <div>
                          <Input
                            value={option.option_value}
                            onChange={(e) => handleOptionChange(option.id, 'option_value', e.target.value)}
                            placeholder="Option Value"
                            className={validationErrors[option.id] ? 'border-red-500' : ''}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="font-medium text-sm">{option.option_label}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-mono">{option.option_value}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {option.isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveEdit(option.id)}
                          disabled={loading}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelEdit(option.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMoveOption(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMoveOption(index, 'down')}
                          disabled={index === localOptions.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditOption(option)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteConfirm(option)}
                          disabled={localOptions.length <= minOptionsRequired}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {validationErrors[option.id] && (
                    <div className="col-span-full">
                      <p className="text-red-500 text-sm">{validationErrors[option.id]}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add New Option */}
            {isAddingOption && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Input
                      value={newOption.option_label}
                      onChange={(e) => {
                        const label = e.target.value
                        setNewOption({
                          option_label: label,
                          option_value: newOption.option_value || handleAutoGenerateValue(label)
                        })
                      }}
                      placeholder="Option Label"
                      className={validationErrors.newOption ? 'border-red-500' : ''}
                    />
                  </div>
                  <div>
                    <Input
                      value={newOption.option_value}
                      onChange={(e) => setNewOption({ ...newOption, option_value: e.target.value })}
                      placeholder="Option Value"
                      className={validationErrors.newOption ? 'border-red-500' : ''}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddOption}
                    disabled={loading}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAddingOption(false)
                      setNewOption({ option_label: '', option_value: '' })
                      setValidationErrors({})
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {validationErrors.newOption && (
                  <div className="col-span-full">
                    <p className="text-red-500 text-sm">{validationErrors.newOption}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Empty State */}
            {localOptions.length === 0 && !isAddingOption && (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No options added yet</p>
                <p className="text-xs">Click "Add Option" to get started</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => setDeleteConfirmation({ isOpen: open, option: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Option</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the option "{deleteConfirmation.option?.option_label}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmation({ isOpen: false, option: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOption}
              disabled={loading}
            >
              Delete Option
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}