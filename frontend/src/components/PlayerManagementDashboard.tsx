import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, Edit, Trash2 } from 'lucide-react'
import PlayerListComponent from './PlayerListComponent'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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

export default function PlayerManagementDashboard() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [showPlayerDetails, setShowPlayerDetails] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player)
    setShowPlayerDetails(true)
  }

  const handlePlayerEdit = (player: Player) => {
    setSelectedPlayer(player)
    setShowEditForm(true)
  }

  const handlePlayerCreate = () => {
    setSelectedPlayer(null)
    setShowCreateForm(true)
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
          className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-gradient-to-r from-purple-300/20 to-purple-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="glass-card glass-card-hover p-8 flex items-center justify-between"
        >
          <div>
            <motion.h1
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 100,
                delay: 0.1
              }}
              className="text-5xl font-black mb-2"
            >
              <span className="gradient-text">Player Management</span>
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-400 text-lg"
            >
              Enhanced player list with advanced filtering and pagination
            </motion.p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.button
              onClick={handlePlayerCreate}
              className="button-primary"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Add New Player</span>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Enhanced Player List Component */}
        <motion.div variants={containerVariants}>
          <PlayerListComponent
            onPlayerSelect={handlePlayerSelect}
            onPlayerEdit={handlePlayerEdit}
            onPlayerCreate={handlePlayerCreate}
            allowDelete={true}
            allowEdit={true}
            showCreateButton={false} // We have our own create button in the header
          />
        </motion.div>
      </div>

      {/* Player Details Modal */}
      <Dialog open={showPlayerDetails} onOpenChange={setShowPlayerDetails}>
        <DialogContent className="glass-card glass-card-hover max-w-2xl">
          <DialogHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg glow-border">
                <span className="text-white font-bold text-xl">
                  {selectedPlayer?.first_name.charAt(0)}{selectedPlayer?.last_name.charAt(0)}
                </span>
              </div>
            </div>
            <DialogTitle className="gradient-text text-3xl font-bold">
              {selectedPlayer?.first_name} {selectedPlayer?.last_name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Player Profile Details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Organization</label>
                  <p className="text-foreground">{selectedPlayer?.organization || 'Not specified'}</p>
                </div>
                {selectedPlayer?.email && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-foreground">{selectedPlayer.email}</p>
                  </div>
                )}
                {selectedPlayer?.phone && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-foreground">{selectedPlayer.phone}</p>
                  </div>
                )}
                {selectedPlayer?.date_of_birth && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p className="text-foreground">
                      {new Date(selectedPlayer.date_of_birth).toLocaleDateString()}
                      <span className="text-sm text-muted-foreground ml-2">
                        (Age: {calculateAge(selectedPlayer.date_of_birth)})
                      </span>
                    </p>
                  </div>
                )}
                {selectedPlayer?.address && (
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="text-foreground">{selectedPlayer.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            {(selectedPlayer?.emergency_contact_name || selectedPlayer?.emergency_contact_phone) && (
              <div className="space-y-4 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedPlayer?.emergency_contact_name && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Contact Name</label>
                      <p className="text-foreground">{selectedPlayer.emergency_contact_name}</p>
                    </div>
                  )}
                  {selectedPlayer?.emergency_contact_phone && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Contact Phone</label>
                      <p className="text-foreground">{selectedPlayer.emergency_contact_phone}</p>
                    </div>
                  )}
                  {selectedPlayer?.emergency_contact_relation && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                      <p className="text-foreground">{selectedPlayer.emergency_contact_relation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Medical Information */}
            {selectedPlayer?.medical_alerts && (
              <div className="space-y-4 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  Medical Information
                </h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
                  <p className="text-foreground">{selectedPlayer.medical_alerts}</p>
                </div>
              </div>
            )}

            {/* Account Information */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Account Information
              </h3>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                <p className="text-foreground">
                  {new Date(selectedPlayer?.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-border">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPlayerDetails(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowPlayerDetails(false)
                if (selectedPlayer) {
                  handlePlayerEdit(selectedPlayer)
                }
              }}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Player
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Placeholder for Create/Edit Forms */}
      {(showCreateForm || showEditForm) && (
        <Dialog open={showCreateForm || showEditForm} onOpenChange={() => {
          setShowCreateForm(false)
          setShowEditForm(false)
        }}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>
                {showCreateForm ? 'Create New Player' : 'Edit Player'}
              </DialogTitle>
              <DialogDescription>
                {showCreateForm
                  ? 'Form to create a new player would go here'
                  : `Form to edit ${selectedPlayer?.first_name} ${selectedPlayer?.last_name} would go here`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <p className="text-center text-gray-500">
                Player form component integration goes here
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  )
}