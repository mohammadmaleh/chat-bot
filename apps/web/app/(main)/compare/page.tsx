'use client'

import { useState } from 'react'
import { ComparisonTable } from '@chat-bot/ui'
import { Button } from '@chat-bot/ui'
import { useSearchParams } from 'next/navigation'

const mockProducts = [
  {
    id: '1',
    name: 'Apple AirPods Pro 2nd Gen',
    brand: 'Apple',
    imageUrl: 'https://via.placeholder.com/300x300/000000/FFFFFF?text=AirPods+Pro',
    category: 'Electronics',
    prices: [
      { storeName: 'Amazon.de', price: 279.00, currency: '€', availability: true },
      { storeName: 'MediaMarkt', price: 289.00, currency: '€', availability: true },
      { storeName: 'Saturn', price: 299.00, currency: '€', availability: true },
    ],
    specifications: {
      'Noise Cancellation': true,
      'Battery Life': '6h',
      'Water Resistant': true,
      'Wireless Charging': true,
      'Bluetooth': '5.3',
    },
    lowestPrice: 279.00,
    savingsPercentage: 7,
  },
  {
    id: '2',
    name: 'Sony WH-1000XM5 Headphones',
    brand: 'Sony',
    imageUrl: 'https://via.placeholder.com/300x300/111111/FFFFFF?text=Sony+XM5',
    category: 'Electronics',
    prices: [
      { storeName: 'Amazon.de', price: 399.00, currency: '€', availability: true },
      { storeName: 'MediaMarkt', price: 389.00, currency: '€', availability: true },
      { storeName: 'Saturn', price: 409.00, currency: '€', availability: false },
    ],
    specifications: {
      'Noise Cancellation': true,
      'Battery Life': '30h',
      'Water Resistant': false,
      'Wireless Charging': false,
      'Bluetooth': '5.2',
    },
    lowestPrice: 389.00,
    savingsPercentage: 2.5,
  },
]

export default function ComparePage() {
  const searchParams = useSearchParams()
  const productIds = searchParams.get('products')?.split(',') || []

  const [favorites, setFavorites] = useState<string[]>([])
  const [products, setProducts] = useState(mockProducts)

  const handleRemoveProduct = (productId: string) => {
    setProducts(products.filter((p) => p.id !== productId))
  }

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const filteredProducts = products.filter((p) => productIds.includes(p.id))

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Product Comparison</h1>
        <p className="text-xl text-muted-foreground">
          Compare prices, specifications, and availability across stores
        </p>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-24">
          <h2 className="text-2xl font-semibold mb-4">No products to compare</h2>
          <p className="text-muted-foreground mb-8">
            Add products from the product list to start comparing
          </p>
          <Button size="lg" onClick={() => window.history.back()}>
            Browse Products
          </Button>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {filteredProducts.length} products compared
              </Badge>
              <Badge variant="outline">
                {filteredProducts.reduce(
                  (sum, p) => sum + p.prices.length,
                  0
                )}{' '}
                store prices
              </Badge>
            </div>
            <Button variant="outline">
              Share Comparison
            </Button>
          </div>

          {/* Comparison Table */}
          <ComparisonTable
            products={filteredProducts}
            favorites={favorites}
            onRemoveProduct={handleRemoveProduct}
            onFavoriteClick={toggleFavorite}
          />
        </>
      )}
    </div>
  )
}
