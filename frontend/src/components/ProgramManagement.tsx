import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Filter, Search, Calendar, Users, DollarSign, Activity } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
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
}

interface ProgramFormData {
  name: string
  description: string
  season: string
  start_date: string
  end_date: string
  registration_open_date: string
  registration_close_date: string
  max_capacity: string
  base_fee: string
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

const seasons = [
  'Spring 2024', 'Summer 2024', 'Fall 2024', 'Winter 2024',
  'Spring 2025', 'Summer 2025', 'Fall 2025', 'Winter 2025'
]

export default function ProgramManagement() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [filterSeason, setFilterSeason] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState<ProgramFormData>({
    name: '',
    description: '',
    season: '',
    start_date: '',
    end_date: '',
    registration_open_date: '',
    registration_close_date: '',
    max_capacity: '',
    base_fee: ''
  })
  const [formErrors, setFormErrors] = useState<Partial<ProgramFormData>>({})

  const { loading, error, execute } = useApi<any>()

  // Get auth token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    loadPrograms()
  }, [])

  useEffect(() => {
    filterPrograms()
  }, [programs, filterSeason, filterStatus, searchTerm])

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

  const filterPrograms = () => {
    let filtered = programs

    if (filterSeason) {
      filtered = filtered.filter(program => program.season === filterSeason)
    }

    if (filterStatus) {
      if (filterStatus === 'active') {
        filtered = filtered.filter(program => program.is_active)
      } else if (filterStatus === 'inactive') {
        filtered = filtered.filter(program => !program.is_active)
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(program =>
        program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPrograms(filtered)
    setCurrentPage(1)
  }

  const validateForm = (data: ProgramFormData): boolean => {
    const errors: Partial<ProgramFormData> = {}

    if (!data.name.trim()) {
      errors.name = 'Name is required'
    } else if (data.name.length > 100) {
      errors.name = 'Name must be 100 characters or less'
    }

    if (data.description && data.description.length > 500) {
      errors.description = 'Description must be 500 characters or less'
    }

    if (!data.season.trim()) {
      errors.season = 'Season is required'
    }

    if (!data.start_date) {
      errors.start_date = 'Start date is required'
    }

    if (!data.end_date) {
      errors.end_date = 'End date is required'
    }

    if (!data.registration_open_date) {
      errors.registration_open_date = 'Registration open date is required'
    }

    if (!data.registration_close_date) {
      errors.registration_close_date = 'Registration close date is required'
    }

    if (data.start_date && data.end_date && new Date(data.start_date) >= new Date(data.end_date)) {
      errors.end_date = 'End date must be after start date'
    }

    if (data.registration_open_date && data.registration_close_date &&
        new Date(data.registration_open_date) >= new Date(data.registration_close_date)) {
      errors.registration_close_date = 'Registration close date must be after open date'
    }

    if (data.max_capacity && (isNaN(Number(data.max_capacity)) || Number(data.max_capacity) <= 0)) {
      errors.max_capacity = 'Max capacity must be a positive number'
    }

    if (!data.base_fee || isNaN(Number(data.base_fee)) || Number(data.base_fee) < 0) {
      errors.base_fee = 'Base fee must be a valid positive number'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateProgram = async () => {
    if (!validateForm(formData)) return

    try {
      const programData = {
        name: formData.name,
        description: formData.description || null,
        season: formData.season,
        start_date: formData.start_date,
        end_date: formData.end_date,
        registration_open_date: formData.registration_open_date,
        registration_close_date: formData.registration_close_date,
        max_capacity: formData.max_capacity ? Number(formData.max_capacity) : null,
        base_fee: Number(formData.base_fee),
        is_active: true
      }

      await execute('/api/programs', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: programData
      })

      setSuccessMessage('Program created successfully!')
      setIsCreateDialogOpen(false)
      resetForm()
      loadPrograms()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Failed to create program:', err)
    }
  }

  const handleEditProgram = async () => {
    if (!selectedProgram || !validateForm(formData)) return

    try {
      const programData = {
        name: formData.name,
        description: formData.description || null,
        season: formData.season,
        start_date: formData.start_date,
        end_date: formData.end_date,
        registration_open_date: formData.registration_open_date,
        registration_close_date: formData.registration_close_date,
        max_capacity: formData.max_capacity ? Number(formData.max_capacity) : null,
        base_fee: Number(formData.base_fee)
      }

      await execute(`/api/programs/${selectedProgram.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: programData
      })

      setSuccessMessage('Program updated successfully!')
      setIsEditDialogOpen(false)
      setSelectedProgram(null)
      resetForm()
      loadPrograms()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Failed to update program:', err)
    }
  }

  const handleDeleteProgram = async () => {
    if (!selectedProgram) return

    try {
      await execute(`/api/programs/${selectedProgram.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      setSuccessMessage('Program deleted successfully!')
      setIsDeleteDialogOpen(false)
      setSelectedProgram(null)
      loadPrograms()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Failed to delete program:', err)
    }
  }

  const openEditDialog = (program: Program) => {
    setSelectedProgram(program)
    setFormData({
      name: program.name,
      description: program.description || '',
      season: program.season || '',
      start_date: program.start_date,
      end_date: program.end_date,
      registration_open_date: program.registration_open_date,
      registration_close_date: program.registration_close_date,
      max_capacity: program.max_capacity?.toString() || '',
      base_fee: program.base_fee.toString()
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (program: Program) => {
    setSelectedProgram(program)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      season: '',
      start_date: '',
      end_date: '',
      registration_open_date: '',
      registration_close_date: '',
      max_capacity: '',
      base_fee: ''
    })
    setFormErrors({})
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentPrograms = filteredPrograms.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage)

  return (
    <div className="container mx-auto p-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Program Management</h1>
            <p className="text-gray-600 mt-2">Manage sports programs, seasons, and registration settings</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Program
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Program</DialogTitle>
                <DialogDescription>
                  Add a new sports program with registration settings and pricing.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Program Name *
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={formErrors.name ? 'border-red-500' : ''}
                    placeholder="Enter program name"
                  />
                  {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                </div>

                <div className="col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${formErrors.description ? 'border-red-500' : 'border-gray-300'}`}
                    rows={3}
                    placeholder="Program description"
                  />
                  {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
                </div>

                <div>
                  <label htmlFor="season" className="block text-sm font-medium mb-1">
                    Season *
                  </label>
                  <Select value={formData.season} onValueChange={(value) => setFormData({ ...formData, season: value })}>
                    <SelectTrigger className={formErrors.season ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map((season) => (
                        <SelectItem key={season} value={season}>
                          {season}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.season && <p className="text-red-500 text-sm mt-1">{formErrors.season}</p>}
                </div>

                <div>
                  <label htmlFor="base_fee" className="block text-sm font-medium mb-1">
                    Base Fee *
                  </label>
                  <Input
                    id="base_fee"
                    type="number"
                    step="0.01"
                    value={formData.base_fee}
                    onChange={(e) => setFormData({ ...formData, base_fee: e.target.value })}
                    className={formErrors.base_fee ? 'border-red-500' : ''}
                    placeholder="0.00"
                  />
                  {formErrors.base_fee && <p className="text-red-500 text-sm mt-1">{formErrors.base_fee}</p>}
                </div>

                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium mb-1">
                    Program Start Date *
                  </label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className={formErrors.start_date ? 'border-red-500' : ''}
                  />
                  {formErrors.start_date && <p className="text-red-500 text-sm mt-1">{formErrors.start_date}</p>}
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium mb-1">
                    Program End Date *
                  </label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className={formErrors.end_date ? 'border-red-500' : ''}
                  />
                  {formErrors.end_date && <p className="text-red-500 text-sm mt-1">{formErrors.end_date}</p>}
                </div>

                <div>
                  <label htmlFor="registration_open_date" className="block text-sm font-medium mb-1">
                    Registration Open Date *
                  </label>
                  <Input
                    id="registration_open_date"
                    type="date"
                    value={formData.registration_open_date}
                    onChange={(e) => setFormData({ ...formData, registration_open_date: e.target.value })}
                    className={formErrors.registration_open_date ? 'border-red-500' : ''}
                  />
                  {formErrors.registration_open_date && <p className="text-red-500 text-sm mt-1">{formErrors.registration_open_date}</p>}
                </div>

                <div>
                  <label htmlFor="registration_close_date" className="block text-sm font-medium mb-1">
                    Registration Close Date *
                  </label>
                  <Input
                    id="registration_close_date"
                    type="date"
                    value={formData.registration_close_date}
                    onChange={(e) => setFormData({ ...formData, registration_close_date: e.target.value })}
                    className={formErrors.registration_close_date ? 'border-red-500' : ''}
                  />
                  {formErrors.registration_close_date && <p className="text-red-500 text-sm mt-1">{formErrors.registration_close_date}</p>}
                </div>

                <div className="col-span-2">
                  <label htmlFor="max_capacity" className="block text-sm font-medium mb-1">
                    Maximum Capacity (Optional)
                  </label>
                  <Input
                    id="max_capacity"
                    type="number"
                    value={formData.max_capacity}
                    onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                    className={formErrors.max_capacity ? 'border-red-500' : ''}
                    placeholder="Leave empty for unlimited capacity"
                  />
                  {formErrors.max_capacity && <p className="text-red-500 text-sm mt-1">{formErrors.max_capacity}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProgram} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Program'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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

        {/* Filters */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-lg shadow">
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
                  {seasons.map((season) => (
                    <SelectItem key={season} value={season}>
                      {season}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filterSeason || filterStatus || searchTerm) && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilterSeason('')
                  setFilterStatus('')
                  setSearchTerm('')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </motion.div>

        {/* Programs List */}
        <motion.div variants={itemVariants} className="grid gap-4">
          {loading ? (
            <div className="text-center py-8">Loading programs...</div>
          ) : currentPrograms.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No programs found</p>
              </CardContent>
            </Card>
          ) : (
            currentPrograms.map((program) => (
              <motion.div
                key={program.id}
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {program.name}
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            program.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {program.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {program.description || 'No description provided'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(program)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(program)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                        <Calendar className="h-4 w-4 text-green-500" />
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
                          <p className="text-gray-500">Base Fee</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Registration Period</p>
                          <p className="text-gray-500">
                            {formatDate(program.registration_open_date)} - {formatDate(program.registration_close_date)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Last Updated</p>
                          <p className="text-gray-500">{formatDate(program.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div variants={itemVariants} className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
            <DialogDescription>
              Update the program details and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <label htmlFor="edit-name" className="block text-sm font-medium mb-1">
                Program Name *
              </label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={formErrors.name ? 'border-red-500' : ''}
                placeholder="Enter program name"
              />
              {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
            </div>

            <div className="col-span-2">
              <label htmlFor="edit-description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${formErrors.description ? 'border-red-500' : 'border-gray-300'}`}
                rows={3}
                placeholder="Program description"
              />
              {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
            </div>

            <div>
              <label htmlFor="edit-season" className="block text-sm font-medium mb-1">
                Season *
              </label>
              <Select value={formData.season} onValueChange={(value) => setFormData({ ...formData, season: value })}>
                <SelectTrigger className={formErrors.season ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season} value={season}>
                      {season}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.season && <p className="text-red-500 text-sm mt-1">{formErrors.season}</p>}
            </div>

            <div>
              <label htmlFor="edit-base_fee" className="block text-sm font-medium mb-1">
                Base Fee *
              </label>
              <Input
                id="edit-base_fee"
                type="number"
                step="0.01"
                value={formData.base_fee}
                onChange={(e) => setFormData({ ...formData, base_fee: e.target.value })}
                className={formErrors.base_fee ? 'border-red-500' : ''}
                placeholder="0.00"
              />
              {formErrors.base_fee && <p className="text-red-500 text-sm mt-1">{formErrors.base_fee}</p>}
            </div>

            <div>
              <label htmlFor="edit-start_date" className="block text-sm font-medium mb-1">
                Program Start Date *
              </label>
              <Input
                id="edit-start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className={formErrors.start_date ? 'border-red-500' : ''}
              />
              {formErrors.start_date && <p className="text-red-500 text-sm mt-1">{formErrors.start_date}</p>}
            </div>

            <div>
              <label htmlFor="edit-end_date" className="block text-sm font-medium mb-1">
                Program End Date *
              </label>
              <Input
                id="edit-end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className={formErrors.end_date ? 'border-red-500' : ''}
              />
              {formErrors.end_date && <p className="text-red-500 text-sm mt-1">{formErrors.end_date}</p>}
            </div>

            <div>
              <label htmlFor="edit-registration_open_date" className="block text-sm font-medium mb-1">
                Registration Open Date *
              </label>
              <Input
                id="edit-registration_open_date"
                type="date"
                value={formData.registration_open_date}
                onChange={(e) => setFormData({ ...formData, registration_open_date: e.target.value })}
                className={formErrors.registration_open_date ? 'border-red-500' : ''}
              />
              {formErrors.registration_open_date && <p className="text-red-500 text-sm mt-1">{formErrors.registration_open_date}</p>}
            </div>

            <div>
              <label htmlFor="edit-registration_close_date" className="block text-sm font-medium mb-1">
                Registration Close Date *
              </label>
              <Input
                id="edit-registration_close_date"
                type="date"
                value={formData.registration_close_date}
                onChange={(e) => setFormData({ ...formData, registration_close_date: e.target.value })}
                className={formErrors.registration_close_date ? 'border-red-500' : ''}
              />
              {formErrors.registration_close_date && <p className="text-red-500 text-sm mt-1">{formErrors.registration_close_date}</p>}
            </div>

            <div className="col-span-2">
              <label htmlFor="edit-max_capacity" className="block text-sm font-medium mb-1">
                Maximum Capacity (Optional)
              </label>
              <Input
                id="edit-max_capacity"
                type="number"
                value={formData.max_capacity}
                onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                className={formErrors.max_capacity ? 'border-red-500' : ''}
                placeholder="Leave empty for unlimited capacity"
              />
              {formErrors.max_capacity && <p className="text-red-500 text-sm mt-1">{formErrors.max_capacity}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProgram} disabled={loading}>
              {loading ? 'Updating...' : 'Update Program'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Program</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProgram?.name}"? This action cannot be undone.
              {selectedProgram && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Deleting this program may affect existing registrations and payments.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProgram}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Program'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}