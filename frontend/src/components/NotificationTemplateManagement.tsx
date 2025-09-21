import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Plus, Edit, Trash2, Send, Eye, Filter, Search,
  RefreshCw, ArrowLeft, AlertCircle, CheckCircle, Mail,
  MessageSquare, Smartphone, Monitor
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useApi } from '../hooks/useApi'

interface NotificationTemplate {
  id: string
  name: string
  type: 'email' | 'sms' | 'push' | 'in_app'
  subject?: string
  body: string
  placeholders: Record<string, string>
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

interface Player {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
}

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
}

interface NotificationTemplateManagementProps {
  onBack: () => void
}

type ModalType = 'create' | 'edit' | 'delete' | 'send' | 'preview' | null

const typeConfig = {
  email: { label: 'Email', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-100' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-100' },
  push: { label: 'Push', icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-100' },
  in_app: { label: 'In-App', icon: Monitor, color: 'text-orange-600', bg: 'bg-orange-100' }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
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

export default function NotificationTemplateManagement({ onBack }: NotificationTemplateManagementProps) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<NotificationTemplate[]>([])
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  // Modal states
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'push' | 'in_app',
    subject: '',
    body: '',
    placeholders: {} as Record<string, string>,
    is_active: true
  })

  // Send notification states
  const [sendData, setSendData] = useState({
    template_id: '',
    recipient_type: 'player' as 'player' | 'user' | 'email',
    recipient_id: '',
    placeholders: {} as Record<string, string>
  })
  const [previewContent, setPreviewContent] = useState<{ subject?: string; body: string } | null>(null)

  const { execute } = useApi()

  useEffect(() => {
    fetchTemplates()
    fetchPlayers()
    fetchUsers()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [templates, selectedType, searchTerm])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await execute('/api/admin/registration/notification-templates')
      if (response?.templates) {
        setTemplates(response.templates)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      setMessage({ type: 'error', text: 'Failed to fetch notification templates' })
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayers = async () => {
    try {
      const response = await execute('/api/players')
      if (response?.players) {
        setPlayers(response.players.map((p: any) => ({
          ...p,
          full_name: `${p.first_name} ${p.last_name}`
        })))
      }
    } catch (error) {
      console.error('Error fetching players:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await execute('/api/users')
      if (response?.users) {
        setUsers(response.users.map((u: any) => ({
          ...u,
          full_name: `${u.first_name} ${u.last_name}`
        })))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    if (selectedType !== 'all') {
      filtered = filtered.filter(template => template.type === selectedType)
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchLower) ||
        template.body.toLowerCase().includes(searchLower) ||
        (template.subject && template.subject.toLowerCase().includes(searchLower))
      )
    }

    setFilteredTemplates(filtered)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Template name is required' })
      return false
    }

    if (!formData.body.trim()) {
      setMessage({ type: 'error', text: 'Template body is required' })
      return false
    }

    if (formData.type === 'email' && !formData.subject.trim()) {
      setMessage({ type: 'error', text: 'Subject is required for email templates' })
      return false
    }

    return true
  }

  const openModal = (type: ModalType, template?: NotificationTemplate) => {
    setModalType(type)
    setSelectedTemplate(template || null)
    setMessage(null)

    if (type === 'create') {
      setFormData({
        name: '',
        type: 'email',
        subject: '',
        body: '',
        placeholders: {},
        is_active: true
      })
    } else if (type === 'edit' && template) {
      setFormData({
        name: template.name,
        type: template.type,
        subject: template.subject || '',
        body: template.body,
        placeholders: template.placeholders || {},
        is_active: template.is_active
      })
    } else if (type === 'send' && template) {
      setSendData({
        template_id: template.id,
        recipient_type: 'player',
        recipient_id: '',
        placeholders: {}
      })
      setPreviewContent(null)
    }
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedTemplate(null)
    setMessage(null)
    setFormData({
      name: '',
      type: 'email',
      subject: '',
      body: '',
      placeholders: {},
      is_active: true
    })
    setSendData({
      template_id: '',
      recipient_type: 'player',
      recipient_id: '',
      placeholders: {}
    })
    setPreviewContent(null)
  }

  const handleCreateTemplate = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await execute('/api/admin/registration/notification-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          subject: formData.type === 'email' ? formData.subject.trim() : undefined,
          body: formData.body.trim(),
          placeholders: formData.placeholders
        })
      })

      if (response) {
        setMessage({ type: 'success', text: 'Template created successfully' })
        fetchTemplates()
        setTimeout(closeModal, 1500)
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create template' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate || !validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await execute(`/api/admin/registration/notification-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          subject: formData.type === 'email' ? formData.subject.trim() : undefined,
          body: formData.body.trim(),
          placeholders: formData.placeholders,
          is_active: formData.is_active
        })
      })

      if (response) {
        setMessage({ type: 'success', text: 'Template updated successfully' })
        fetchTemplates()
        setTimeout(closeModal, 1500)
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update template' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return

    setIsSubmitting(true)
    try {
      await execute(`/api/admin/registration/notification-templates/${selectedTemplate.id}`, {
        method: 'DELETE'
      })

      setMessage({ type: 'success', text: 'Template deleted successfully' })
      fetchTemplates()
      setTimeout(closeModal, 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete template' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const generatePreview = () => {
    if (!selectedTemplate) return

    const substituteTemplate = (text: string): string => {
      let result = text

      // Built-in placeholders
      const builtInPlaceholders = {
        '{recipient_name}': sendData.recipient_type === 'email' ? 'Recipient' : getRecipientName(),
        '{recipient_email}': sendData.recipient_type === 'email' ? sendData.recipient_id : getRecipientEmail(),
        '{current_date}': new Date().toLocaleDateString(),
        '{current_time}': new Date().toLocaleTimeString()
      }

      // Apply built-in placeholders
      Object.entries(builtInPlaceholders).forEach(([placeholder, value]) => {
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value || '')
      })

      // Apply custom placeholders
      Object.entries(sendData.placeholders).forEach(([key, value]) => {
        const placeholder = `{${key}}`
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value || '')
      })

      return result
    }

    const processedSubject = selectedTemplate.subject ? substituteTemplate(selectedTemplate.subject) : undefined
    const processedBody = substituteTemplate(selectedTemplate.body)

    setPreviewContent({
      subject: processedSubject,
      body: processedBody
    })
  }

  const getRecipientName = (): string => {
    if (sendData.recipient_type === 'player') {
      const player = players.find(p => p.id.toString() === sendData.recipient_id)
      return player ? player.full_name : 'Player'
    } else if (sendData.recipient_type === 'user') {
      const user = users.find(u => u.id.toString() === sendData.recipient_id)
      return user ? user.full_name : 'User'
    }
    return 'Recipient'
  }

  const getRecipientEmail = (): string => {
    if (sendData.recipient_type === 'player') {
      const player = players.find(p => p.id.toString() === sendData.recipient_id)
      return player ? player.email : ''
    } else if (sendData.recipient_type === 'user') {
      const user = users.find(u => u.id.toString() === sendData.recipient_id)
      return user ? user.email : ''
    }
    return sendData.recipient_id
  }

  const handleSendNotification = async () => {
    if (!sendData.recipient_id) {
      setMessage({ type: 'error', text: 'Please select a recipient' })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await execute('/api/admin/registration/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendData)
      })

      if (response) {
        setMessage({ type: 'success', text: 'Notification sent successfully' })
        setTimeout(closeModal, 1500)
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send notification' })
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
            <h2 className="text-2xl font-bold text-gray-900">Notification Templates</h2>
            <p className="text-gray-600">Create and manage notification templates</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={fetchTemplates}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button onClick={() => openModal('create')} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Template</span>
          </Button>
        </div>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="in_app">In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search templates by name, subject, or content"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-500">Loading templates...</span>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No templates match your search' : 'No notification templates'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Create your first notification template to get started.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => openModal('create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {filteredTemplates.map((template) => {
            const typeInfo = typeConfig[template.type]
            const TypeIcon = typeInfo.icon

            return (
              <motion.div key={template.id} variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${typeInfo.bg}`}>
                          <TypeIcon className={`h-5 w-5 ${typeInfo.color}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{typeInfo.label}</span>
                            {template.subject && <span>• {template.subject}</span>}
                            <span>• Created {formatDate(template.created_at)}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              template.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {template.is_active ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal('send', template)}
                          className="flex items-center space-x-1"
                        >
                          <Send className="h-4 w-4" />
                          <span>Send</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal('edit', template)}
                          className="flex items-center space-x-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal('delete', template)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {template.body}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Create/Edit Template Modal */}
      <Dialog open={modalType === 'create' || modalType === 'edit'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {modalType === 'create' ? 'Create' : 'Edit'} Notification Template
            </DialogTitle>
            <DialogDescription>
              {modalType === 'create'
                ? 'Create a new notification template for registration communications.'
                : 'Update the notification template details.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'email' | 'sms' | 'push' | 'in_app') =>
                    setFormData({ ...formData, type: value, subject: value === 'email' ? formData.subject : '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="in_app">In-App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Enter email subject"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message Body
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Enter message content. Use {placeholders} for dynamic content."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Available placeholders: {'{recipient_name}'}, {'{recipient_email}'}, {'{current_date}'}, {'{current_time}'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Template is active
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={closeModal}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={modalType === 'create' ? handleCreateTemplate : handleUpdateTemplate}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : modalType === 'create' ? 'Create Template' : 'Update Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={modalType === 'delete'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-4">
            <p className="text-sm text-red-800">
              ⚠️ This will permanently delete the notification template. Any references to this template will be broken.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTemplate}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Notification Modal */}
      <Dialog open={modalType === 'send'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send "{selectedTemplate?.name}" to a specific recipient.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Type
                </label>
                <Select
                  value={sendData.recipient_type}
                  onValueChange={(value: 'player' | 'user' | 'email') =>
                    setSendData({ ...sendData, recipient_type: value, recipient_id: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">Player</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="email">Email Address</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient
                </label>
                {sendData.recipient_type === 'email' ? (
                  <Input
                    value={sendData.recipient_id}
                    onChange={(e) => setSendData({ ...sendData, recipient_id: e.target.value })}
                    placeholder="Enter email address"
                    type="email"
                  />
                ) : (
                  <Select
                    value={sendData.recipient_id}
                    onValueChange={(value) => setSendData({ ...sendData, recipient_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${sendData.recipient_type}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {sendData.recipient_type === 'player'
                        ? players.map((player) => (
                            <SelectItem key={player.id} value={player.id.toString()}>
                              {player.full_name} ({player.email})
                            </SelectItem>
                          ))
                        : users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.full_name} ({user.email})
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {selectedTemplate && Object.keys(selectedTemplate.placeholders || {}).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Placeholders
                </label>
                <div className="space-y-2">
                  {Object.entries(selectedTemplate.placeholders || {}).map(([key, description]) => (
                    <div key={key} className="grid grid-cols-3 gap-2 items-center">
                      <span className="text-sm text-gray-600">{key}:</span>
                      <div className="col-span-2">
                        <Input
                          value={sendData.placeholders[key] || ''}
                          onChange={(e) => setSendData({
                            ...sendData,
                            placeholders: { ...sendData.placeholders, [key]: e.target.value }
                          })}
                          placeholder={description}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={generatePreview}
                disabled={!sendData.recipient_id}
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </Button>
            </div>

            {previewContent && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
                {previewContent.subject && (
                  <div className="mb-2">
                    <strong className="text-sm text-gray-600">Subject:</strong>
                    <p className="text-sm">{previewContent.subject}</p>
                  </div>
                )}
                <div>
                  <strong className="text-sm text-gray-600">Body:</strong>
                  <p className="text-sm whitespace-pre-wrap">{previewContent.body}</p>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={closeModal}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendNotification}
                disabled={isSubmitting || !sendData.recipient_id}
                className="flex-1"
              >
                {isSubmitting ? 'Sending...' : 'Send Notification'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}