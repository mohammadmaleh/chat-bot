'use client'

import * as React from 'react'
import { Button } from './button'
import { Input } from './input'
import { Badge } from './badge'
import {
  ShoppingBag,
  Mail,
  Github,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Send,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface FooterLink {
  label: string
  href: string
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

interface FooterProps {
  sections?: FooterSection[]
  socialLinks?: {
    github?: string
    twitter?: string
    linkedin?: string
    facebook?: string
    instagram?: string
  }
  onNewsletterSubmit?: (email: string) => void
  className?: string
}

const defaultSections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Browse Products', href: '/products' },
      { label: 'Categories', href: '/categories' },
      { label: 'Best Deals', href: '/deals' },
      { label: 'New Arrivals', href: '/new' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'FAQs', href: '/faq' },
      { label: 'Shipping', href: '/shipping' },
      { label: 'Returns', href: '/returns' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'GDPR', href: '/gdpr' },
    ],
  },
]

export function Footer({
  sections = defaultSections,
  socialLinks = {},
  onNewsletterSubmit,
  className,
}: FooterProps) {
  const [email, setEmail] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !onNewsletterSubmit) return

    setIsSubmitting(true)
    try {
      await onNewsletterSubmit(email)
      setEmail('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const socialIcons = [
    { icon: Github, href: socialLinks.github, label: 'GitHub' },
    { icon: Twitter, href: socialLinks.twitter, label: 'Twitter' },
    { icon: Linkedin, href: socialLinks.linkedin, label: 'LinkedIn' },
    { icon: Facebook, href: socialLinks.facebook, label: 'Facebook' },
    { icon: Instagram, href: socialLinks.instagram, label: 'Instagram' },
  ].filter((social) => social.href)

  return (
    <footer className={cn('border-t bg-muted/50', className)}>
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 py-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <ShoppingBag className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold">PriceHunt</h2>
                <p className="text-xs text-muted-foreground">Find Best Deals</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your AI-powered shopping assistant for finding the best prices across
              German stores. Save money, save time.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">🇩🇪 Made in Germany</Badge>
              <Badge variant="secondary">✓ GDPR Compliant</Badge>
            </div>
          </div>

          {/* Links Sections */}
          {sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        {onNewsletterSubmit && (
          <div className="border-t py-8">
            <div className="max-w-md mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Subscribe to our newsletter</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Get the latest deals and updates delivered to your inbox
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={isSubmitting}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Bottom Section */}
        <div className="border-t py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} PriceHunt. All rights reserved.
            </p>

            {/* Social Links */}
            {socialIcons.length > 0 && (
              <div className="flex items-center gap-2">
                {socialIcons.map(({ icon: Icon, href, label }) => (
                  <Button
                    key={label}
                    variant="ghost"
                    size="icon"
                    asChild
                    className="rounded-full"
                  >
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  </Button>
                ))}
              </div>
            )}

            {/* Payment Methods */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Supported by:</span>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">Amazon.de</Badge>
                <Badge variant="outline" className="text-xs">MediaMarkt</Badge>
                <Badge variant="outline" className="text-xs">Thomann</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
