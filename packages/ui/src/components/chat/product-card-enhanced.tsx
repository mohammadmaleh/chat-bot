import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card"
import { Badge } from "../badge"
import { Button } from "../button"
import { formatPrice } from "../../lib/utils"
import { ExternalLink, TrendingDown, AlertCircle, Star, Heart, Share2, Eye } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
  rating?: number
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isFavorite, setIsFavorite] = React.useState(false)
  const [showAllPrices, setShowAllPrices] = React.useState(false)

  // Handle empty prices array
  if (!product.prices || product.prices.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card className="overflow-hidden border-dashed">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription className="mt-1">
                  {product.brand} • {product.category}
                </CardDescription>
              </div>
              {product.imageUrl && (
                <motion.img
                  whileHover={{ scale: 1.1, rotate: 5 }}
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
      </motion.div>
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

  const displayPrices = showAllPrices ? product.prices : product.prices.slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="overflow-hidden hover:shadow-2xl transition-shadow duration-300 border-2 hover:border-primary/20 group">
        <CardHeader className="pb-3 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {product.name}
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <span>{product.brand}</span>
                <span>•</span>
                <span>{product.category}</span>
                {product.rating && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-3 w-3 fill-current" />
                      {product.rating.toFixed(1)}
                    </span>
                  </>
                )}
              </CardDescription>
            </div>
            
            {product.imageUrl && (
              <motion.div
                whileHover={{ scale: 1.15, rotate: 5 }}
                className="relative overflow-hidden rounded-lg"
              >
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-20 h-20 object-cover"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center"
                >
                  <Eye className="h-5 w-5 text-white" />
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm shadow-md hover:bg-background"
            >
              <Heart 
                className={`h-4 w-4 transition-colors ${
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                }`}
              />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm shadow-md hover:bg-background"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Best Price - Animated */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                </motion.div>
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Best Price
                </span>
              </div>
              {savingsPercent > 0 && (
                <Badge className="bg-green-600 hover:bg-green-700 gap-1 shadow-sm">
                  <TrendingDown className="h-3 w-3" />
                  Save {savingsPercent}%
                </Badge>
              )}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="text-3xl font-bold text-green-700 dark:text-green-400"
                >
                  {formatPrice(String(cheapestPrice.price), cheapestPrice.currency)}
                </motion.div>
                <div className="text-sm text-muted-foreground mt-1">
                  at {cheapestPrice.store_name}
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  className="gap-2 shadow-md hover:shadow-lg transition-shadow"
                  onClick={() => window.open(cheapestPrice.url, '_blank')}
                >
                  Visit Store
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* All Prices */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Available at {product.prices.length} stores
              </div>
              {product.prices.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllPrices(!showAllPrices)}
                  className="text-xs h-auto py-1"
                >
                  {showAllPrices ? 'Show less' : `Show all ${product.prices.length}`}
                </Button>
              )}
            </div>
            
            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {displayPrices.map((price, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ x: 4, scale: 1.02 }}
                    className="flex items-center justify-between text-sm p-3 rounded-lg 
                             bg-muted/50 hover:bg-muted transition-colors cursor-pointer
                             border border-transparent hover:border-primary/20"
                    onClick={() => window.open(price.url, '_blank')}
                  >
                    <div className="flex items-center gap-3">
                      {price.store_logo && (
                        <img
                          src={price.store_logo}
                          alt={price.store_name}
                          className="h-5 w-auto object-contain"
                        />
                      )}
                      <span className="font-medium">{price.store_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-base">
                        {formatPrice(String(price.price), price.currency)}
                      </span>
                      {!price.availability && (
                        <Badge variant="destructive" className="text-xs">
                          Out of Stock
                        </Badge>
                      )}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </div>

          {/* Product Description */}
          <AnimatePresence>
            {product.description && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: isExpanded ? "auto" : 0,
                  opacity: isExpanded ? 1 : 0,
                }}
                className="overflow-hidden"
              >
                <div className="text-sm text-muted-foreground pt-3 border-t leading-relaxed">
                  {product.description}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {product.description && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-xs"
            >
              {isExpanded ? 'Show less' : 'Show description'}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
