import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Edit, Users, Calendar, AlertCircle, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { useApi } from '../hooks/useApi'

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
  created_at: string
  updated_at: string
  current_registrations?: number
  available_spots?: number
}

interface ProgramCapacity {
  program_id: string
  program_name: string
  current_registrations: number
  max_capacity: number | null
  available_spots: number | null
  is_full: boolean
  capacity_utilization: number | null
}

interface EditFormData {
  max_capacity: string
  registration_open_date: string
  registration_close_date: string
  is_active: boolean
}

interface ProgramSettingsManagementProps {
  onBack: () => void
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
      duration: 0.3
    }
  }
}

export default function ProgramSettingsManagement({ onBack }: ProgramSettingsManagementProps) {
  const [programs, setPrograms] = useState<Program[]>([])
  const [capacityData, setCapacityData] = useState<Record<string, ProgramCapacity>>({})
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [editFormData, setEditFormData] = useState<EditFormData>({
    max_capacity: '',
    registration_open_date: '',
    registration_close_date: '',
    is_active: true
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { loading: programsLoading, execute } = useApi()

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      const response = await execute('/api/programs')
      if (response?.programs) {
        setPrograms(response.programs)
        // Fetch capacity data for each program
        fetchCapacityData(response.programs)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      setMessage({ type: 'error', text: 'Failed to fetch programs' })
    }
  }

  const fetchCapacityData = async (programList: Program[]) => {
    const capacityPromises = programList.map(async (program) => {
      try {
        const capacity = await execute(`/api/admin/registration/programs/${program.id}/capacity`)
        return { programId: program.id, capacity }
      } catch (error) {
        console.error(`Error fetching capacity for program ${program.id}:`, error)
        return { programId: program.id, capacity: null }
      }
    })

    const results = await Promise.all(capacityPromises)
    const capacityMap: Record<string, ProgramCapacity> = {}

    results.forEach(({ programId, capacity }) => {
      if (capacity) {
        capacityMap[programId] = capacity
      }
    })

    setCapacityData(capacityMap)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateForInput = (dateString: string): string => {
    return new Date(dateString).toISOString().split('T')[0]
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Validate max capacity
    if (editFormData.max_capacity.trim() !== '') {
      const capacity = parseInt(editFormData.max_capacity)
      if (isNaN(capacity) || capacity <= 0) {
        errors.max_capacity = 'Capacity must be a positive number'
      }
    }

    // Validate dates
    if (!editFormData.registration_open_date) {
      errors.registration_open_date = 'Registration open date is required'
    }

    if (!editFormData.registration_close_date) {
      errors.registration_close_date = 'Registration close date is required'
    }

    if (editFormData.registration_open_date && editFormData.registration_close_date) {
      const openDate = new Date(editFormData.registration_open_date)
      const closeDate = new Date(editFormData.registration_close_date)

      if (openDate >= closeDate) {
        errors.registration_close_date = 'Close date must be after open date'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const openEditModal = (program: Program) => {
    setEditingProgram(program)
    setEditFormData({
      max_capacity: program.max_capacity?.toString() || '',
      registration_open_date: formatDateForInput(program.registration_open_date),
      registration_close_date: formatDateForInput(program.registration_close_date),
      is_active: program.is_active
    })
    setFormErrors({})
    setMessage(null)
  }

  const closeEditModal = () => {
    setEditingProgram(null)
    setEditFormData({
      max_capacity: '',
      registration_open_date: '',
      registration_close_date: '',
      is_active: true
    })
    setFormErrors({})
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingProgram || !validateForm()) {
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const updateData: any = {
        registration_open_date: editFormData.registration_open_date,
        registration_close_date: editFormData.registration_close_date,
        is_active: editFormData.is_active
      }

      if (editFormData.max_capacity.trim() !== '') {
        updateData.max_capacity = parseInt(editFormData.max_capacity)
      } else {
        updateData.max_capacity = null
      }

      const response = await execute(`/api/admin/registration/programs/${editingProgram.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response) {
        setMessage({ type: 'success', text: 'Program settings updated successfully' })

        // Refresh programs list
        await fetchPrograms()

        // Close modal after a brief delay
        setTimeout(() => {
          closeEditModal()
        }, 1500)
      }
    } catch (error: any) {
      console.error('Error updating program settings:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update program settings'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearMessage = () => {
    setMessage(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Program Settings Management</h2>
            <p className="text-gray-600">Configure program capacity and registration dates</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={fetchPrograms}
          disabled={programsLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${programsLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Message Display */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span>{message.text}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearMessage}>
                ×
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Programs List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {programsLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading programs...</span>
          </div>
        ) : programs.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Found</h3>
                <p className="text-gray-500">Create your first program to get started.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          programs.map((program) => {
            const capacity = capacityData[program.id]

            return (
              <motion.div key={program.id} variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{program.name}</CardTitle>
                        <CardDescription>
                          {program.season && `${program.season} • `}
                          {formatDate(program.start_date)} - {formatDate(program.end_date)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          program.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {program.is_active ? 'Active' : 'Inactive'}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(program)}
                          className="flex items-center space-x-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit Settings</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Registration Period</label>
                        <p className="text-sm">
                          {formatDate(program.registration_open_date)} - {formatDate(program.registration_close_date)}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Capacity</label>
                        <p className="text-sm">
                          {program.max_capacity ? `${program.max_capacity} spots` : 'Unlimited'}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Current Registrations</label>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {capacity?.current_registrations ?? '-'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Available Spots</label>
                        <p className={`text-sm font-medium ${
                          capacity?.available_spots === 0 ? 'text-red-600' :
                          capacity?.available_spots && capacity.available_spots < 5 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {capacity?.available_spots !== null ? capacity?.available_spots : 'Unlimited'}
                          {capacity?.is_full && ' (Full)'}
                        </p>
                      </div>
                    </div>

                    {capacity?.capacity_utilization !== null && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Capacity Utilization</span>
                          <span className="font-medium">{capacity.capacity_utilization}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              capacity.capacity_utilization >= 90 ? 'bg-red-500' :
                              capacity.capacity_utilization >= 75 ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(capacity.capacity_utilization, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </motion.div>

      {/* Edit Modal */}
      <Dialog open={!!editingProgram} onOpenChange={closeEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Program Settings</DialogTitle>
            <DialogDescription>
              Update capacity and registration dates for {editingProgram?.name}
            </DialogDescription>
          </DialogHeader>

          {/* Message in Modal */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 rounded-lg border text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>{message.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Capacity
              </label>
              <Input
                type="number"
                placeholder="Leave empty for unlimited"
                value={editFormData.max_capacity}
                onChange={(e) => setEditFormData({ ...editFormData, max_capacity: e.target.value })}
                className={formErrors.max_capacity ? 'border-red-300' : ''}
                min="1"
              />
              {formErrors.max_capacity && (
                <p className="text-red-600 text-sm mt-1">{formErrors.max_capacity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Open Date
              </label>
              <Input
                type="date"
                value={editFormData.registration_open_date}
                onChange={(e) => setEditFormData({ ...editFormData, registration_open_date: e.target.value })}
                className={formErrors.registration_open_date ? 'border-red-300' : ''}
                required
              />
              {formErrors.registration_open_date && (
                <p className="text-red-600 text-sm mt-1">{formErrors.registration_open_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Close Date
              </label>
              <Input
                type="date"
                value={editFormData.registration_close_date}
                onChange={(e) => setEditFormData({ ...editFormData, registration_close_date: e.target.value })}
                className={formErrors.registration_close_date ? 'border-red-300' : ''}
                required
              />
              {formErrors.registration_close_date && (
                <p className="text-red-600 text-sm mt-1">{formErrors.registration_close_date}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editFormData.is_active}
                onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Program is active
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeEditModal}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Updating...' : 'Update Settings'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}