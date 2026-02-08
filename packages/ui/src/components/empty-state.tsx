'use client'

import * as React from 'react'
import { Button } from './button'
import { 
  Search, 
  ShoppingBag, 
  Heart, 
  PackageX, 
  AlertCircle,
  FileX,
  Filter,
  TrendingUp
} from 'lucide-react'
import { cn } from '../lib/utils'

interface EmptyStateProps {
  icon?: 'search' | 'products' | 'favorites' | 'cart' | 'error' | 'file' | 'filter' | 'deals'
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const icons = {
  search: Search,
  products: ShoppingBag,
  favorites: Heart,
  cart: PackageX,
  error: AlertCircle,
  file: FileX,
  filter: Filter,
  deals: TrendingUp,
}

export function EmptyState({
  icon = 'search',
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const Icon = icons[icon]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
        <div className="relative p-6 bg-muted rounded-full">
          <Icon className="w-12 h-12 text-muted-foreground" />
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      
      {description && (
        <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button onClick={action.onClick} size="lg">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline" size="lg">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export function NoSearchResults({ 
  query, 
  onClearFilters,
  onNewSearch 
}: { 
  query?: string
  onClearFilters?: () => void
  onNewSearch?: () => void
}) {
  return (
    <EmptyState
      icon="search"
      title={query ? `No results for "${query}"` : 'No results found'}
      description="Try adjusting your search terms or filters to find what you're looking for."
      action={
        onNewSearch
          ? {
              label: 'New Search',
              onClick: onNewSearch,
            }
          : undefined
      }
      secondaryAction={
        onClearFilters
          ? {
              label: 'Clear Filters',
              onClick: onClearFilters,
            }
          : undefined
      }
    />
  )
}

export function NoProducts({ onBrowseCategories }: { onBrowseCategories?: () => void }) {
  return (
    <EmptyState
      icon="products"
      title="No products available"
      description="We couldn't find any products at the moment. Check back later or browse our categories."
      action={
        onBrowseCategories
          ? {
              label: 'Browse Categories',
              onClick: onBrowseCategories,
            }
          : undefined
      }
    />
  )
}

export function NoFavorites({ onBrowseProducts }: { onBrowseProducts?: () => void }) {
  return (
    <EmptyState
      icon="favorites"
      title="No favorites yet"
      description="Start adding products to your favorites to keep track of items you love."
      action={
        onBrowseProducts
          ? {
              label: 'Browse Products',
              onClick: onBrowseProducts,
            }
          : undefined
      }
    />
  )
}

export function EmptyCart({ onStartShopping }: { onStartShopping?: () => void }) {
  return (
    <EmptyState
      icon="cart"
      title="Your cart is empty"
      description="Looks like you haven't added any products to your cart yet."
      action={
        onStartShopping
          ? {
              label: 'Start Shopping',
              onClick: onStartShopping,
            }
          : undefined
      }
    />
  )
}

export function ErrorState({ 
  title = "Something went wrong",
  description = "We encountered an error. Please try again later.",
  onRetry 
}: { 
  title?: string
  description?: string
  onRetry?: () => void 
}) {
  return (
    <EmptyState
      icon="error"
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: 'Try Again',
              onClick: onRetry,
            }
          : undefined
      }
    />
  )
}

export function NoFilterResults({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState
      icon="filter"
      title="No products match your filters"
      description="Try removing some filters to see more results."
      action={
        onClearFilters
          ? {
              label: 'Clear All Filters',
              onClick: onClearFilters,
            }
          : undefined
      }
    />
  )
}

export function NoDeals({ onViewProducts }: { onViewProducts?: () => void }) {
  return (
    <EmptyState
      icon="deals"
      title="No deals available"
      description="Check back later for amazing deals and discounts."
      action={
        onViewProducts
          ? {
              label: 'View All Products',
              onClick: onViewProducts,
            }
          : undefined
      }
    />
  )
}
