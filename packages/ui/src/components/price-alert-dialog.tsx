'use client'

import * as React from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Badge } from './badge'
import { Bell, X, TrendingDown } from 'lucide-react'
import { cn } from '../lib/utils'

interface PriceAlertDialogProps {
  open: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    imageUrl?: string
    currentPrice: number
    currency?: string
  }
  onSubmit: (targetPrice: number) => Promise<void>
  className?: string
}

export function PriceAlertDialog({
  open,
  onClose,
  product,
  onSubmit,
  className,
}: PriceAlertDialogProps) {
  const [targetPrice, setTargetPrice] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    if (open) {
      setTargetPrice('')
      setError(undefined)
    }
  }, [open])

  const savings = targetPrice
    ? ((product.currentPrice - Number(targetPrice)) / product.currentPrice) * 100
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(undefined)

    const price = Number(targetPrice)
    if (!price || price <= 0) {
      setError('Please enter a valid price')
      return
    }

    if (price >= product.currentPrice) {
      setError('Target price must be lower than current price')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(price)
      onClose()
    } catch (err) {
      setError('Failed to create alert. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-background rounded-lg shadow-lg animate-in zoom-in-95',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Set Price Alert</h2>
              <p className="text-sm text-muted-foreground">
                Get notified when price drops
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Product Info */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium line-clamp-2 mb-1">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  Current Price:{' '}
                  <span className="font-semibold">
                    {product.currency || '€'}
                    {product.currentPrice.toFixed(2)}
                  </span>
                </p>
              </div>
            </div>

            {/* Target Price Input */}
            <div className="space-y-2">
              <Label htmlFor="targetPrice">
                Target Price ({product.currency || '€'})
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {product.currency || '€'}
                </span>
                <Input
                  id="targetPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={product.currentPrice}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-8"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Savings Preview */}
            {savings > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-900">
                    Potential Savings
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {product.currency || '€'}
                  {(product.currentPrice - Number(targetPrice)).toFixed(2)}
                  <span className="text-sm ml-2">({savings.toFixed(1)}% off)</span>
                </p>
              </div>
            )}

            {/* Info */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p>✓ You'll receive an email when the price drops</p>
              <p>✓ We check prices multiple times per day</p>
              <p>✓ You can manage your alerts anytime</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Alert'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
