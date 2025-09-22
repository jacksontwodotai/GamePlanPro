import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History, Filter, Search, RefreshCw, Eye, Download, Calendar,
  Mail, MessageSquare, Smartphone, Monitor, CheckCircle, XCircle,
  Clock, AlertTriangle, ChevronLeft, ChevronRight, ArrowUpDown
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useApi } from '../hooks/useApi'

interface SentNotification {
  id: string
  event_id: string
  event_name: string
  recipient_user_id: number
  recipient_name: string
  recipient_email: string
  delivery_method: 'email' | 'sms' | 'push' | 'in_app'
  template_id?: string
  template_name?: string
  subject?: string
  body: string
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
  sent_at: string
  delivered_at?: string
  error_message?: string
  created_at: string
}

interface NotificationFilters {
  event_id?: string
  recipient_user_id?: number
  delivery_method?: string
  status?: string
  start_date?: string
  end_date?: string
  search?: string
}

interface PaginationInfo {
  page: number
  per_page: number
  total: number
  total_pages: number
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  sent: { label: 'Sent', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  bounced: { label: 'Bounced', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' }
}

const deliveryMethodConfig = {
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

export default function NotificationLogView() {
  const [notifications, setNotifications] = useState<SentNotification[]>([])
  const [events, setEvents] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: number; name: string; email: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<SentNotification | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Filter states
  const [filters, setFilters] = useState<NotificationFilters>({})
  const [searchTerm, setSearchTerm] = useState('')

  // Pagination states
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0
  })

  // Sort states
  const [sortField, setSortField] = useState<keyof SentNotification>('sent_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const { execute } = useApi()

  useEffect(() => {
    fetchNotifications()
    fetchEvents()
    fetchUsers()
  }, [filters, pagination.page, sortField, sortDirection])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm || undefined }))
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })

      // Add pagination
      queryParams.append('page', pagination.page.toString())
      queryParams.append('per_page', pagination.per_page.toString())

      // Add sorting
      queryParams.append('sort_by', sortField)
      queryParams.append('sort_direction', sortDirection)

      const response = await execute(`/api/schedule-communication/notifications?${queryParams.toString()}`)

      if (response) {
        setNotifications(response.notifications || [])
        setPagination({
          page: response.page || 1,
          per_page: response.per_page || 20,
          total: response.total || 0,
          total_pages: response.total_pages || 0
        })
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await execute('/api/events')
      if (response) {
        const events = Array.isArray(response) ? response : []
        setEvents(events.map((event: any) => ({ id: event.id, name: event.name })))
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await execute('/api/users')
      if (response?.users) {
        setUsers(response.users.map((user: any) => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email
        })))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleFilterChange = (key: keyof NotificationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSort = (field: keyof SentNotification) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const exportNotifications = async () => {
    try {
      const queryParams = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })

      queryParams.append('export', 'true')

      const response = await execute(`/api/schedule-communication/notifications/export?${queryParams.toString()}`)

      if (response?.download_url) {
        window.open(response.download_url, '_blank')
      }
    } catch (error) {
      console.error('Error exporting notifications:', error)
    }
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

  const getSortIcon = (field: keyof SentNotification) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    return sortDirection === 'asc' ?
      <ArrowUpDown className="h-4 w-4 text-blue-600 rotate-180" /> :
      <ArrowUpDown className="h-4 w-4 text-blue-600" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <History className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notification Log</h2>
            <p className="text-gray-600">View and manage sent notifications</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={exportNotifications}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button
            variant="outline"
            onClick={fetchNotifications}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
              <Select value={filters.event_id || ''} onValueChange={(value) => handleFilterChange('event_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
              <Select value={filters.recipient_user_id?.toString() || ''} onValueChange={(value) => handleFilterChange('recipient_user_id', value ? parseInt(value) : undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="All recipients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All recipients</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
              <Select value={filters.delivery_method || ''} onValueChange={(value) => handleFilterChange('delivery_method', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All methods</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="in_app">In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select value={filters.status || ''} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by event name, recipient name, or message content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-500">Loading notifications...</span>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No notifications found
              </h3>
              <p className="text-gray-500">
                No notifications match your current filters.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('event_name')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Event</span>
                        {getSortIcon('event_name')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('recipient_name')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Recipient</span>
                        {getSortIcon('recipient_name')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('delivery_method')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Method</span>
                        {getSortIcon('delivery_method')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Status</span>
                        {getSortIcon('status')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('sent_at')}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Sent</span>
                        {getSortIcon('sent_at')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {notifications.map((notification) => {
                      const methodConfig = deliveryMethodConfig[notification.delivery_method]
                      const statusInfo = statusConfig[notification.status]
                      const MethodIcon = methodConfig.icon
                      const StatusIcon = statusInfo.icon

                      return (
                        <motion.tr
                          key={notification.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{notification.event_name}</div>
                                <div className="text-sm text-gray-500">{notification.template_name || 'Custom Message'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{notification.recipient_name}</div>
                              <div className="text-sm text-gray-500">{notification.recipient_email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className={`p-1 rounded ${methodConfig.bg}`}>
                                <MethodIcon className={`h-4 w-4 ${methodConfig.color}`} />
                              </div>
                              <span className="text-sm font-medium">{methodConfig.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className={`p-1 rounded ${statusInfo.bg}`}>
                                <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                              </div>
                              <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(notification.sent_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedNotification(notification)
                                setShowDetails(true)
                              }}
                              className="flex items-center space-x-1"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View</span>
                            </Button>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.per_page) + 1} to {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-700">
                      Page {pagination.page} of {pagination.total_pages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.total_pages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notification Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
            <DialogDescription>
              View detailed information about this notification
            </DialogDescription>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Event</label>
                  <p className="text-sm text-gray-900">{selectedNotification.event_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Recipient</label>
                  <p className="text-sm text-gray-900">
                    {selectedNotification.recipient_name} ({selectedNotification.recipient_email})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Method</label>
                  <p className="text-sm text-gray-900">{deliveryMethodConfig[selectedNotification.delivery_method].label}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className={`text-sm font-medium ${statusConfig[selectedNotification.status].color}`}>
                    {statusConfig[selectedNotification.status].label}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sent At</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedNotification.sent_at)}</p>
                </div>
                {selectedNotification.delivered_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivered At</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedNotification.delivered_at)}</p>
                  </div>
                )}
              </div>

              {selectedNotification.subject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm">{selectedNotification.subject}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm whitespace-pre-wrap">{selectedNotification.body}</p>
                </div>
              </div>

              {selectedNotification.error_message && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Error Message</label>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800">{selectedNotification.error_message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}