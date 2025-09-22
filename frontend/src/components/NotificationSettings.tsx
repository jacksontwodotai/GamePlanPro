import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Save, RefreshCw, AlertCircle, CheckCircle,
  Mail, MessageSquare, Smartphone, Bell
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useApi } from '../hooks/useApi'

interface NotificationPreference {
  id: string
  user_id: number
  team_id?: number
  email_enabled: boolean
  sms_enabled: boolean
  in_app_enabled: boolean
  created_at: string
  updated_at: string
}

interface Team {
  id: number
  name: string
}

interface NotificationSettingsProps {
  userId: number
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

export default function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { execute } = useApi()

  useEffect(() => {
    fetchPreferences()
    fetchTeams()
  }, [])

  const fetchPreferences = async () => {
    setLoading(true)
    try {
      const response = await execute(`http://localhost:8000/api/users/${userId}/notification-preferences`)
      if (response?.preferences) {
        setPreferences(response.preferences)
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error)
      setMessage({ type: 'error', text: 'Failed to fetch notification preferences' })
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await execute('http://localhost:8000/api/teams')
      if (response?.teams) {
        setTeams(response.teams)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const handlePreferenceChange = (preferenceId: string, field: keyof Pick<NotificationPreference, 'email_enabled' | 'sms_enabled' | 'in_app_enabled'>, value: boolean) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.id === preferenceId
          ? { ...pref, [field]: value }
          : pref
      )
    )
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      await execute(`http://localhost:8000/api/users/${userId}/notification-preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      })

      setMessage({ type: 'success', text: 'Notification preferences saved successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save preferences' })
    } finally {
      setSaving(false)
    }
  }

  const getTeamName = (teamId?: number): string => {
    if (!teamId) return 'Global Settings'
    const team = teams.find(t => t.id === teamId)
    return team?.name || `Team ${teamId}`
  }

  const clearMessage = () => {
    setMessage(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Loading notification settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
            <p className="text-gray-600">Manage your notification preferences for teams and events</p>
          </div>
        </div>
        <Button
          onClick={savePreferences}
          disabled={saving}
          className="flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </Button>
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

      {/* Notification Preferences */}
      {preferences.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No notification preferences found
              </h3>
              <p className="text-gray-500 mb-4">
                Your notification preferences will be created automatically when you join teams.
              </p>
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
          {preferences.map((preference) => (
            <motion.div key={preference.id} variants={itemVariants}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <span>{getTeamName(preference.team_id)}</span>
                  </CardTitle>
                  <CardDescription>
                    Configure how you want to receive notifications for {getTeamName(preference.team_id).toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Email</h4>
                          <p className="text-sm text-gray-500">Receive email notifications</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preference.email_enabled}
                          onChange={(e) => handlePreferenceChange(preference.id, 'email_enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* SMS Notifications */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">SMS</h4>
                          <p className="text-sm text-gray-500">Receive text messages</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preference.sms_enabled}
                          onChange={(e) => handlePreferenceChange(preference.id, 'sms_enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* In-App Notifications */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Smartphone className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">In-App</h4>
                          <p className="text-sm text-gray-500">Receive in-app notifications</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preference.in_app_enabled}
                          onChange={(e) => handlePreferenceChange(preference.id, 'in_app_enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Last updated: {new Date(preference.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}