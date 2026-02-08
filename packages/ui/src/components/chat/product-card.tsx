import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card"
import { Badge } from "../badge"
import { formatPrice } from "../../lib/utils"
import { ExternalLink, TrendingDown, AlertCircle } from "lucide-react"

interface Price {
  price: string | number
  currency: string
  availability: boolean
  url: string
  store_name: string
  store_domain: string
  store_logo?: string
}

interface Product {
  id: string
  name: string
  brand: string
  category: string
  description?: string
  imageUrl?: string
  prices: Price[]
  cheapest_price?: number
  most_expensive?: number
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  // Handle empty prices array
  if (!product.prices || product.prices.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription className="mt-1">
                {product.brand} • {product.category}
              </CardDescription>
            </div>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <AlertCircle className="h-4 w-4" />
            <span>Price information not available</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const cheapestPrice = product.prices.reduce((min, p) => 
    parseFloat(String(p.price)) < parseFloat(String(min.price)) ? p : min
  )

  const savingsPercent = product.most_expensive && product.cheapest_price
    ? Math.round(
        ((product.most_expensive - product.cheapest_price) / product.most_expensive) * 100
      )
    : 0

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{product.name}</CardTitle>
            <CardDescription className="mt-1">
              {product.brand} • {product.category}
            </CardDescription>
          </div>
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Best Price */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Best Price
            </span>
            {savingsPercent > 0 && (
              <Badge variant="success" className="gap-1">
                <TrendingDown className="h-3 w-3" />
                Save {savingsPercent}%
              </Badge>
            )}
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatPrice(String(cheapestPrice.price), cheapestPrice.currency)}
              </div>
              <div className="text-xs text-muted-foreground">
                at {cheapestPrice.store_name}
              </div>
            </div>
            <a
              href={cheapestPrice.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Visit Store
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* All Prices */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Available at {product.prices.length} stores:</div>
          <div className="space-y-1.5">
            {product.prices.slice(0, 3).map((price, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  {price.store_logo && (
                    <img
                      src={price.store_logo}
                      alt={price.store_name}
                      className="h-4 w-auto"
                    />
                  )}
                  <span className="font-medium">{price.store_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {formatPrice(String(price.price), price.currency)}
                  </span>
                  {!price.availability && (
                    <Badge variant="destructive" className="text-xs">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          {product.prices.length > 3 && (
            <div className="text-xs text-muted-foreground text-center pt-1">
              + {product.prices.length - 3} more stores
            </div>
          )}
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="text-sm text-muted-foreground pt-2 border-t">
            {product.description}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
