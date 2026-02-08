'use client'

import * as React from 'react'
import { Card, CardContent } from './card'
import { Badge } from './badge'
import { ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
  productCount: number
  imageUrl?: string
}

interface CategoryCardProps {
  category: Category
  onClick?: (category: Category) => void
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

export function CategoryCard({
  category,
  onClick,
  variant = 'default',
  className,
}: CategoryCardProps) {
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'group cursor-pointer hover:shadow-md transition-all duration-300 overflow-hidden',
          className
        )}
        onClick={() => onClick?.(category)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {category.icon && (
              <div className="text-3xl flex-shrink-0">{category.icon}</div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {category.productCount.toLocaleString()} products
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'featured') {
    return (
      <Card
        className={cn(
          'group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden',
          className
        )}
        onClick={() => onClick?.(category)}
      >
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-6xl">{category.icon || '📦'}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Badge className="absolute top-3 right-3 bg-white/90 text-foreground hover:bg-white">
            {category.productCount.toLocaleString()}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {category.description}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden',
        className
      )}
      onClick={() => onClick?.(category)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-5xl">{category.icon || '📦'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">
            {category.name}
          </h3>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
        </div>
        {category.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {category.description}
          </p>
        )}
        <Badge variant="secondary" className="text-xs">
          {category.productCount.toLocaleString()} products
        </Badge>
      </CardContent>
    </Card>
  )
}

interface CategoryListProps {
  categories: Category[]
  onCategoryClick?: (category: Category) => void
  variant?: 'default' | 'compact' | 'featured'
  columns?: 2 | 3 | 4 | 5 | 6
  className?: string
}

export function CategoryList({
  categories,
  onCategoryClick,
  variant = 'default',
  columns = 4,
  className,
}: CategoryListProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onClick={onCategoryClick}
          variant={variant}
        />
      ))}
    </div>
  )
}
