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
import { Search, Plus, Edit, Trash2, Users, AlertTriangle, ChevronLeft, ChevronRight, Sparkles, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AgeGroup {
  id: string
  name: string
  description?: string
  min_age?: number
  max_age?: number
  created_at: string
  updated_at: string
}

interface AgeGroupFormData {
  name: string
  description: string
  min_age: string
  max_age: string
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

export default function AgeGroupManagement() {
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([])
  const [filteredAgeGroups, setFilteredAgeGroups] = useState<AgeGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAgeGroups, setTotalAgeGroups] = useState(0)
  const ageGroupsPerPage = 10

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | null>(null)
  const [formData, setFormData] = useState<AgeGroupFormData>({
    name: '',
    description: '',
    min_age: '',
    max_age: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<AgeGroupFormData>>({})

  // Notification state
  const [notification, setNotification] = useState<Notification | null>(null)

  useEffect(() => {
    fetchAgeGroups()
  }, [currentPage, searchTerm])

  useEffect(() => {
    const filtered = ageGroups.filter(ageGroup =>
      ageGroup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ageGroup.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredAgeGroups(filtered)
    setTotalAgeGroups(filtered.length)
    setTotalPages(Math.ceil(filtered.length / ageGroupsPerPage))
  }, [ageGroups, searchTerm])

  const fetchAgeGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ageGroupsPerPage.toString()
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/structure/age-groups?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch age groups')
      }

      const data = await response.json()
      const ageGroupsArray = data.ageGroups || []

      setAgeGroups(ageGroupsArray)
      setTotalAgeGroups(data.pagination?.total || ageGroupsArray.length)
      setTotalPages(data.pagination?.totalPages || Math.ceil(ageGroupsArray.length / ageGroupsPerPage))
    } catch (err) {
      setError('Failed to load age groups')
      showNotification('error', 'Failed to load age groups. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const validateForm = (): boolean => {
    const errors: Partial<AgeGroupFormData> = {}

    if (!formData.name.trim()) {
      errors.name = 'Age group name is required'
    } else if (formData.name.length > 100) {
      errors.name = 'Age group name must be 100 characters or less'
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be 500 characters or less'
    }

    if (formData.min_age && isNaN(Number(formData.min_age))) {
      errors.min_age = 'Minimum age must be a valid number'
    }

    if (formData.max_age && isNaN(Number(formData.max_age))) {
      errors.max_age = 'Maximum age must be a valid number'
    }

    if (formData.min_age && formData.max_age) {
      const minAge = Number(formData.min_age)
      const maxAge = Number(formData.max_age)
      if (minAge >= maxAge) {
        errors.max_age = 'Maximum age must be greater than minimum age'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      min_age: '',
      max_age: ''
    })
    setFormErrors({})
  }

  const openCreateForm = () => {
    resetForm()
    setShowCreateForm(true)
  }

  const openEditForm = (ageGroup: AgeGroup) => {
    setSelectedAgeGroup(ageGroup)
    setFormData({
      name: ageGroup.name,
      description: ageGroup.description || '',
      min_age: ageGroup.min_age?.toString() || '',
      max_age: ageGroup.max_age?.toString() || ''
    })
    setFormErrors({})
    setShowEditForm(true)
  }

  const openDeleteDialog = (ageGroup: AgeGroup) => {
    setSelectedAgeGroup(ageGroup)
    setShowDeleteDialog(true)
  }

  const closeAllModals = () => {
    setShowCreateForm(false)
    setShowEditForm(false)
    setShowDeleteDialog(false)
    setSelectedAgeGroup(null)
    resetForm()
  }

  const handleCreateAgeGroup = async () => {
    if (!validateForm()) return

    try {
      setFormLoading(true)
      const response = await fetch('/api/structure/age-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          min_age: formData.min_age ? Number(formData.min_age) : null,
          max_age: formData.max_age ? Number(formData.max_age) : null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create age group')
      }

      const newAgeGroup = await response.json()
      setAgeGroups(prev => [newAgeGroup, ...prev])
      closeAllModals()
      showNotification('success', 'Age group created successfully!')
      fetchAgeGroups()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create age group'
      showNotification('error', message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateAgeGroup = async () => {
    if (!selectedAgeGroup || !validateForm()) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/structure/age-groups/${selectedAgeGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          min_age: formData.min_age ? Number(formData.min_age) : null,
          max_age: formData.max_age ? Number(formData.max_age) : null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update age group')
      }

      const updatedAgeGroup = await response.json()
      setAgeGroups(prev => prev.map(group =>
        group.id === selectedAgeGroup.id ? updatedAgeGroup : group
      ))
      closeAllModals()
      showNotification('success', 'Age group updated successfully!')
      fetchAgeGroups()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update age group'
      showNotification('error', message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteAgeGroup = async () => {
    if (!selectedAgeGroup) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/structure/age-groups/${selectedAgeGroup.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete age group')
      }

      setAgeGroups(prev => prev.filter(group => group.id !== selectedAgeGroup.id))
      closeAllModals()
      showNotification('success', 'Age group deleted successfully!')
      fetchAgeGroups()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete age group'
      showNotification('error', message)
    } finally {
      setFormLoading(false)
    }
  }

  const getCurrentPageAgeGroups = () => {
    const startIndex = (currentPage - 1) * ageGroupsPerPage
    const endIndex = startIndex + ageGroupsPerPage
    return filteredAgeGroups.slice(startIndex, endIndex)
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const formatAgeRange = (ageGroup: AgeGroup) => {
    if (ageGroup.min_age && ageGroup.max_age) {
      return `Ages ${ageGroup.min_age}-${ageGroup.max_age}`
    } else if (ageGroup.min_age) {
      return `Ages ${ageGroup.min_age}+`
    } else if (ageGroup.max_age) {
      return `Ages up to ${ageGroup.max_age}`
    }
    return 'No age restriction'
  }

  if (loading && ageGroups.length === 0) {
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
                Age Group Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Define age-based categories and player eligibility ranges
              </p>
            </div>
          </div>
          <Button onClick={openCreateForm} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Age Group
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
                placeholder="Search age groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
          </motion.div>

          {/* Stats */}
          {[
            { label: 'Total Age Groups', value: totalAgeGroups, icon: Users, gradient: 'from-blue-600 to-blue-800' },
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
                fetchAgeGroups()
              }}
              className="ml-auto"
            >
              Retry
            </Button>
          </motion.div>
        )}

        {/* Age Groups List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {getCurrentPageAgeGroups().length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No age groups found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {searchTerm ? 'No age groups match your search criteria.' : 'Get started by creating your first age group.'}
              </p>
              {!searchTerm && (
                <Button onClick={openCreateForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Age Group
                </Button>
              )}
            </motion.div>
          ) : (
            getCurrentPageAgeGroups().map((ageGroup) => (
              <motion.div
                key={ageGroup.id}
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
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {ageGroup.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatAgeRange(ageGroup)} • Created {new Date(ageGroup.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {ageGroup.description && (
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                          {ageGroup.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(ageGroup)}
                        className="flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(ageGroup)}
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

        {/* Create/Edit Age Group Dialog */}
        <Dialog open={showCreateForm || showEditForm} onOpenChange={closeAllModals}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {showCreateForm ? 'Create New Age Group' : 'Edit Age Group'}
              </DialogTitle>
              <DialogDescription>
                {showCreateForm
                  ? 'Add a new age group to categorize players.'
                  : 'Update the age group information.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Age Group Name *
                </label>
                <Input
                  type="text"
                  placeholder="Enter age group name (e.g., U12, Adult, Senior)"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Age
                  </label>
                  <Input
                    type="number"
                    placeholder="Min age"
                    value={formData.min_age}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_age: e.target.value }))}
                    className={formErrors.min_age ? 'border-red-500' : ''}
                    min="0"
                    max="100"
                  />
                  {formErrors.min_age && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.min_age}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Maximum Age
                  </label>
                  <Input
                    type="number"
                    placeholder="Max age"
                    value={formData.max_age}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_age: e.target.value }))}
                    className={formErrors.max_age ? 'border-red-500' : ''}
                    min="0"
                    max="100"
                  />
                  {formErrors.max_age && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.max_age}</p>
                  )}
                </div>
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
                onClick={showCreateForm ? handleCreateAgeGroup : handleUpdateAgeGroup}
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
                {showCreateForm ? 'Create Age Group' : 'Update Age Group'}
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
                Delete Age Group
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedAgeGroup?.name}"?
                This action cannot be undone and may affect players assigned to this age group.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={closeAllModals} disabled={formLoading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAgeGroup}
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
                Delete Age Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}