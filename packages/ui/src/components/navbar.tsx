'use client'

import * as React from 'react'
import { Button } from './button'
import { Badge } from './badge'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  User,
  Settings,
  LogOut,
  TrendingUp,
  Zap,
  BarChart3,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface NavbarProps {
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
  onLogoClick?: () => void
  onSearchClick?: () => void
  onCartClick?: () => void
  onFavoritesClick?: () => void
  onLoginClick?: () => void
  onLogoutClick?: () => void
  onProfileClick?: () => void
  onDashboardClick?: () => void
  onScraperClick?: () => void
  cartCount?: number
  favoritesCount?: number
  className?: string
}

export function Navbar({
  user,
  onLogoClick,
  onSearchClick,
  onCartClick,
  onFavoritesClick,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
  onDashboardClick,
  onScraperClick,
  cartCount = 0,
  favoritesCount = 0,
  className,
}: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [showMobileMenu, setShowMobileMenu] = React.useState(false)

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={onLogoClick}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <ShoppingBag className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold">PriceHunt</h1>
              <p className="text-xs text-muted-foreground">Find Best Deals</p>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <div
              className="relative w-full cursor-pointer"
              onClick={onSearchClick}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for products, categories, brands..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border bg-muted/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                readOnly
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onSearchClick}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Favorites */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onFavoritesClick}
            >
              <Heart className="w-5 h-5" />
              {favoritesCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {favoritesCount > 9 ? '9+' : favoritesCount}
                </Badge>
              )}
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onCartClick}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  className="gap-2 hidden sm:flex"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:block">{user.name || 'User'}</span>
                </Button>

                {/* Mobile Avatar */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-background border rounded-lg shadow-lg py-2 z-50">
                      <div className="px-4 py-3 border-b">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="py-2">
                        <button
                          className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3"
                          onClick={() => {
                            onProfileClick?.()
                            setShowUserMenu(false)
                          }}
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3"
                          onClick={() => {
                            onDashboardClick?.()
                            setShowUserMenu(false)
                          }}
                        >
                          <BarChart3 className="w-4 h-4" />
                          Dashboard
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3"
                          onClick={() => {
                            onScraperClick?.()
                            setShowUserMenu(false)
                          }}
                        >
                          <Zap className="w-4 h-4" />
                          Scraper
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3"
                          onClick={() => {
                            setShowUserMenu(false)
                          }}
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
                      </div>
                      <div className="border-t pt-2">
                        <button
                          className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3 text-red-600"
                          onClick={() => {
                            onLogoutClick?.()
                            setShowUserMenu(false)
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button onClick={onLoginClick}>
                <User className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}

            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-background border-b shadow-lg z-50 lg:hidden">
            <div className="container mx-auto px-4 py-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onDashboardClick?.()
                  setShowMobileMenu(false)
                }}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Deals
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setShowMobileMenu(false)
                }}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Categories
              </Button>
            </div>
          </div>
        </>
      )}
    </nav>
  )
}
