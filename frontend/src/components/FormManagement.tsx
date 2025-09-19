import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Eye, Trash2, Settings, FileText, Calendar, Activity } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
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

export default function FormManagement() {
  const [forms, setForms] = useState<RegistrationForm[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<RegistrationForm | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const { loading, error, execute } = useApi<any>()

  // Get auth token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    loadForms()
  }, [])

  const loadForms = async () => {
    try {
      const response = await execute('/api/form-builder/forms', {
        method: 'GET',
        headers: getAuthHeaders()
      })
      setForms(response.forms || [])
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
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Failed to delete form:', err)
    }
  }

  const openDeleteDialog = (form: RegistrationForm) => {
    setSelectedForm(form)
    setIsDeleteDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Registration Forms</h1>
            <p className="text-gray-600 mt-2">Create and manage custom registration forms</p>
          </div>
          <Link to="/dashboard/forms/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Form
            </Button>
          </Link>
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

        {/* Forms List */}
        <motion.div variants={itemVariants} className="grid gap-4">
          {loading ? (
            <div className="text-center py-8">Loading forms...</div>
          ) : forms.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first registration form</p>
                <Link to="/dashboard/forms/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Form
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            forms.map((form) => (
              <motion.div
                key={form.id}
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {form.name}
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
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {form.description || 'No description provided'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
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
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </motion.div>

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