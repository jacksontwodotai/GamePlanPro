import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import {
  Home,
  Shield,
  Users,
  Menu,
  LogOut,
  Calendar,
  Settings,
  FileText,
  GraduationCap,
  FormInput
} from 'lucide-react'
import { cn } from '../lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Teams',
    href: '/teams',
    icon: Shield,
  },
  {
    name: 'Players',
    href: '/players',
    icon: Users,
  },
  {
    name: 'Programs',
    href: '/programs',
    icon: GraduationCap,
  },
  {
    name: 'Forms',
    href: '/dashboard/forms',
    icon: FormInput,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
  },
  {
    name: 'Team Structure',
    href: '/structure',
    icon: Settings,
  },
  {
    name: 'Events',
    href: '/events',
    icon: Calendar,
  },
]

export default function Layout() {
  const location = useLocation()

  const NavItems = ({ className }: { className?: string }) => (
    <nav className={cn("flex flex-col space-y-1", className)}>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href ||
          location.pathname.startsWith(item.href + '/')

        return (
          <Button
            key={item.name}
            asChild
            variant="ghost"
            className={cn(
              "justify-start h-12 text-base font-medium transition-all duration-200",
              isActive
                ? "bg-orange-50 text-orange-600 border-r-4 border-orange-500 shadow-sm"
                : "text-zinc-700 hover:bg-zinc-50 hover:text-black"
            )}
          >
            <Link to={item.href}>
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          </Button>
        )
      })}
    </nav>
  )

  return (
    <div className="h-screen flex bg-zinc-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col">
        <div className="bg-white border-r border-zinc-200 shadow-xl h-full flex flex-col">
          {/* Logo Header */}
          <div className="flex items-center h-20 px-6 border-b border-zinc-100">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-black">GamePlanPro</span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
            <div className="px-6">
              <NavItems />
            </div>
          </div>

          {/* Sign Out */}
          <div className="flex-shrink-0 border-t border-zinc-100 p-6">
            <Button
              variant="ghost"
              className="w-full justify-start text-zinc-600 hover:text-black hover:bg-zinc-50 h-12 text-base"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-black">GamePlanPro</span>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-zinc-300 hover:bg-zinc-50">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-zinc-100">
                  <Link to="/dashboard" className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-black">GamePlanPro</span>
                  </Link>
                </div>

                <div className="flex-1 p-6">
                  <NavItems />
                </div>

                <div className="border-t border-zinc-100 p-6">
                  <Button variant="ghost" className="w-full justify-start text-zinc-600 hover:text-black hover:bg-zinc-50 h-12 text-base">
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pt-0 pt-20 bg-zinc-900">
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}