import { Link } from 'react-router-dom'
import { Settings, Users, Award, ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

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

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.03,
    y: -8,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25
    }
  }
} as const

interface StructureCard {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  gradient: string
  stats?: string
}

const structureCards: StructureCard[] = [
  {
    title: 'Divisions',
    description: 'Manage organizational divisions and competition categories for teams',
    icon: Settings,
    href: '/structure/divisions',
    gradient: 'from-blue-600 to-blue-800',
    stats: 'Configure team groupings'
  },
  {
    title: 'Age Groups',
    description: 'Define age-based categories and player eligibility ranges',
    icon: Users,
    href: '/structure/age-groups',
    gradient: 'from-green-600 to-green-800',
    stats: 'Manage player categories'
  },
  {
    title: 'Skill Levels',
    description: 'Set up skill-based tiers and competitive levels for teams',
    icon: Award,
    href: '/structure/skill-levels',
    gradient: 'from-purple-600 to-purple-800',
    stats: 'Define competition tiers'
  }
]

export default function TeamStructureDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="mr-3"
            >
              <Sparkles className="h-8 w-8 text-blue-600" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Team Structure Management
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Configure and manage the organizational structure of your sports program.
            Set up divisions, age groups, and skill levels to organize teams effectively.
          </p>
        </motion.div>

        {/* Navigation Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {structureCards.map((card) => {
            const IconComponent = card.icon
            return (
              <motion.div
                key={card.title}
                variants={itemVariants}
                initial="rest"
                whileHover="hover"
                className="relative group"
              >
                <motion.div
                  variants={cardHoverVariants}
                  className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 h-full"
                >
                  {/* Gradient Background */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                    card.gradient
                  )} />

                  {/* Card Content */}
                  <div className="relative p-8">
                    {/* Icon */}
                    <motion.div
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={cn(
                        "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br mb-6",
                        card.gradient
                      )}
                    >
                      <IconComponent className="h-8 w-8 text-white" />
                    </motion.div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                      {card.description}
                    </p>

                    {/* Stats */}
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      {card.stats}
                    </div>

                    {/* Action Button */}
                    <Button
                      asChild
                      className={cn(
                        "w-full group-hover:shadow-lg transition-all duration-300 bg-gradient-to-r text-white border-0",
                        card.gradient
                      )}
                    >
                      <Link to={card.href} className="flex items-center justify-center">
                        <span>Manage {card.title}</span>
                        <motion.div
                          className="ml-2"
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </motion.div>
                      </Link>
                    </Button>
                  </div>

                  {/* Hover Effect Border */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "absolute inset-0 rounded-2xl border-2 pointer-events-none",
                      `border-${card.gradient.split('-')[1]}-400`
                    )}
                    style={{
                      borderImage: `linear-gradient(135deg, ${card.gradient.includes('blue') ? '#3b82f6' : card.gradient.includes('green') ? '#10b981' : '#8b5cf6'}, transparent) 1`
                    }}
                  />
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Getting Started
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Set up your team structure by configuring divisions, age groups, and skill levels.
              This foundation will help organize your teams and streamline management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" className="flex items-center">
                <Link to="/structure/divisions">
                  <Settings className="h-4 w-4 mr-2" />
                  Start with Divisions
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex items-center">
                <Link to="/structure/age-groups">
                  <Users className="h-4 w-4 mr-2" />
                  Configure Age Groups
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex items-center">
                <Link to="/structure/skill-levels">
                  <Award className="h-4 w-4 mr-2" />
                  Set Skill Levels
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}