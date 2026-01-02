'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Gamepad2, 
  User, 
  Trophy,
  LogOut,
  Menu,
  X,
  Sparkles,
  Crown,
  Target,
  Zap,
  Settings,
  HelpCircle,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DashboardSidebarProps {
  user?: any
  onLogout?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function DashboardSidebar({ user, onLogout, collapsed = false, onToggleCollapse }: DashboardSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { 
      href: '/dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      href: '/dashboard/games', 
      label: 'My Games', 
      icon: Gamepad2,
      badge: null
    },
    { 
      href: '/dashboard/play', 
      label: 'Play', 
      icon: Trophy,
      badge: 'New'
    },
    { 
      href: '/dashboard/profile', 
      label: 'Profile', 
      icon: User,
      badge: null
    },
  ]

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-20 h-screen bg-white border-r border-gray-200 transition-all duration-300 shadow-xl",
      collapsed ? "w-20" : "w-72"
    )}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-20 items-center justify-between border-b border-gray-200 px-4 bg-gradient-to-r from-blue-50 to-purple-50">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  NexusChess
                </h2>
                <p className="text-xs text-gray-600 font-medium">Master Your Game</p>
              </div>
            </Link>
          )}
          {collapsed && (
            <div className="relative mx-auto">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn(
              "ml-auto hover:bg-white/80 rounded-xl transition-all hover:scale-105",
              collapsed && "mx-auto mt-2"
            )}
          >
            {collapsed ? (
              <Menu className="h-5 w-5 text-gray-700" />
            ) : (
              <X className="h-5 w-5 text-gray-700" />
            )}
          </Button>
        </div>

        {/* Quick Stats - Only show when not collapsed */}
        {!collapsed && user && (
          <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-gray-600">Rating</span>
                </div>
                <p className="text-xl font-bold text-blue-600">{user.rating || 1200}</p>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-3 w-3 text-orange-600" />
                  <span className="text-xs font-medium text-gray-600">Streak</span>
                </div>
                <p className="text-xl font-bold text-orange-600">0</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto pointer-events-auto">
          <div className={cn("mb-3", collapsed && "text-center")}>
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                Main Menu
              </p>
            )}
          </div>

          {/* Test Link */}
          <Link
            href="/dashboard/profile"
            className="block w-full text-center bg-red-500 text-white p-2 rounded mb-2"
            style={{ zIndex: 9999 }}
          >
            TEST LINK TO PROFILE
          </Link>

          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                  collapsed && "justify-center px-3"
                )}
                title={collapsed ? item.label : undefined}
                style={{ zIndex: 1 }}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform",
                  isActive ? "text-white scale-110" : "text-gray-600 group-hover:text-blue-600",
                  collapsed && "mx-auto"
                )} />
                
                {!collapsed && (
                  <>
                    <span className={cn(
                      "transition-all flex-1",
                      isActive && "font-semibold"
                    )}>
                      {item.label}
                    </span>
                    
                    {item.badge && (
                      <Badge className={cn(
                        "text-xs px-2 py-0.5",
                        isActive 
                          ? "bg-white/20 text-white border-white/30" 
                          : "bg-blue-100 text-blue-700 border-0"
                      )}>
                        {item.badge}
                      </Badge>
                    )}
                    
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-white shadow-lg"></div>
                    )}
                  </>
                )}
              </Link>
            )
          })}

          {/* Secondary Navigation */}
          {!collapsed && (
            <div className="pt-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">
                More
              </p>
              
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                <Settings className="h-5 w-5 text-gray-600" />
                <span>Settings</span>
              </Link>
              
              <Link
                href="/dashboard/help"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                <HelpCircle className="h-5 w-5 text-gray-600" />
                <span>Help & Support</span>
              </Link>
            </div>
          )}
        </nav>

        {/* User Section */}
        {user && (
          <div className="border-t border-gray-200 p-4 space-y-3 bg-gradient-to-br from-gray-50 to-slate-50">
            {!collapsed && (
              <>
                <div className="px-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      {user.chesscomVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                          <Crown className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.username}</p>
                      {user.chesscomUsername ? (
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          @{user.chesscomUsername}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 truncate">Connect your account</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-white rounded-lg"
                    >
                      <Bell className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">Level 1</span>
                    <span className="text-xs font-bold text-blue-600">25/100 XP</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full shadow-lg" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </>
            )}
            
            {collapsed && (
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  {user.chesscomVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                      <Crown className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all shadow-sm",
                collapsed && "px-2"
              )}
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2 font-medium">Logout</span>}
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}