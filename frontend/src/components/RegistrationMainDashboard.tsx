import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  UserCheck,
  CreditCard,
  Activity,
  TrendingUp,
  Users,
  CalendarDays,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useAuth } from '../contexts/AuthContext'
import { useApi } from '../hooks/useApi'

interface DashboardStats {
  activePrograms: number
  pendingRegistrations: number
  totalPayments: number
  recentActivity: number
}

interface Program {
  id: string
  name: string
  description: string
  season: string
  base_fee: number
  status: string
}

interface Registration {
  id: string
  program_name: string
  status: string
  registration_date: string
  amount_paid: number
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

export default function RegistrationMainDashboard() {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    activePrograms: 0,
    pendingRegistrations: 0,
    totalPayments: 0,
    recentActivity: 0
  })
  const [programs, setPrograms] = useState<Program[]>([])
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([])
  const { loading, error, execute } = useApi()

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      if (isAdmin) {
        // Admin dashboard data
        const [programsRes, registrationsRes, paymentsRes] = await Promise.all([
          execute('/api/programs'),
          execute('/api/program-registrations'),
          execute('/api/payments')
        ])

        const programsData = programsRes.programs || programsRes
        const registrationsData = registrationsRes.registrations || registrationsRes
        const paymentsData = paymentsRes.payments || paymentsRes

        setStats({
          activePrograms: programsData.filter((p: Program) => p.status === 'active').length,
          pendingRegistrations: registrationsData.filter((r: any) => r.status === 'pending').length,
          totalPayments: paymentsData.length,
          recentActivity: registrationsData.filter((r: any) => {
            const regDate = new Date(r.registration_date)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return regDate > weekAgo
          }).length
        })

        setPrograms(programsData.slice(0, 6))
      } else {
        // User dashboard data
        const [programsRes, registrationsRes] = await Promise.all([
          execute('/api/programs'),
          execute(`/api/program-registrations?user_id=${user?.id}`)
        ])

        const programsData = programsRes.programs || programsRes
        const registrationsData = registrationsRes.registrations || registrationsRes

        setPrograms(programsData.filter((p: Program) => p.status === 'active').slice(0, 6))
        setUserRegistrations(registrationsData.slice(0, 5))
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const adminStatCards = [
    {
      title: 'Active Programs',
      value: stats.activePrograms,
      icon: GraduationCap,
      gradient: 'from-blue-500 to-blue-700',
      href: '/dashboard/programs'
    },
    {
      title: 'Pending Registrations',
      value: stats.pendingRegistrations,
      icon: UserCheck,
      gradient: 'from-orange-500 to-orange-700',
      href: '/dashboard/registrations'
    },
    {
      title: 'Total Payments',
      value: stats.totalPayments,
      icon: CreditCard,
      gradient: 'from-green-500 to-green-700',
      href: '/dashboard/payments'
    },
    {
      title: 'Recent Activity',
      value: stats.recentActivity,
      icon: Activity,
      gradient: 'from-purple-500 to-purple-700',
      href: '/dashboard/registrations'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-8"
        >
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isAdmin ? 'Registration Dashboard' : 'Welcome Back'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isAdmin
                  ? 'Manage programs, registrations, and payments'
                  : `Hi ${user?.firstName}, explore available programs and manage your registrations`
                }
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4 lg:mt-0">
              <Button
                variant="outline"
                onClick={fetchDashboardData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Admin Stats Cards */}
        {isAdmin && (
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {adminStatCards.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  className="group"
                >
                  <Link to={stat.href}>
                    <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg border-0 bg-white">
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className={`p-3 rounded-full bg-gradient-to-r ${stat.gradient}`}>
                            <stat.icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Programs */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  {isAdmin ? 'Recent Programs' : 'Available Programs'}
                </CardTitle>
                <CardDescription>
                  {isAdmin
                    ? 'Recently created or updated programs'
                    : 'Programs you can register for'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <AnimatePresence>
                    {programs.map((program, index) => (
                      <motion.div
                        key={program.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{program.name}</h4>
                          <p className="text-sm text-gray-600">{program.season}</p>
                          <p className="text-sm font-medium text-green-600">
                            {formatCurrency(program.base_fee)}
                          </p>
                        </div>
                        {!isAdmin && (
                          <Button size="sm" asChild>
                            <Link to={`/register?program=${program.id}`}>
                              Register
                            </Link>
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {programs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {isAdmin ? 'No programs found.' : 'No programs available for registration.'}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={isAdmin ? "/dashboard/programs" : "/programs"}>
                      {isAdmin ? 'Manage All Programs' : 'View All Programs'}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* User Registrations or Admin Quick Actions */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isAdmin ? (
                    <>
                      <Activity className="h-5 w-5" />
                      Quick Actions
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-5 w-5" />
                      My Registrations
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {isAdmin
                    ? 'Common management tasks'
                    : 'Your current program registrations'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAdmin ? (
                  <div className="space-y-3">
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link to="/dashboard/programs">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Manage Programs
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link to="/dashboard/registrations">
                        <UserCheck className="h-4 w-4 mr-2" />
                        View Registrations
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link to="/dashboard/payments">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Payment History
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link to="/dashboard/forms">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Manage Forms
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {userRegistrations.map((registration, index) => (
                        <motion.div
                          key={registration.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{registration.program_name}</h4>
                            <p className="text-sm text-gray-600">
                              Registered: {formatDate(registration.registration_date)}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                registration.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : registration.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                              </span>
                              <span className="text-sm text-gray-600">
                                Paid: {formatCurrency(registration.amount_paid)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {userRegistrations.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No registrations yet.</p>
                        <p className="text-sm">Browse programs to get started!</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}