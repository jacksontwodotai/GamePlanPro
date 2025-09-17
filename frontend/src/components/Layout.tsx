import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import {
  Home,
  Shield,
  Users,
  Menu,
  LogOut
} from 'lucide-react'
import { cn } from '../lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
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
]

export default function Layout() {
  const location = useLocation()

  const NavItems = ({ className }: { className?: string }) => (
    <nav className={cn("flex flex-col space-y-2", className)}>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href ||
          (item.href !== '/' && location.pathname.startsWith(item.href))

        return (
          <Button
            key={item.name}
            asChild
            variant={isActive ? "default" : "ghost"}
            className={cn(
              "justify-start",
              isActive && "bg-primary text-primary-foreground"
            )}
          >
            <Link to={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </Link>
          </Button>
        )
      })}
    </nav>
  )

  return (
    <div className="dashboard-container">
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8" style={{color: '#171717'}} />
            <span className="text-xl font-bold">GamePlanPro</span>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col h-full">
                <div className="py-4">
                  <Link to="/" className="flex items-center space-x-2">
                    <Shield className="h-8 w-8" style={{color: '#171717'}} />
                    <span className="text-xl font-bold">GamePlanPro</span>
                  </Link>
                </div>

                <NavItems className="flex-1" />

                <div className="border-t pt-4">
                  <Button variant="ghost" className="w-full justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="sidebar flex flex-col flex-1 min-h-0">
            <div className="flex items-center h-16 px-4 border-b">
              <Link to="/" className="flex items-center space-x-2">
                <Shield className="h-8 w-8" style={{color: '#171717'}} />
                <span className="text-xl font-bold">GamePlanPro</span>
              </Link>
            </div>

            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="px-3">
                <NavItems />
              </div>
            </div>

            <div className="flex-shrink-0 border-t p-4">
              <Button variant="ghost" className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-64" style={{display: 'flex', flexDirection: 'column', flex: 1}}>
          <main style={{flex: 1}}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}