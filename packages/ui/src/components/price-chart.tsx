'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../lib/utils'

interface PriceDataPoint {
  date: string
  price: number
}

interface PriceChartProps {
  data: PriceDataPoint[]
  storeName?: string
  currentPrice: number
  lowestPrice: number
  highestPrice: number
  averagePrice: number
  priceChange?: number
  priceChangePercentage?: number
  className?: string
  height?: number
}

export function PriceChart({
  data,
  storeName,
  currentPrice,
  lowestPrice,
  highestPrice,
  averagePrice,
  priceChange = 0,
  priceChangePercentage = 0,
  className,
  height = 200,
}: PriceChartProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const isPriceDown = priceChange < 0
  const isPriceUp = priceChange > 0

  React.useEffect(() => {
    if (!canvasRef.current || data.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padding = 40

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Calculate scales
    const priceRange = highestPrice - lowestPrice
    const priceScale = (height - padding * 2) / priceRange
    const xStep = (width - padding * 2) / (data.length - 1)

    // Draw grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height - padding * 2) * (i / 5)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Draw average price line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    const avgY = height - padding - (averagePrice - lowestPrice) * priceScale
    ctx.beginPath()
    ctx.moveTo(padding, avgY)
    ctx.lineTo(width - padding, avgY)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw price line
    ctx.strokeStyle = isPriceDown ? '#22c55e' : isPriceUp ? '#ef4444' : '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((point, i) => {
      const x = padding + i * xStep
      const y = height - padding - (point.price - lowestPrice) * priceScale

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw gradient fill under line
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding)
    gradient.addColorStop(
      0,
      isPriceDown
        ? 'rgba(34, 197, 94, 0.2)'
        : isPriceUp
        ? 'rgba(239, 68, 68, 0.2)'
        : 'rgba(59, 130, 246, 0.2)'
    )
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    data.forEach((point, i) => {
      const x = padding + i * xStep
      const y = height - padding - (point.price - lowestPrice) * priceScale
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.lineTo(width - padding, height - padding)
    ctx.lineTo(padding, height - padding)
    ctx.closePath()
    ctx.fill()

    // Draw data points
    ctx.fillStyle = isPriceDown ? '#22c55e' : isPriceUp ? '#ef4444' : '#3b82f6'
    data.forEach((point, i) => {
      const x = padding + i * xStep
      const y = height - padding - (point.price - lowestPrice) * priceScale
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw current price indicator (last point)
    const lastX = padding + (data.length - 1) * xStep
    const lastY = height - padding - (currentPrice - lowestPrice) * priceScale
    ctx.fillStyle = isPriceDown ? '#22c55e' : isPriceUp ? '#ef4444' : '#3b82f6'
    ctx.beginPath()
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [data, lowestPrice, highestPrice, averagePrice, currentPrice, isPriceDown, isPriceUp])

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Price History {storeName && `- ${storeName}`}
          </CardTitle>
          <div className="flex items-center gap-2">
            {priceChangePercentage !== 0 && (
              <Badge
                variant={isPriceDown ? 'default' : 'destructive'}
                className={cn(
                  isPriceDown && 'bg-green-500 hover:bg-green-600',
                  'flex items-center gap-1'
                )}
              >
                {isPriceDown ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
                {Math.abs(priceChangePercentage).toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current</p>
            <p className="text-lg font-bold">€{currentPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Lowest</p>
            <p className="text-lg font-bold text-green-600">€{lowestPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Highest</p>
            <p className="text-lg font-bold text-red-600">€{highestPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Average</p>
            <p className="text-lg font-bold text-blue-600">€{averagePrice.toFixed(2)}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="relative" style={{ height: `${height}px` }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Date labels */}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{new Date(data[0]?.date).toLocaleDateString()}</span>
          <span>{new Date(data[data.length - 1]?.date).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
