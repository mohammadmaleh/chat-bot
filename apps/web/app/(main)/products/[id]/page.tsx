'use client'

import { useState } from 'react'
import { useProduct, usePriceHistory } from '@/lib/hooks/use-products'
import {
  Button,
  Badge,
  StoreBadge,
  PriceChart,
  ProductGridSkeleton,
  PriceAlertDialog,
  ShareDialog,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@chat-bot/ui'
import { useRouter } from 'next/navigation'
import {
  Heart,
  Share2,
  Bell,
  TrendingDown,
  Package,
  Store,
  ShieldCheck,
  Truck,
  ExternalLink,
} from 'lucide-react'
import { use } from 'react'

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: product, isLoading } = useProduct(id)
  const { data: priceHistory } = usePriceHistory(id, 30)
  const [showPriceAlert, setShowPriceAlert] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProductGridSkeleton count={1} />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Button onClick={() => router.push('/products')}>Browse Products</Button>
      </div>
    )
  }

  const lowestPrice = Math.min(...product.prices.map((p) => p.price))
  const highestPrice = Math.max(...product.prices.map((p) => p.price))
  const bestDeal = product.prices.find((p) => p.price === lowestPrice)
  const savings = ((highestPrice - lowestPrice) / highestPrice) * 100

  const productImages = product.imageUrl ? [product.imageUrl] : []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="text-sm text-muted-foreground mb-6">
        <span className="hover:text-foreground cursor-pointer" onClick={() => router.push('/')}>
          Home
        </span>
        {' / '}
        <span className="hover:text-foreground cursor-pointer" onClick={() => router.push('/products')}>
          Products
        </span>
        {' / '}
        <span className="hover:text-foreground cursor-pointer" onClick={() => router.push(`/categories/${product.category}`)}>
          {product.category}
        </span>
        {' / '}
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {productImages.length > 0 ? (
              <img
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="w-24 h-24 text-muted-foreground" />
              </div>
            )}
          </div>
          {productImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImage === idx ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <Badge variant="outline" className="mb-2">
              {product.category}
            </Badge>
            {product.brand && (
              <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
            )}
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            {product.description && (
              <p className="text-muted-foreground">{product.description}</p>
            )}
          </div>

          {/* Price Section */}
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Best Price</p>
                  <p className="text-4xl font-bold text-primary">
                    €{lowestPrice.toFixed(2)}
                  </p>
                </div>
                {savings > 5 && (
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    Save {savings.toFixed(0)}%
                  </Badge>
                )}
              </div>

              {bestDeal && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
                  <Store className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    Best deal at <strong>{bestDeal.storeName}</strong>
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => window.open(bestDeal?.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Buy Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowPriceAlert(true)}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Price Alert
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Heart className="w-4 h-4 mr-2" />
              Add to Favorites
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowShare(true)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <span className="text-sm">Verified Stores</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span className="text-sm">Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-orange-600" />
              <span className="text-sm">Price Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              <span className="text-sm">Price Alerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Price History */}
      {priceHistory && priceHistory.data.length > 0 && (
        <div className="mb-12">
          <PriceChart
            data={priceHistory.data}
            storeName={bestDeal?.storeName}
            currentPrice={lowestPrice}
            lowestPrice={priceHistory.lowestPrice}
            highestPrice={priceHistory.highestPrice}
            averagePrice={priceHistory.averagePrice}
            priceChange={priceHistory.priceChange}
            priceChangePercentage={priceHistory.priceChangePercentage}
          />
        </div>
      )}

      {/* All Store Prices */}
      <Card>
        <CardHeader>
          <CardTitle>Compare Prices from {product.prices.length} Stores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {product.prices
            .sort((a, b) => a.price - b.price)
            .map((price, idx) => (
              <StoreBadge
                key={idx}
                store={{
                  name: price.storeName,
                  logoUrl: price.storeLogo,
                  rating: 4.5,
                }}
                price={price.price}
                currency="€"
                url={price.url}
                availability={price.availability}
                variant="detailed"
                size="lg"
              />
            ))}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PriceAlertDialog
        open={showPriceAlert}
        onClose={() => setShowPriceAlert(false)}
        product={{
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          currentPrice: lowestPrice,
        }}
        onSubmit={async (targetPrice) => {
          console.log('Creating price alert:', targetPrice)
          // TODO: Implement price alert API
        }}
      />

      <ShareDialog
        open={showShare}
        onClose={() => setShowShare(false)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        title={product.name}
        description={product.description}
        imageUrl={product.imageUrl}
      />
    </div>
  )
}
