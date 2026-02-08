'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { Check, X, ExternalLink, TrendingDown, Heart } from 'lucide-react'
import { cn } from '../lib/utils'

interface Product {
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
    availability: boolean
  }>
  specifications?: Record<string, string | boolean>
}

interface ComparisonTableProps {
  products: Product[]
  onRemoveProduct?: (productId: string) => void
  onFavoriteClick?: (productId: string) => void
  favorites?: string[]
  className?: string
}

export function ComparisonTable({
  products,
  onRemoveProduct,
  onFavoriteClick,
  favorites = [],
  className,
}: ComparisonTableProps) {
  if (products.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No products to compare</p>
          <p className="text-sm text-muted-foreground">
            Add products to comparison from the product list
          </p>
        </CardContent>
      </Card>
    )
  }

  // Get all unique specification keys
  const allSpecs = Array.from(
    new Set(products.flatMap((p) => Object.keys(p.specifications || {})))
  )

  // Calculate best prices
  const lowestPrices = products.map((p) => Math.min(...p.prices.map((pr) => pr.price)))
  const overallBestPrice = Math.min(...lowestPrices)
  const overallBestPriceIndex = lowestPrices.indexOf(overallBestPrice)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Cards */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${products.length}, minmax(250px, 1fr))` }}>
        {products.map((product, idx) => {
          const isFavorite = favorites.includes(product.id)
          const lowestPrice = Math.min(...product.prices.map((p) => p.price))
          const isBestPrice = idx === overallBestPriceIndex
          const bestPriceStore = product.prices.find((p) => p.price === lowestPrice)

          return (
            <Card key={product.id} className={cn('relative', isBestPrice && 'ring-2 ring-primary')}>
              {isBestPrice && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Best Deal
                </Badge>
              )}

              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onFavoriteClick?.(product.id)}
                    className={cn(
                      'rounded-full',
                      isFavorite && 'text-red-500 hover:text-red-600'
                    )}
                  >
                    <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveProduct?.(product.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Image */}
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-4">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div>
                  <Badge variant="outline" className="text-xs mb-2">
                    {product.category}
                  </Badge>
                  {product.brand && (
                    <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
                  )}
                  <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price */}
                <div className={cn(
                  'p-3 rounded-lg',
                  isBestPrice ? 'bg-primary/10' : 'bg-muted'
                )}>
                  <p className="text-xs text-muted-foreground mb-1">Best Price</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">€{lowestPrice.toFixed(2)}</span>
                    {isBestPrice && (
                      <TrendingDown className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    at {bestPriceStore?.storeName}
                  </p>
                </div>

                {/* Buy Button */}
                <Button
                  className="w-full"
                  onClick={() => window.open(bestPriceStore?.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Buy Now
                </Button>

                {/* All Prices */}
                {product.prices.length > 1 && (
                  <div className="pt-3 border-t space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Other Stores
                    </p>
                    {product.prices.slice(1, 3).map((price, priceIdx) => (
                      <div
                        key={priceIdx}
                        className="flex justify-between items-center text-xs"
                      >
                        <span className="text-muted-foreground truncate">
                          {price.storeName}
                        </span>
                        <span className="font-medium">€{price.price.toFixed(2)}</span>
                      </div>
                    ))}
                    {product.prices.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{product.prices.length - 3} more
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Specifications Comparison */}
      {allSpecs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Feature</th>
                    {products.map((product) => (
                      <th key={product.id} className="text-center p-3 font-medium w-1/4">
                        {product.brand || product.name.split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allSpecs.map((spec) => (
                    <tr key={spec} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium text-sm">{spec}</td>
                      {products.map((product) => {
                        const value = product.specifications?.[spec]
                        return (
                          <td key={product.id} className="p-3 text-center">
                            {typeof value === 'boolean' ? (
                              value ? (
                                <Check className="w-5 h-5 text-green-600 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-red-600 mx-auto" />
                              )
                            ) : value ? (
                              <span className="text-sm">{value}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
