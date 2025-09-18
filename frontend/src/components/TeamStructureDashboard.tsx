import { Link } from 'react-router-dom'
import { Settings, Users, Award, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { motion, AnimatePresence } from 'framer-motion'

interface StructureCard {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
  stats?: string
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
                    className="glass-card glass-card-hover p-6 h-full relative overflow-hidden glow-border cursor-pointer"
                  >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

                    <div className="relative z-10">
                      <div className="flex items-center space-x-4 mb-4">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg`}
                        >
                          <IconComponent className="h-7 w-7 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{card.title}</h3>
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
                        <div className="button-primary w-full flex items-center justify-center">
                          <span>Manage {card.title}</span>
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
          <div className="text-center">
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
              Getting Started
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl mx-auto"
            >
              Set up your team structure by configuring divisions, age groups, and skill levels.
              This foundation will help organize your teams and streamline management.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {[
                { icon: Settings, text: 'Start with Divisions', href: '/structure/divisions' },
                { icon: Users, text: 'Configure Age Groups', href: '/structure/age-groups' },
                { icon: Award, text: 'Set Skill Levels', href: '/structure/skill-levels' }
              ].map((button, index) => (
                <motion.div
                  key={button.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to={button.href}>
                    <Button
                      variant="outline"
                      className="flex items-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-800/70"
                    >
                      <button.icon className="h-4 w-4 mr-2" />
                      {button.text}
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}