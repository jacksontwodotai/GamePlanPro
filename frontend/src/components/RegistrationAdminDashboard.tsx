import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Users, Bell, Calendar, List, UserCheck } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import ProgramSettingsManagement from './ProgramSettingsManagement'
import WaitlistManagement from './WaitlistManagement'
import NotificationTemplateManagement from './NotificationTemplateManagement'

interface RegistrationAdminDashboardProps {
  className?: string
}

type AdminView = 'dashboard' | 'program-settings' | 'waitlist' | 'notifications'

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

export default function RegistrationAdminDashboard({ className = '' }: RegistrationAdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard')

  const adminSections = [
    {
      id: 'program-settings' as AdminView,
      title: 'Program Settings',
      description: 'Configure program capacity, registration dates, and other settings',
      icon: Settings,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'waitlist' as AdminView,
      title: 'Waitlist Management',
      description: 'Manage program waitlists and offer spots to waiting players',
      icon: List,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'notifications' as AdminView,
      title: 'Notification Templates',
      description: 'Create and manage notification templates for registration communications',
      icon: Bell,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ]

  const renderCurrentView = () => {
    switch (currentView) {
      case 'program-settings':
        return <ProgramSettingsManagement onBack={() => setCurrentView('dashboard')} />

      case 'waitlist':
        return <WaitlistManagement onBack={() => setCurrentView('dashboard')} />

      case 'notifications':
        return <NotificationTemplateManagement onBack={() => setCurrentView('dashboard')} />

      default:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Registration Administration</h1>
              <p className="text-gray-600">Manage program settings, waitlists, and notifications</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminSections.map((section) => {
                const IconComponent = section.icon
                return (
                  <motion.div key={section.id} variants={itemVariants}>
                    <Card
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${section.borderColor} border-2 hover:scale-105`}
                      onClick={() => setCurrentView(section.id)}
                    >
                      <CardHeader>
                        <div className={`w-12 h-12 ${section.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                          <IconComponent className={`h-6 w-6 ${section.color}`} />
                        </div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" className="w-full">
                          Open {section.title}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {/* Quick Stats */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Programs</p>
                        <p className="text-2xl font-bold text-gray-900">-</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                        <p className="text-2xl font-bold text-gray-900">-</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center">
                      <List className="h-8 w-8 text-orange-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Waitlist Entries</p>
                        <p className="text-2xl font-bold text-gray-900">-</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center">
                      <Bell className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Templates</p>
                        <p className="text-2xl font-bold text-gray-900">-</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {renderCurrentView()}
    </div>
  )
}