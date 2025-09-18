import { Link } from 'react-router-dom'
import { Settings, Users, Award, ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

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
    color: 'bg-blue-500',
    stats: 'Configure team groupings'
  },
  {
    title: 'Age Groups',
    description: 'Define age-based categories and player eligibility ranges',
    icon: Users,
    href: '/structure/age-groups',
    color: 'bg-green-500',
    stats: 'Manage player categories'
  },
  {
    title: 'Skill Levels',
    description: 'Set up skill-based tiers and competitive levels for teams',
    icon: Award,
    href: '/structure/skill-levels',
    color: 'bg-purple-500',
    stats: 'Define competition tiers'
  }
]

export default function TeamStructureDashboard() {
  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <Card className="border-zinc-200 shadow-xl bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Team Structure Management</h1>
              <p className="text-sm text-zinc-600 mt-1">
                Configure divisions, age groups, and skill levels
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {structureCards.map((card) => {
          const IconComponent = card.icon
          return (
            <Card key={card.title} className="border-zinc-200 shadow-xl bg-white p-6 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <IconComponent className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">{card.title}</h3>
                  <p className="text-sm text-zinc-500">{card.stats}</p>
                </div>
              </div>

              <p className="text-zinc-600 mb-6 leading-relaxed">
                {card.description}
              </p>

              <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <Link to={card.href} className="flex items-center justify-center">
                  <span>Manage {card.title}</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </Card>
          )
        })}
      </div>

      {/* Getting Started Section */}
      <Card className="border-zinc-200 shadow-xl bg-white p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">
            Getting Started
          </h2>
          <p className="text-zinc-600 mb-6 max-w-3xl mx-auto">
            Set up your team structure by configuring divisions, age groups, and skill levels.
            This foundation will help organize your teams and streamline management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline" className="flex items-center border-zinc-300 hover:bg-zinc-50">
              <Link to="/structure/divisions">
                <Settings className="h-4 w-4 mr-2" />
                Start with Divisions
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex items-center border-zinc-300 hover:bg-zinc-50">
              <Link to="/structure/age-groups">
                <Users className="h-4 w-4 mr-2" />
                Configure Age Groups
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex items-center border-zinc-300 hover:bg-zinc-50">
              <Link to="/structure/skill-levels">
                <Award className="h-4 w-4 mr-2" />
                Set Skill Levels
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}