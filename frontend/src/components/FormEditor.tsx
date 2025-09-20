import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save,
  Plus,
  Settings,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  GripVertical,
  AlertTriangle,
  Type,
  Hash,
  Mail,
  Calendar,
  ChevronDown,
  AlertCircle as AlertCircleIcon
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { useApi } from '../hooks/useApi'
import FormFieldEditor from './FormFieldEditor'

interface Program {
  id: string
  name: string
  season?: string
}

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

interface RegistrationForm {
  id: string
  name: string
  description?: string
  program_id?: string
  is_active: boolean
  is_published: boolean
  created_at: string
  updated_at: string
  programs?: Program
  fields: FormField[]
}

interface FormData {
  name: string
  description: string
  program_id: string
  is_active: boolean
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
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

export default function FormEditor() {
  const { form_id } = useParams<{ form_id: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<RegistrationForm | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    program_id: '',
    is_active: true
  })
  const [fields, setFields] = useState<FormField[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean
    field: FormField | null
    index: number | null
  }>({
    isOpen: false,
    field: null,
    index: null
  })
  const [fieldEditor, setFieldEditor] = useState<{
    isOpen: boolean
    field: FormField | null
    mode: 'add' | 'edit'
  }>({
    isOpen: false,
    field: null,
    mode: 'add'
  })

  const { loading, error, execute } = useApi<any>()

  // Get auth token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    loadPrograms()
    if (form_id && form_id !== 'new') {
      loadForm()
    } else {
      // New form mode
      setForm({
        id: 'new',
        name: '',
        description: '',
        program_id: '',
        is_active: true,
        is_published: false,
        created_at: '',
        updated_at: '',
        fields: []
      })
    }
  }, [form_id])

  // Track changes for unsaved changes warning
  useEffect(() => {
    if (form) {
      const hasChanges =
        formData.name !== (form.name || '') ||
        formData.description !== (form.description || '') ||
        formData.program_id !== (form.program_id || '') ||
        formData.is_active !== form.is_active ||
        JSON.stringify(fields) !== JSON.stringify(form.fields)

      setHasUnsavedChanges(hasChanges)
    }
  }, [formData, fields, form])

  // Handle browser navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const loadPrograms = async () => {
    try {
      const response = await execute('/api/programs', {
        method: 'GET',
        headers: getAuthHeaders()
      })
      setPrograms(response.programs || [])
    } catch (err) {
      console.error('Failed to load programs:', err)
    }
  }

  const loadForm = async () => {
    if (!form_id || form_id === 'new') return

    try {
      const response = await execute(`/api/form-builder/forms/${form_id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      setForm(response)
      setFormData({
        name: response.name || '',
        description: response.description || '',
        program_id: response.program_id || '',
        is_active: response.is_active !== undefined ? response.is_active : true
      })
      setFields(response.fields || [])
    } catch (err) {
      console.error('Failed to load form:', err)
    }
  }

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      errors.name = 'Form name is required'
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Form name must be at least 3 characters'
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Form name must be 100 characters or less'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        program_id: formData.program_id || null,
        is_active: formData.is_active,
        fields: fields.map((field, index) => ({
          ...field,
          sort_order: index
        }))
      }

      let response
      if (form_id === 'new') {
        // Create new form
        response = await execute('/api/form-builder/forms', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: payload
        })

        // Navigate to the new form
        navigate(`/dashboard/forms/${response.form.id}`, { replace: true })
      } else {
        // Update existing form
        response = await execute(`/api/form-builder/forms/${form_id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: payload
        })
      }

      setForm(response.form)
      setHasUnsavedChanges(false)
      setSuccessMessage('Form saved successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Failed to save form:', err)
    }
  }

  const handleNavigateWithCheck = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path)
      setIsConfirmDialogOpen(true)
    } else {
      navigate(path)
    }
  }

  const confirmNavigation = () => {
    setIsConfirmDialogOpen(false)
    if (pendingNavigation) {
      navigate(pendingNavigation)
      setPendingNavigation(null)
    }
  }

  const cancelNavigation = () => {
    setIsConfirmDialogOpen(false)
    setPendingNavigation(null)
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]
      setFields(newFields)
    }
  }

  const removeField = (index: number) => {
    const field = fields[index]
    setDeleteConfirmDialog({
      isOpen: true,
      field: field,
      index: index
    })
  }

  const handleDeleteField = async () => {
    if (deleteConfirmDialog.field && deleteConfirmDialog.index !== null) {
      try {
        // If field has a server ID, delete via API
        if (deleteConfirmDialog.field.id && deleteConfirmDialog.field.id.startsWith('field_')) {
          await execute(`/api/form-builder/fields/${deleteConfirmDialog.field.id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          })
        }

        // Remove from local state
        const newFields = fields.filter((_, i) => i !== deleteConfirmDialog.index)
        setFields(newFields)

        setSuccessMessage('Field deleted successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      } catch (err) {
        console.error('Failed to delete field:', err)
      }
    }

    setDeleteConfirmDialog({
      isOpen: false,
      field: null,
      index: null
    })
  }

  const cancelDeleteField = () => {
    setDeleteConfirmDialog({
      isOpen: false,
      field: null,
      index: null
    })
  }

  const getFieldTypeIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'text':
      case 'textarea':
        return Type
      case 'number':
        return Hash
      case 'email':
        return Mail
      case 'date':
        return Calendar
      case 'select':
      case 'radio':
      case 'checkbox':
        return ChevronDown
      default:
        return Type
    }
  }

  const getFieldTypeColor = (fieldType: string) => {
    switch (fieldType) {
      case 'text':
      case 'textarea':
        return 'text-blue-600'
      case 'number':
        return 'text-green-600'
      case 'email':
        return 'text-purple-600'
      case 'date':
        return 'text-orange-600'
      case 'select':
      case 'radio':
      case 'checkbox':
        return 'text-indigo-600'
      default:
        return 'text-gray-600'
    }
  }

  const handleAddField = () => {
    setFieldEditor({
      isOpen: true,
      field: null,
      mode: 'add'
    })
  }

  const handleEditField = (field: FormField) => {
    setFieldEditor({
      isOpen: true,
      field: field,
      mode: 'edit'
    })
  }

  const handleFieldSave = (savedField: FormField) => {
    if (fieldEditor.mode === 'add') {
      // Add new field
      setFields([...fields, savedField])
    } else {
      // Update existing field
      const updatedFields = fields.map(f =>
        f.id === savedField.id ? savedField : f
      )
      setFields(updatedFields)
    }

    setFieldEditor({
      isOpen: false,
      field: null,
      mode: 'add'
    })
  }

  const handleFieldEditorClose = () => {
    setFieldEditor({
      isOpen: false,
      field: null,
      mode: 'add'
    })
  }

  if (!form && form_id !== 'new') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          {loading ? 'Loading form...' : 'Form not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {form_id === 'new' ? 'Create Registration Form' : 'Edit Registration Form'}
            </h1>
            <p className="text-gray-600 mt-2">
              Configure form settings and manage field structure
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleNavigateWithCheck('/dashboard/forms')}
            >
              Back to Forms
            </Button>
            <Button onClick={handleSave} disabled={loading || !hasUnsavedChanges}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Form'}
            </Button>
          </div>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"
            >
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Settings */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Form Settings
                </CardTitle>
                <CardDescription>
                  Configure basic form information and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="form-name" className="block text-sm font-medium mb-1">
                    Form Name *
                  </label>
                  <Input
                    id="form-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={validationErrors.name ? 'border-red-500' : ''}
                    placeholder="Enter form name"
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="form-description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    id="form-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Form description"
                  />
                </div>

                <div>
                  <label htmlFor="program-select" className="block text-sm font-medium mb-1">
                    Associated Program
                  </label>
                  <Select
                    value={formData.program_id}
                    onValueChange={(value) => setFormData({ ...formData, program_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Program</SelectItem>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name} {program.season && `- ${program.season}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="is-active" className="text-sm font-medium">
                    Active Form
                  </label>
                </div>

                {hasUnsavedChanges && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800">You have unsaved changes</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Field List */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Form Fields</CardTitle>
                    <CardDescription>
                      Manage and reorder form fields
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleAddField}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No fields added yet</p>
                    <p className="text-sm">Click "Add Field" to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const FieldIcon = getFieldTypeIcon(field.field_type)
                      const fieldTypeColor = getFieldTypeColor(field.field_type)

                      return (
                        <motion.div
                          key={field.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200 hover:shadow-sm"
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <GripVertical className="h-4 w-4 text-gray-400 mt-1" />
                                <div className="flex items-center space-x-2">
                                  <FieldIcon className={`h-4 w-4 ${fieldTypeColor}`} />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <p className="font-medium text-gray-900">{field.field_label}</p>
                                      {field.is_required && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                          <AlertCircleIcon className="h-3 w-3 mr-1" />
                                          Required
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className={`text-sm font-medium ${fieldTypeColor}`}>
                                        {field.field_type.charAt(0).toUpperCase() + field.field_type.slice(1)}
                                      </span>
                                      <span className="text-gray-300">•</span>
                                      <span className="text-sm text-gray-500">{field.field_name}</span>
                                    </div>
                                    {(field.placeholder_text || field.help_text || field.validation_rules?.regex) && (
                                      <div className="mt-2 space-y-1">
                                        {field.placeholder_text && (
                                          <p className="text-xs text-gray-500">
                                            <span className="font-medium">Placeholder:</span> {field.placeholder_text}
                                          </p>
                                        )}
                                        {field.help_text && (
                                          <p className="text-xs text-gray-500">
                                            <span className="font-medium">Help:</span> {field.help_text}
                                          </p>
                                        )}
                                        {field.validation_rules?.regex && (
                                          <p className="text-xs text-gray-500">
                                            <span className="font-medium">Validation:</span> {field.validation_rules.regex}
                                          </p>
                                        )}
                                        {field.form_field_options && field.form_field_options.length > 0 && (
                                          <p className="text-xs text-gray-500">
                                            <span className="font-medium">Options:</span> {field.form_field_options.length} configured
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveField(index, 'up')}
                                  disabled={index === 0}
                                  title="Move field up"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveField(index, 'down')}
                                  disabled={index === fields.length - 1}
                                  title="Move field down"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditField(field)}
                                  title="Edit field properties"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeField(index)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Delete field"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={cancelNavigation}>
              Stay on Page
            </Button>
            <Button variant="destructive" onClick={confirmNavigation}>
              Leave Without Saving
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Field Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog.isOpen} onOpenChange={(open) => !open && cancelDeleteField()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Field</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the field "{deleteConfirmDialog.field?.field_label}"?
              This action cannot be undone and will permanently remove the field and all its configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={cancelDeleteField}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteField}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Field'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Field Editor Modal */}
      <FormFieldEditor
        field={fieldEditor.field}
        isOpen={fieldEditor.isOpen}
        onClose={handleFieldEditorClose}
        onSave={handleFieldSave}
        formId={form?.id || 'new'}
        existingFields={fields}
      />
    </div>
  )
}