import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Search, Plus, Edit, Trash2, Settings, AlertTriangle, ChevronLeft, ChevronRight, Sparkles, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Division {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

interface DivisionFormData {
  name: string
  description: string
}

interface Notification {
  type: 'success' | 'error'
  message: string
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

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25
    }
  }
} as const

export default function DivisionManagement() {
  const [divisions, setDivisions] = useState<Division[]>([])
  const [filteredDivisions, setFilteredDivisions] = useState<Division[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDivisions, setTotalDivisions] = useState(0)
  const divisionsPerPage = 10

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null)
  const [formData, setFormData] = useState<DivisionFormData>({
    name: '',
    description: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<DivisionFormData>>({})

  // Notification state
  const [notification, setNotification] = useState<Notification | null>(null)

  useEffect(() => {
    fetchDivisions()
  }, [currentPage, searchTerm])

  useEffect(() => {
    const filtered = divisions.filter(division =>
      division.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      division.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredDivisions(filtered)
    setTotalDivisions(filtered.length)
    setTotalPages(Math.ceil(filtered.length / divisionsPerPage))
  }, [divisions, searchTerm])

  const fetchDivisions = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: divisionsPerPage.toString()
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/structure/divisions?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch divisions')
      }

      const data = await response.json()
      const divisionsArray = data.divisions || []

      setDivisions(divisionsArray)
      setTotalDivisions(data.pagination?.total || divisionsArray.length)
      setTotalPages(data.pagination?.totalPages || Math.ceil(divisionsArray.length / divisionsPerPage))
    } catch (err) {
      setError('Failed to load divisions')
      showNotification('error', 'Failed to load divisions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const validateForm = (): boolean => {
    const errors: Partial<DivisionFormData> = {}

    if (!formData.name.trim()) {
      errors.name = 'Division name is required'
    } else if (formData.name.length > 100) {
      errors.name = 'Division name must be 100 characters or less'
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be 500 characters or less'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    })
    setFormErrors({})
  }

  const openCreateForm = () => {
    resetForm()
    setShowCreateForm(true)
  }

  const openEditForm = (division: Division) => {
    setSelectedDivision(division)
    setFormData({
      name: division.name,
      description: division.description || ''
    })
    setFormErrors({})
    setShowEditForm(true)
  }

  const openDeleteDialog = (division: Division) => {
    setSelectedDivision(division)
    setShowDeleteDialog(true)
  }

  const closeAllModals = () => {
    setShowCreateForm(false)
    setShowEditForm(false)
    setShowDeleteDialog(false)
    setSelectedDivision(null)
    resetForm()
  }

  const handleCreateDivision = async () => {
    if (!validateForm()) return

    try {
      setFormLoading(true)
      const response = await fetch('/api/structure/divisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create division')
      }

      const newDivision = await response.json()
      setDivisions(prev => [newDivision, ...prev])
      closeAllModals()
      showNotification('success', 'Division created successfully!')
      fetchDivisions() // Refresh the list
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create division'
      showNotification('error', message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateDivision = async () => {
    if (!selectedDivision || !validateForm()) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/structure/divisions/${selectedDivision.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update division')
      }

      const updatedDivision = await response.json()
      setDivisions(prev => prev.map(div =>
        div.id === selectedDivision.id ? updatedDivision : div
      ))
      closeAllModals()
      showNotification('success', 'Division updated successfully!')
      fetchDivisions() // Refresh the list
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update division'
      showNotification('error', message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteDivision = async () => {
    if (!selectedDivision) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/structure/divisions/${selectedDivision.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete division')
      }

      setDivisions(prev => prev.filter(div => div.id !== selectedDivision.id))
      closeAllModals()
      showNotification('success', 'Division deleted successfully!')
      fetchDivisions() // Refresh the list
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete division'
      showNotification('error', message)
    } finally {
      setFormLoading(false)
    }
  }

  const getCurrentPageDivisions = () => {
    const startIndex = (currentPage - 1) * divisionsPerPage
    const endIndex = startIndex + divisionsPerPage
    return filteredDivisions.slice(startIndex, endIndex)
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (loading && divisions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
                notification.type === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div className="flex items-center mb-4 md:mb-0">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="mr-3"
            >
              <Sparkles className="h-8 w-8 text-blue-600" />
            </motion.div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Division Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage organizational divisions and competition categories
              </p>
            </div>
          </div>
          <Button onClick={openCreateForm} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Division
          </Button>
        </motion.div>

        {/* Search and Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {/* Search */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search divisions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
          </motion.div>

          {/* Stats */}
          {[
            { label: 'Total Divisions', value: totalDivisions, icon: Settings, gradient: 'from-blue-600 to-blue-800' },
            { label: 'Current Page', value: `${currentPage}/${totalPages}`, icon: Zap, gradient: 'from-purple-600 to-purple-800' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="glass-card p-4 flex items-center space-x-4"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className={`p-3 rounded-2xl bg-gradient-to-br ${stat.gradient}`}
              >
                <stat.icon className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center"
          >
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null)
                fetchDivisions()
              }}
              className="ml-auto"
            >
              Retry
            </Button>
          </motion.div>
        )}

        {/* Divisions List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {getCurrentPageDivisions().length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No divisions found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {searchTerm ? 'No divisions match your search criteria.' : 'Get started by creating your first division.'}
              </p>
              {!searchTerm && (
                <Button onClick={openCreateForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Division
                </Button>
              )}
            </motion.div>
          ) : (
            getCurrentPageDivisions().map((division) => (
              <motion.div
                key={division.id}
                variants={itemVariants}
                initial="rest"
                whileHover="hover"
                className="group relative"
              >
                <motion.div
                  variants={cardHoverVariants}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3">
                          <Settings className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {division.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Created {new Date(division.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {division.description && (
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                          {division.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(division)}
                        className="flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(division)}
                        className="flex items-center text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center space-x-2 mt-8"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* Create/Edit Division Dialog */}
        <Dialog open={showCreateForm || showEditForm} onOpenChange={closeAllModals}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {showCreateForm ? 'Create New Division' : 'Edit Division'}
              </DialogTitle>
              <DialogDescription>
                {showCreateForm
                  ? 'Add a new division to organize your teams.'
                  : 'Update the division information.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Division Name *
                </label>
                <Input
                  type="text"
                  placeholder="Enter division name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={formErrors.name ? 'border-red-500' : ''}
                  maxLength={100}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formData.name.length}/100 characters
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Enter description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md resize-none h-20 ${
                    formErrors.description
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  maxLength={500}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeAllModals} disabled={formLoading}>
                Cancel
              </Button>
              <Button
                onClick={showCreateForm ? handleCreateDivision : handleUpdateDivision}
                disabled={formLoading}
                className="flex items-center"
              >
                {formLoading && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                )}
                {showCreateForm ? 'Create Division' : 'Update Division'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={closeAllModals}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                Delete Division
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedDivision?.name}"?
                This action cannot be undone and may affect teams assigned to this division.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={closeAllModals} disabled={formLoading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteDivision}
                disabled={formLoading}
                className="flex items-center"
              >
                {formLoading && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                )}
                Delete Division
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}