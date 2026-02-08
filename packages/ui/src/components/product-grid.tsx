'use client'

import * as React from 'react'
import { Card, CardContent, CardFooter, CardHeader } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { Heart, ShoppingCart, TrendingDown, ExternalLink } from 'lucide-react'
import { cn } from '../lib/utils'

export interface Product {
  id: string
  name: string
  brand?: string
  imageUrl?: string
  category: string
  prices: Array<{
    storeName: string
    price: number
    currency: string
    url?: string
  }>
  lowestPrice?: number
  savingsPercentage?: number
}

interface ProductGridProps {
  products: Product[]
  onProductClick?: (product: Product) => void
  onFavoriteClick?: (productId: string) => void
  onCompareClick?: (productId: string) => void
  favorites?: string[]
  compareList?: string[]
  className?: string
  columns?: 2 | 3 | 4
}

export function ProductGrid({
  products,
  onProductClick,
  onFavoriteClick,
  onCompareClick,
  favorites = [],
  compareList = [],
  className,
  columns = 3,
}: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found</p>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {products.map((product) => {
        const isFavorite = favorites.includes(product.id)
        const isComparing = compareList.includes(product.id)
        const lowestPrice = product.lowestPrice || Math.min(...product.prices.map((p) => p.price))
        const bestPriceStore = product.prices.find((p) => p.price === lowestPrice)

        return (
          <Card
            key={product.id}
            className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => onProductClick?.(product)}
          >
            {/* Savings Badge */}
            {product.savingsPercentage && product.savingsPercentage > 5 && (
              <Badge
                className="absolute top-3 right-3 z-10 bg-red-500 hover:bg-red-600"
                variant="destructive"
              >
                <TrendingDown className="w-3 h-3 mr-1" />
                {product.savingsPercentage}% OFF
              </Badge>
            )}

            {/* Image */}
            <CardHeader className="p-0">
              <div className="relative aspect-square overflow-hidden bg-muted">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <ShoppingCart className="w-16 h-16" />
                  </div>
                )}

                {/* Quick Actions Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      onFavoriteClick?.(product.id)
                    }}
                    className={cn(
                      'rounded-full',
                      isFavorite && 'text-red-500 bg-red-100 hover:bg-red-200'
                    )}
                  >
                    <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCompareClick?.(product.id)
                    }}
                    className={cn(
                      'rounded-full',
                      isComparing && 'bg-blue-100 hover:bg-blue-200'
                    )}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Content */}
            <CardContent className="p-4">
              {/* Category & Brand */}
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
                {product.brand && (
                  <span className="text-xs text-muted-foreground">{product.brand}</span>
                )}
              </div>

              {/* Product Name */}
              <h3 className="font-semibold text-sm line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                {product.name}
              </h3>

              {/* Price Info */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    €{lowestPrice.toFixed(2)}
                  </span>
                  {product.prices.length > 1 && (
                    <span className="text-xs text-muted-foreground">
                      from {product.prices.length} stores
                    </span>
                  )}
                </div>

                {bestPriceStore && (
                  <p className="text-xs text-muted-foreground">
                    Best price at {bestPriceStore.storeName}
                  </p>
                )}
              </div>
            </CardContent>

            {/* Footer */}
            <CardFooter className="p-4 pt-0">
              <Button
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(bestPriceStore?.url, '_blank')
                }}
              >
                View Details
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
