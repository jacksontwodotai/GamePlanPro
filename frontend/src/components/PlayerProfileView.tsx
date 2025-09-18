import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  Users,
  Phone,
  Mail,
  Calendar,
  MapPin,
  AlertTriangle,
  Shield,
  Clock,
  User,
  Heart,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useApi } from '../hooks/useApi'

interface Player {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  organization: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relation?: string
  medical_alerts?: string
  address?: string
  created_at: string
}

interface UserPermissions {
  canViewMedicalInfo: boolean
  canEditPlayer: boolean
  role: 'admin' | 'coach' | 'viewer'
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

const PlayerProfileView = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: player, loading, error, execute } = useApi<Player>()
  const [showMedicalInfo, setShowMedicalInfo] = useState(false)
  const [userPermissions] = useState<UserPermissions>({
    canViewMedicalInfo: true, // In real app, this would come from auth context
    canEditPlayer: true,
    role: 'admin'
  })

  useEffect(() => {
    if (id) {
      fetchPlayer(id)
    }
  }, [id])

  const fetchPlayer = async (playerId: string) => {
    try {
      await execute(`/api/players/${playerId}`)
    } catch (err) {
      console.error('Failed to fetch player:', err)
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleEdit = () => {
    if (player?.id) {
      navigate(`/players/edit/${player.id}`)
    }
  }

  const handleBackToList = () => {
    navigate('/players/list')
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 100, -100, 0],
              y: [0, -100, 100, 0],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-r from-blue-200/20 to-blue-400/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full"
          />
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Loading Player Profile</h3>
            <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch the player information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 100, -100, 0],
              y: [0, -100, 100, 0],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-r from-red-200/20 to-red-400/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card glass-card-hover p-8 text-center"
          >
            <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Player Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error.includes('404')
                ? 'The requested player profile could not be found. It may have been deleted or the ID is incorrect.'
                : `Failed to load player profile: ${error}`
              }
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={handleBackToList}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Player List
              </Button>
              {id && (
                <Button
                  onClick={() => fetchPlayer(id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try Again
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card glass-card-hover p-8 text-center"
          >
            <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Player Data</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No player information is available at this time.
            </p>
            <Button
              variant="outline"
              onClick={handleBackToList}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Player List
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="min-h-screen relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, -100, 0],
            y: [0, -100, 100, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-r from-blue-200/20 to-blue-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 150, 0],
            y: [0, 150, -150, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-gradient-to-r from-green-300/20 to-green-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Section */}
        <motion.div
          variants={itemVariants}
          className="glass-card glass-card-hover p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleBackToList}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Players
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {player.first_name} {player.last_name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">{player.organization}</p>
                </div>
              </div>
            </div>
            {userPermissions.canEditPlayer && (
              <Button
                onClick={handleEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Player
              </Button>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Personal Information Card */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card glass-card-hover glow-border">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">First Name</label>
                    <p className="text-gray-900 dark:text-white font-medium">{player.first_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Name</label>
                    <p className="text-gray-900 dark:text-white font-medium">{player.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Organization</label>
                    <p className="text-gray-900 dark:text-white font-medium">{player.organization}</p>
                  </div>
                  {player.date_of_birth && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {calculateAge(player.date_of_birth)} years old
                      </p>
                    </div>
                  )}
                </div>

                {player.date_of_birth && (
                  <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Date of Birth
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formatDate(player.date_of_birth)}
                    </p>
                  </div>
                )}

                {player.address && (
                  <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Address
                    </label>
                    <p className="text-gray-900 dark:text-white">{player.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Information Card */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card glass-card-hover glow-border">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Phone className="h-5 w-5 mr-2 text-green-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {player.email ? (
                  <div className="flex items-center p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white">{player.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg text-gray-500">
                    <Mail className="h-5 w-5 mr-3" />
                    <span>No email address provided</span>
                  </div>
                )}

                {player.phone ? (
                  <div className="flex items-center p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                    <Phone className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                      <p className="text-gray-900 dark:text-white">{player.phone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg text-gray-500">
                    <Phone className="h-5 w-5 mr-3" />
                    <span>No phone number provided</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Emergency Contact Card */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card glass-card-hover glow-border">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Heart className="h-5 w-5 mr-2 text-red-600" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                {player.emergency_contact_name || player.emergency_contact_phone ? (
                  <div className="space-y-4">
                    {player.emergency_contact_name && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Name</label>
                        <p className="text-gray-900 dark:text-white font-medium">{player.emergency_contact_name}</p>
                      </div>
                    )}
                    {player.emergency_contact_phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Phone</label>
                        <p className="text-gray-900 dark:text-white font-medium">{player.emergency_contact_phone}</p>
                      </div>
                    )}
                    {player.emergency_contact_relation && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Relationship</label>
                        <p className="text-gray-900 dark:text-white font-medium">{player.emergency_contact_relation}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No emergency contact information provided</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Medical Information Card - With Security Controls */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card glass-card-hover glow-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-orange-600" />
                    Medical Information
                  </div>
                  {userPermissions.canViewMedicalInfo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMedicalInfo(!showMedicalInfo)}
                      className="text-sm"
                    >
                      {showMedicalInfo ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Show
                        </>
                      )}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!userPermissions.canViewMedicalInfo ? (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                    <div className="flex items-center text-red-700 dark:text-red-400">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      <div>
                        <p className="font-medium">Access Restricted</p>
                        <p className="text-sm">You do not have permission to view medical information.</p>
                      </div>
                    </div>
                  </div>
                ) : !showMedicalInfo ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg">
                    <div className="flex items-center text-yellow-700 dark:text-yellow-400">
                      <Shield className="h-5 w-5 mr-2" />
                      <div>
                        <p className="font-medium">Protected Information</p>
                        <p className="text-sm">Click "Show" to view sensitive medical information.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {player.medical_alerts ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                            <div className="flex items-start">
                              <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-red-900 dark:text-red-100">Medical Alerts</p>
                                <p className="text-red-800 dark:text-red-200 mt-1">{player.medical_alerts}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                            <Shield className="h-3 w-3 inline mr-1" />
                            This information is confidential and should only be accessed by authorized personnel.
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No medical alerts or conditions reported</p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Account Information Card */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card glass-card-hover glow-border">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Clock className="h-5 w-5 mr-2 text-purple-600" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Player ID</label>
                  <p className="text-gray-900 dark:text-white font-mono">{player.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Registration Date</label>
                  <p className="text-gray-900 dark:text-white">{formatDate(player.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center space-x-4 pt-6"
        >
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="flex items-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Back to Player List
          </Button>
          {userPermissions.canEditPlayer && (
            <Button
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Player Profile
            </Button>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default PlayerProfileView