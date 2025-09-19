import { Link } from 'react-router-dom'
import { Settings, Users, Award, ArrowRight, Sparkles, CheckCircle, Circle, Play } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface StructureCard {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
  stats?: string
}

interface ProgressStatus {
  divisions: boolean
  ageGroups: boolean
  skillLevels: boolean
}

const structureCards: StructureCard[] = [
  {
    title: 'Divisions',
    description: 'Manage organizational divisions and competition categories for teams',
    icon: Settings,
    href: '/structure/divisions',
    color: 'from-gray-600 to-gray-800',
    stats: 'Configure team groupings'
  },
  {
    title: 'Age Groups',
    description: 'Define age-based categories and player eligibility ranges',
    icon: Users,
    href: '/structure/age-groups',
    color: 'from-gray-700 to-gray-900',
    stats: 'Manage player categories'
  },
  {
    title: 'Skill Levels',
    description: 'Set up skill-based tiers and competitive levels for teams',
    icon: Award,
    href: '/structure/skill-levels',
    color: 'from-gray-800 to-black',
    stats: 'Define competition tiers'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
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

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25
    }
  }
} as const

export default function TeamStructureDashboard() {
  const [progress, setProgress] = useState<ProgressStatus>({
    divisions: false,
    ageGroups: false,
    skillLevels: false
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkProgress()
  }, [])

  const checkProgress = async () => {
    try {
      setLoading(true)

      // Check divisions
      const divisionsResponse = await fetch('/api/structure/divisions?limit=1')
      const divisionsData = divisionsResponse.ok ? await divisionsResponse.json() : { divisions: [] }
      const hasDivisions = (divisionsData.divisions || []).length > 0

      // Check age groups
      const ageGroupsResponse = await fetch('/api/structure/age-groups?limit=1')
      const ageGroupsData = ageGroupsResponse.ok ? await ageGroupsResponse.json() : { ageGroups: [] }
      const hasAgeGroups = (ageGroupsData.ageGroups || []).length > 0

      // Check skill levels
      const skillLevelsResponse = await fetch('/api/structure/skill-levels?limit=1')
      const skillLevelsData = skillLevelsResponse.ok ? await skillLevelsResponse.json() : { skillLevels: [] }
      const hasSkillLevels = (skillLevelsData.skillLevels || []).length > 0

      setProgress({
        divisions: hasDivisions,
        ageGroups: hasAgeGroups,
        skillLevels: hasSkillLevels
      })
    } catch (error) {
      console.log('Progress check failed, defaulting to incomplete:', error)
      // Default to incomplete if API calls fail
      setProgress({
        divisions: false,
        ageGroups: false,
        skillLevels: false
      })
    } finally {
      setLoading(false)
    }
  }

  const getTotalProgress = () => {
    const completed = Object.values(progress).filter(Boolean).length
    return Math.round((completed / Object.keys(progress).length) * 100)
  }

  const getNextStep = () => {
    if (!progress.divisions) return { step: 'divisions', text: 'Start with Divisions', href: '/structure/divisions' }
    if (!progress.ageGroups) return { step: 'ageGroups', text: 'Configure Age Groups', href: '/structure/age-groups' }
    if (!progress.skillLevels) return { step: 'skillLevels', text: 'Set Skill Levels', href: '/structure/skill-levels' }
    return { step: 'complete', text: 'Setup Complete!', href: '/structure' }
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
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-gray-200/20 to-gray-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-gray-300/20 to-gray-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Dashboard Header */}
        <motion.div
          variants={itemVariants}
          className="glass-card glass-card-hover p-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Settings className="h-7 w-7 text-white" />
              </motion.div>
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
                  <span className="gradient-text">Team Structure</span>
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 dark:text-gray-400 text-lg"
                >
                  Configure divisions, age groups, and skill levels
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Cards */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {structureCards.map((card, index) => {
            const IconComponent = card.icon
            const isCompleted = card.title === 'Divisions' ? progress.divisions :
                               card.title === 'Age Groups' ? progress.ageGroups :
                               card.title === 'Skill Levels' ? progress.skillLevels : false

            return (
              <motion.div
                key={card.title}
                variants={itemVariants}
                whileHover="hover"
                initial="rest"
                animate="rest"
                custom={index}
                className="relative group"
              >
                <Link to={card.href}>
                  <motion.div
                    variants={cardHoverVariants}
                    className={`glass-card glass-card-hover p-6 h-full relative overflow-hidden glow-border cursor-pointer ${
                      isCompleted ? 'ring-2 ring-green-500/30' : ''
                    }`}
                  >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

                    {/* Completion Badge */}
                    <div className="absolute top-4 right-4 z-20">
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                        >
                          <CheckCircle className="w-4 h-4 text-white" />
                        </motion.div>
                      ) : (
                        <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                          <Circle className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                        </div>
                      )}
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center space-x-4 mb-4">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg`}
                        >
                          <IconComponent className="h-7 w-7 text-white" />
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{card.title}</h3>
                            {isCompleted && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Complete
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{card.stats}</p>
                        </div>
                        <motion.div
                          animate={{
                            rotate: [0, 5, -5, 0],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.2
                          }}
                          className="text-gray-400"
                        >
                          <Sparkles className="w-4 h-4" />
                        </motion.div>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                        {card.description}
                      </p>

                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full"
                      >
                        <div className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all ${
                          isCompleted
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'button-primary'
                        }`}>
                          <span>{isCompleted ? 'Manage' : 'Set Up'} {card.title}</span>
                          <motion.div
                            animate={{ x: [0, 3, 0] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="ml-2"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </motion.div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </motion.div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Getting Started Section */}
        <motion.div
          variants={itemVariants}
          className="glass-card glass-card-hover p-8"
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <motion.h2
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  delay: 0.4
                }}
                className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
              >
                Setup Progress
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 dark:text-gray-400 mb-6"
              >
                Complete your team structure setup to get the most out of GamePlanPro
              </motion.p>

              {/* Progress Bar */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getTotalProgress()}%` }}
                  transition={{ delay: 1, duration: 1 }}
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full flex items-center justify-end pr-2"
                >
                  {getTotalProgress() > 15 && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2 }}
                      className="text-xs text-white font-bold"
                    >
                      {getTotalProgress()}%
                    </motion.span>
                  )}
                </motion.div>
              </motion.div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getTotalProgress() === 100 ? 'Setup Complete!' : `${getTotalProgress()}% Complete`}
              </p>
            </div>

            {/* Setup Steps */}
            <div className="space-y-4">
              {[
                {
                  icon: Settings,
                  text: 'Set Up Divisions',
                  href: '/structure/divisions',
                  completed: progress.divisions,
                  step: 1,
                  description: 'Organize teams into competitive divisions'
                },
                {
                  icon: Users,
                  text: 'Configure Age Groups',
                  href: '/structure/age-groups',
                  completed: progress.ageGroups,
                  step: 2,
                  description: 'Define age-based player categories'
                },
                {
                  icon: Award,
                  text: 'Set Skill Levels',
                  href: '/structure/skill-levels',
                  completed: progress.skillLevels,
                  step: 3,
                  description: 'Create skill-based tiers for teams'
                }
              ].map((step, index) => {
                const isNext = getNextStep().step === (step.text.includes('Divisions') ? 'divisions' :
                                                       step.text.includes('Age') ? 'ageGroups' : 'skillLevels')

                return (
                  <motion.div
                    key={step.text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className={`flex items-center p-4 rounded-lg border transition-all ${
                      step.completed
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : isNext
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-2 ring-blue-500/30'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center flex-1 space-x-4">
                      {/* Step Number / Completion Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        step.completed
                          ? 'bg-green-500 text-white'
                          : isNext
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <span>{step.step}</span>
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <step.icon className={`w-5 h-5 ${
                            step.completed
                              ? 'text-green-600'
                              : isNext
                              ? 'text-blue-600'
                              : 'text-gray-500'
                          }`} />
                          <h3 className={`font-semibold ${
                            step.completed
                              ? 'text-green-900 dark:text-green-100'
                              : isNext
                              ? 'text-blue-900 dark:text-blue-100'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {step.text}
                          </h3>
                          {step.completed && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Complete
                            </span>
                          )}
                          {isNext && !step.completed && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Next Step
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${
                          step.completed
                            ? 'text-green-700 dark:text-green-300'
                            : isNext
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {step.description}
                        </p>
                      </div>

                      {/* Action Button */}
                      <Link to={step.href}>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant={step.completed ? 'outline' : isNext ? 'default' : 'ghost'}
                            size="sm"
                            className={`flex items-center ${
                              step.completed
                                ? 'border-green-300 text-green-700 hover:bg-green-100'
                                : isNext
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {step.completed ? (
                              <>
                                <Settings className="w-4 h-4 mr-2" />
                                Manage
                              </>
                            ) : isNext ? (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Start
                              </>
                            ) : (
                              <>
                                <Circle className="w-4 h-4 mr-2" />
                                Setup
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Next Step Recommendation */}
            {getTotalProgress() < 100 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                        {getNextStep().text}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Continue setting up your team structure
                      </p>
                    </div>
                  </div>
                  <Link to={getNextStep().href}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Continue Setup
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Completion Message */}
            {getTotalProgress() === 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, type: "spring", stiffness: 100 }}
                className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
                  Setup Complete! 🎉
                </h3>
                <p className="text-green-700 dark:text-green-300 mb-4">
                  Your team structure is ready. You can now start managing teams and players.
                </p>
                <Link to="/teams">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Start Managing Teams
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}