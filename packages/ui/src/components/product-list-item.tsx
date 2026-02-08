'use client'

import * as React from 'react'
import { Card } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { Heart, ExternalLink, TrendingDown, Store, Package } from 'lucide-react'
import { cn } from '../lib/utils'

interface Price {
  storeName: string
  price: number
  currency: string
  url?: string
  availability: boolean
}

interface Product {
  id: string
  name: string
  brand?: string
  imageUrl?: string
  category: string
  description?: string
  prices: Price[]
  lowestPrice?: number
  savingsPercentage?: number
}

interface ProductListItemProps {
  product: Product
  onProductClick?: (product: Product) => void
  onFavoriteClick?: (productId: string) => void
  onCompareClick?: (productId: string) => void
  isFavorite?: boolean
  isComparing?: boolean
  className?: string
  showAllPrices?: boolean
}

export function ProductListItem({
  product,
  onProductClick,
  onFavoriteClick,
  onCompareClick,
  isFavorite = false,
  isComparing = false,
  className,
  showAllPrices = false,
}: ProductListItemProps) {
  const lowestPrice = product.lowestPrice || Math.min(...product.prices.map((p) => p.price))
  const bestPriceStore = product.prices.find((p) => p.price === lowestPrice)
  const sortedPrices = [...product.prices].sort((a, b) => a.price - b.price)
  const [showPrices, setShowPrices] = React.useState(showAllPrices)

  return (
    <Card
      className={cn(
        'overflow-hidden hover:shadow-md transition-all duration-300',
        className
      )}
    >
      <div className="flex flex-col md:flex-row gap-4 p-4">
        {/* Image Section */}
        <div
          className="relative w-full md:w-48 h-48 flex-shrink-0 cursor-pointer group"
          onClick={() => onProductClick?.(product)}
        >
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Package className="w-16 h-16" />
              </div>
            )}
          </div>

          {/* Savings Badge */}
          {product.savingsPercentage && product.savingsPercentage > 5 && (
            <Badge
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600"
              variant="destructive"
            >
              <TrendingDown className="w-3 h-3 mr-1" />
              {product.savingsPercentage}% OFF
            </Badge>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              {/* Category & Brand */}
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
                {product.brand && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {product.brand}
                  </span>
                )}
              </div>

              {/* Product Name */}
              <h3
                className="font-semibold text-lg line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                onClick={() => onProductClick?.(product)}
              >
                {product.name}
              </h3>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onFavoriteClick?.(product.id)}
                className={cn(
                  'rounded-full',
                  isFavorite && 'text-red-500 hover:text-red-600'
                )}
              >
                <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onCompareClick?.(product.id)}
                className={cn(
                  'rounded-full',
                  isComparing && 'text-blue-500 hover:text-blue-600'
                )}
              >
                <ExternalLink className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {product.description}
            </p>
          )}

          {/* Price Section */}
          <div className="mt-auto space-y-3">
            {/* Best Price */}
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Best Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    €{lowestPrice.toFixed(2)}
                  </span>
                  {product.prices.length > 1 && (
                    <span className="text-xs text-muted-foreground">
                      from {product.prices.length} stores
                    </span>
                  )}
                </div>
                {bestPriceStore && (
                  <div className="flex items-center gap-1 mt-1">
                    <Store className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {bestPriceStore.storeName}
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => window.open(bestPriceStore?.url, '_blank')}
                className="ml-4"
              >
                Buy Now
              </Button>
            </div>

            {/* Other Prices */}
            {product.prices.length > 1 && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPrices(!showPrices)}
                  className="text-xs"
                >
                  {showPrices ? 'Hide' : 'Show'} all {product.prices.length} prices
                </Button>

                {showPrices && (
                  <div className="mt-2 space-y-2">
                    {sortedPrices.slice(1).map((price, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{price.storeName}</span>
                          {!price.availability && (
                            <Badge variant="outline" className="text-xs">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">
                            €{price.price.toFixed(2)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(price.url, '_blank')}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
