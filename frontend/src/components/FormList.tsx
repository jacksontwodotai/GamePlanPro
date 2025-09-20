import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  Settings,
  Calendar,
  Activity,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { useApi } from '../hooks/useApi'

interface Program {
  id: string
  name: string
  season?: string
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
}

interface FormListProps {
  onFormsChange?: () => void
}

interface FilterState {
  search: string
  program_id: string
  is_active: string
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
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

export default function FormList({ onFormsChange }: FormListProps) {
  const [forms, setForms] = useState<RegistrationForm[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    program_id: '',
    is_active: ''
  })
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<RegistrationForm | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState<NodeJS.Timeout | null>(null)

  const { loading, error, execute } = useApi<any>()

  // Get auth token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // Debounced search function
  const debouncedSearch = useCallback((searchTerm: string) => {
    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout)
    }

    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }))
      setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page on search
    }, 300)

    setSearchDebounceTimeout(timeout)
  }, [searchDebounceTimeout])

  useEffect(() => {
    loadPrograms()
  }, [])

  useEffect(() => {
    loadForms()
  }, [filters, pagination.page, pagination.limit])

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

  const loadForms = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (filters.search) queryParams.append('search', filters.search)
      if (filters.program_id) queryParams.append('program_id', filters.program_id)
      if (filters.is_active) queryParams.append('is_active', filters.is_active)

      const response = await execute(`/api/form-builder/forms?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      setForms(response.forms || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0
      }))
    } catch (err) {
      console.error('Failed to load forms:', err)
    }
  }

  const handleDeleteForm = async () => {
    if (!selectedForm) return

    try {
      await execute(`/api/form-builder/forms/${selectedForm.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      setSuccessMessage('Form deleted successfully!')
      setIsDeleteDialogOpen(false)
      setSelectedForm(null)
      loadForms()
      onFormsChange?.()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Failed to delete form:', err)
    }
  }

  const openDeleteDialog = (form: RegistrationForm) => {
    setSelectedForm(form)
    setIsDeleteDialogOpen(true)
  }

  const handleSearchChange = (value: string) => {
    debouncedSearch(value)
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page on filter change
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      program_id: '',
      is_active: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const hasActiveFilters = filters.search || filters.program_id || filters.is_active

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5
    const startPage = Math.max(1, pagination.page - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1)

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div className="space-y-6 p-6">
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

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search forms..."
              className="pl-10"
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Program Filter */}
          <Select
            value={filters.program_id}
            onValueChange={(value) => handleFilterChange('program_id', value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Programs</SelectItem>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name} {program.season && `- ${program.season}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filters.is_active}
            onValueChange={(value) => handleFilterChange('is_active', value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Refresh Button */}
        <Button variant="outline" onClick={loadForms} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {forms.length} of {pagination.total} forms
          {hasActiveFilters && ' (filtered)'}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Select
            value={pagination.limit.toString()}
            onValueChange={(value) => setPagination(prev => ({ ...prev, limit: parseInt(value), page: 1 }))}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>per page</span>
        </div>
      </div>

      {/* Forms List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p>Loading forms...</p>
          </div>
        ) : forms.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {hasActiveFilters ? 'No forms match your filters' : 'No forms yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your search criteria or clear filters to see all forms'
                  : 'Get started by creating your first registration form'
                }
              </p>
              {!hasActiveFilters && (
                <Link to="/dashboard/forms/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Form
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          forms.map((form, index) => (
            <motion.div
              key={form.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          form.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {form.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {form.is_published && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            Published
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4">
                        {form.description || 'No description provided'}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="font-medium">
                              {form.programs ? `${form.programs.name}` : 'No Program'}
                            </p>
                            <p className="text-gray-500">
                              {form.programs?.season || 'Associated Program'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="font-medium">{formatDate(form.created_at)}</p>
                            <p className="text-gray-500">Created</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-purple-500" />
                          <div>
                            <p className="font-medium">{formatDate(form.updated_at)}</p>
                            <p className="text-gray-500">Last Updated</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link to={`/dashboard/forms/${form.id}/preview`}>
                        <Button variant="outline" size="sm" title="Preview Form">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to={`/dashboard/forms/${form.id}`}>
                        <Button variant="outline" size="sm" title="Edit Form">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(form)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete Form"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getPageNumbers().map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === pagination.page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                className="w-10"
              >
                {pageNum}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedForm?.name}"? This action cannot be undone and will permanently remove the form and all its fields.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteForm}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Form'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}