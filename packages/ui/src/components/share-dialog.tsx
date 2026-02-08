'use client'

import * as React from 'react'
import { Button } from './button'
import { Input } from './input'
import { Badge } from './badge'
import {
  Share2,
  X,
  Copy,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  MessageCircle,
  Check,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  url: string
  title: string
  description?: string
  imageUrl?: string
  className?: string
}

export function ShareDialog({
  open,
  onClose,
  url,
  title,
  description,
  imageUrl,
  className,
}: ShareDialogProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-600 hover:bg-green-700',
      url: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description || ''}\n\n${url}`)}`,
    },
  ]

  const handleShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400')
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
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-background rounded-lg shadow-lg animate-in zoom-in-95',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Share2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Share Product</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Preview */}
          {imageUrl && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <img
                src={imageUrl}
                alt={title}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium line-clamp-2 text-sm">{title}</p>
                {description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Share Buttons */}
          <div>
            <p className="text-sm font-medium mb-3">Share via</p>
            <div className="grid grid-cols-5 gap-3">
              {shareLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleShare(link.url)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-110',
                      link.color
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {link.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Copy Link */}
          <div>
            <p className="text-sm font-medium mb-3">Or copy link</p>
            <div className="flex gap-2">
              <Input
                value={url}
                readOnly
                className="flex-1"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={handleCopy}
                className="gap-2"
                variant={copied ? 'default' : 'outline'}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Native Share API (Mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              onClick={async () => {
                try {
                  await navigator.share({
                    title,
                    text: description,
                    url,
                  })
                  onClose()
                } catch (err) {
                  console.error('Share failed:', err)
                }
              }}
              variant="outline"
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              More Options
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
