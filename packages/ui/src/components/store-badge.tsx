'use client'

import * as React from 'react'
import { Badge } from './badge'
import { ExternalLink, Star } from 'lucide-react'
import { cn } from '../lib/utils'

interface Store {
  name: string
  logoUrl?: string
  rating?: number
  trustScore?: number
}

interface StoreBadgeProps {
  store: Store
  price?: number
  currency?: string
  url?: string
  availability?: boolean
  showRating?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

export function StoreBadge({
  store,
  price,
  currency = '€',
  url,
  availability = true,
  showRating = false,
  size = 'md',
  variant = 'default',
  className,
}: StoreBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs p-2',
    md: 'text-sm p-3',
    lg: 'text-base p-4',
  }

  const logoSize = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1',
          !availability && 'opacity-60',
          className
        )}
      >
        {store.logoUrl && (
          <img
            src={store.logoUrl}
            alt={store.name}
            className="w-4 h-4 object-contain"
          />
        )}
        <span className="text-xs font-medium">{store.name}</span>
        {price !== undefined && (
          <>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs font-bold">
              {currency}
              {price.toFixed(2)}
            </span>
          </>
        )}
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all',
          !availability && 'opacity-60 bg-muted/50',
          url && 'cursor-pointer hover:border-primary',
          className
        )}
        onClick={() => url && window.open(url, '_blank')}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {store.logoUrl ? (
            <img
              src={store.logoUrl}
              alt={store.name}
              className={cn('object-contain flex-shrink-0', logoSize[size])}
            />
          ) : (
            <div
              className={cn(
                'flex items-center justify-center bg-muted rounded flex-shrink-0',
                logoSize[size]
              )}
            >
              <span className="text-xs font-bold">{store.name[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{store.name}</p>
            {showRating && store.rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">
                  {store.rating.toFixed(1)}
                </span>
                {store.trustScore && (
                  <Badge variant="outline" className="text-xs ml-2">
                    Trust: {store.trustScore}%
                  </Badge>
                )}
              </div>
            )}
            {!availability && (
              <Badge variant="destructive" className="text-xs mt-1">
                Out of Stock
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {price !== undefined && (
            <div className="text-right">
              <p className="text-2xl font-bold">
                {currency}
                {price.toFixed(2)}
              </p>
            </div>
          )}
          {url && (
            <ExternalLink className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-background',
        sizeClasses[size],
        !availability && 'opacity-60',
        url && 'cursor-pointer hover:shadow-md hover:border-primary transition-all',
        className
      )}
      onClick={() => url && window.open(url, '_blank')}
    >
      {store.logoUrl ? (
        <img
          src={store.logoUrl}
          alt={store.name}
          className={cn('object-contain flex-shrink-0', logoSize[size])}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center bg-muted rounded flex-shrink-0',
            logoSize[size]
          )}
        >
          <span className="text-sm font-bold">{store.name[0]}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{store.name}</p>
        {showRating && store.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">
              {store.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      {price !== undefined && (
        <div className="flex items-center gap-2">
          <span className="font-bold whitespace-nowrap">
            {currency}
            {price.toFixed(2)}
          </span>
          {url && <ExternalLink className="w-4 h-4 text-muted-foreground" />}
        </div>
      )}
      {!availability && (
        <Badge variant="outline" className="text-xs">
          Out of Stock
        </Badge>
      )}
    </div>
  )
}
