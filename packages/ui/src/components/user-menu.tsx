'use client'

import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Button } from './button'
import { Badge } from './badge'
import {
  User,
  Settings,
  LogOut,
  Heart,
  ShoppingBag,
  Bell,
  CreditCard,
  BarChart3,
  Zap,
  Crown,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface UserMenuProps {
  user: {
    name?: string
    email?: string
    avatar?: string
    subscription?: 'free' | 'pro' | 'business'
  }
  stats?: {
    favorites: number
    alerts: number
    savings: number
  }
  onProfileClick?: () => void
  onDashboardClick?: () => void
  onFavoritesClick?: () => void
  onAlertsClick?: () => void
  onSubscriptionClick?: () => void
  onScraperClick?: () => void
  onSettingsClick?: () => void
  onLogoutClick?: () => void
  className?: string
}

export function UserMenu({
  user,
  stats,
  onProfileClick,
  onDashboardClick,
  onFavoritesClick,
  onAlertsClick,
  onSubscriptionClick,
  onScraperClick,
  onSettingsClick,
  onLogoutClick,
  className,
}: UserMenuProps) {
  const subscriptionBadge = {
    free: { label: 'Free', variant: 'secondary' as const },
    pro: { label: 'Pro', variant: 'default' as const },
    business: { label: 'Business', variant: 'default' as const },
  }

  const currentBadge = subscriptionBadge[user.subscription || 'free']

  return (
    <div className={cn('w-80 bg-background border rounded-lg shadow-lg', className)}>
      {/* User Info Header */}
      <div className="p-4 border-b bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-start gap-3">
          <Avatar className="w-14 h-14 border-2 border-background shadow-md">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{user.name || 'User'}</h3>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <Badge variant={currentBadge.variant} className="mt-2">
              {user.subscription === 'pro' || user.subscription === 'business' ? (
                <Crown className="w-3 h-3 mr-1" />
              ) : null}
              {currentBadge.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 p-4 border-b bg-muted/30">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.favorites}</p>
            <p className="text-xs text-muted-foreground">Favorites</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.alerts}</p>
            <p className="text-xs text-muted-foreground">Alerts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">€{stats.savings}</p>
            <p className="text-xs text-muted-foreground">Saved</p>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="py-2">
        <MenuItem
          icon={<User className="w-4 h-4" />}
          label="Profile"
          onClick={onProfileClick}
        />
        <MenuItem
          icon={<BarChart3 className="w-4 h-4" />}
          label="Dashboard"
          onClick={onDashboardClick}
        />
        <MenuItem
          icon={<Heart className="w-4 h-4" />}
          label="Favorites"
          badge={stats?.favorites}
          onClick={onFavoritesClick}
        />
        <MenuItem
          icon={<Bell className="w-4 h-4" />}
          label="Price Alerts"
          badge={stats?.alerts}
          onClick={onAlertsClick}
        />
        <MenuItem
          icon={<Zap className="w-4 h-4" />}
          label="Scraper Dashboard"
          onClick={onScraperClick}
        />
      </div>

      {/* Subscription Section */}
      <div className="border-t py-2">
        <MenuItem
          icon={<Crown className="w-4 h-4" />}
          label={
            user.subscription === 'free' ? 'Upgrade to Pro' : 'Manage Subscription'
          }
          onClick={onSubscriptionClick}
          className={user.subscription === 'free' ? 'text-primary font-medium' : ''}
        />
      </div>

      {/* Bottom Section */}
      <div className="border-t py-2">
        <MenuItem
          icon={<Settings className="w-4 h-4" />}
          label="Settings"
          onClick={onSettingsClick}
        />
        <MenuItem
          icon={<LogOut className="w-4 h-4" />}
          label="Logout"
          onClick={onLogoutClick}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        />
      </div>
    </div>
  )
}

interface MenuItemProps {
  icon: React.ReactNode
  label: string
  badge?: number
  onClick?: () => void
  className?: string
}

function MenuItem({ icon, label, badge, onClick, className }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted transition-colors text-left',
        className
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant="secondary" className="text-xs">
          {badge}
        </Badge>
      )}
    </button>
  )
}
