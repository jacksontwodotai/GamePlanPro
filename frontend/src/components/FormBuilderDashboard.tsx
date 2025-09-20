import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  FileText,
  BarChart3,
  Clock,
  Activity,
  TrendingUp,
  Settings
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useApi } from '../hooks/useApi'
import FormList from './FormList'

interface DashboardStats {
  totalForms: number
  activeForms: number
  recentActivity: number
  publishedForms: number
}

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
      staggerChildren: 0.1,
      delayChildren: 0.2
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

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
}

export default function FormBuilderDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalForms: 0,
    activeForms: 0,
    recentActivity: 0,
    publishedForms: 0
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { loading: statsLoading, error: statsError, execute } = useApi()

  // Get auth token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    loadDashboardStats()
  }, [refreshTrigger])

  const loadDashboardStats = async () => {
    try {
      const response = await execute('/api/form-builder/forms', {
        method: 'GET',
        headers: getAuthHeaders()
      })

      const forms: RegistrationForm[] = response.forms || []

      // Calculate statistics
      const totalForms = forms.length
      const activeForms = forms.filter(form => form.is_active).length
      const publishedForms = forms.filter(form => form.is_published).length

      // Calculate recent activity (forms created or updated in last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const recentActivity = forms.filter(form => {
        const createdDate = new Date(form.created_at)
        const updatedDate = new Date(form.updated_at)
        return createdDate > weekAgo || updatedDate > weekAgo
      }).length

      setStats({
        totalForms,
        activeForms,
        recentActivity,
        publishedForms
      })
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
    }
  }

  const handleFormsChange = () => {
    // Trigger stats refresh when forms are modified
    setRefreshTrigger(prev => prev + 1)
  }

  const statsCards = [
    {
      title: 'Total Forms',
      value: stats.totalForms,
      icon: FileText,
      gradient: 'from-blue-500 to-blue-700',
      description: 'All registration forms'
    },
    {
      title: 'Active Forms',
      value: stats.activeForms,
      icon: Activity,
      gradient: 'from-green-500 to-green-700',
      description: 'Currently active forms'
    },
    {
      title: 'Published Forms',
      value: stats.publishedForms,
      icon: TrendingUp,
      gradient: 'from-purple-500 to-purple-700',
      description: 'Available for registration'
    },
    {
      title: 'Recent Activity',
      value: stats.recentActivity,
      icon: Clock,
      gradient: 'from-orange-500 to-orange-700',
      description: 'Forms updated this week'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Form Builder Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Manage registration forms and monitor form performance
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4 lg:mt-0">
              <Link to="/dashboard/forms/new">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Form
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                variants={cardHoverVariants}
                initial="rest"
                whileHover="hover"
                className="group"
              >
                <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg border-0 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-full bg-gradient-to-r ${stat.gradient}`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {statsLoading ? '...' : stat.value}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Error Message */}
        {statsError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
          >
            {statsError}
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common form management tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/dashboard/forms/new">
                  <Button className="w-full justify-start h-12" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Form
                  </Button>
                </Link>
                <Button
                  className="w-full justify-start h-12"
                  variant="outline"
                  onClick={() => handleFormsChange()}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Refresh Statistics
                </Button>
                <Button className="w-full justify-start h-12" variant="outline" asChild>
                  <Link to="/dashboard/programs">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Programs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Forms List */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Registration Forms</CardTitle>
              <CardDescription>
                View and manage all registration forms
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <FormList onFormsChange={handleFormsChange} />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}