'use client'

import * as React from 'react'
import { Input } from './input'
import { Button } from './button'
import { Badge } from './badge'
import { Search, X, Clock, TrendingUp } from 'lucide-react'
import { cn } from '../lib/utils'

interface SearchSuggestion {
  text: string
  type: 'recent' | 'trending' | 'category'
  count?: number
}

interface SearchBarProps {
  value?: string
  onChange?: (value: string) => void
  onSearch?: (query: string) => void
  onClear?: () => void
  placeholder?: string
  suggestions?: SearchSuggestion[]
  recentSearches?: string[]
  onSuggestionClick?: (suggestion: string) => void
  className?: string
  autoFocus?: boolean
  showSuggestions?: boolean
}

export function SearchBar({
  value = '',
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search products...',
  suggestions = [],
  recentSearches = [],
  onSuggestionClick,
  className,
  autoFocus = false,
  showSuggestions = true,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [localValue, setLocalValue] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    onChange?.(newValue)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (localValue.trim()) {
      onSearch?.(localValue.trim())
      setIsFocused(false)
      inputRef.current?.blur()
    }
  }

  const handleClear = () => {
    setLocalValue('')
    onChange?.('')
    onClear?.()
    inputRef.current?.focus()
  }

  const handleSuggestionClick = (suggestion: string) => {
    setLocalValue(suggestion)
    onChange?.(suggestion)
    onSuggestionClick?.(suggestion)
    onSearch?.(suggestion)
    setIsFocused(false)
  }

  const showDropdown = isFocused && showSuggestions && (suggestions.length > 0 || recentSearches.length > 0)

  return (
    <div className={cn('relative', className)}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="pl-10 pr-20 h-12 text-base"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {localValue && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleClear}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button type="submit" size="sm" className="h-8">
              Search
            </Button>
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-2 bg-background border rounded-lg shadow-lg overflow-hidden">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-3 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Recent Searches
                </span>
              </div>
              <div className="space-y-1">
                {recentSearches.slice(0, 5).map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded-md text-sm transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3">
              {suggestions.some((s) => s.type === 'trending') && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Trending
                    </span>
                  </div>
                  <div className="space-y-1">
                    {suggestions
                      .filter((s) => s.type === 'trending')
                      .slice(0, 3)
                      .map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className="w-full text-left px-3 py-2 hover:bg-muted rounded-md text-sm transition-colors flex items-center justify-between"
                        >
                          <span>{suggestion.text}</span>
                          {suggestion.count && (
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.count}
                            </Badge>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {suggestions.some((s) => s.type === 'category') && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Categories
                    </span>
                  </div>
                  <div className="space-y-1">
                    {suggestions
                      .filter((s) => s.type === 'category')
                      .map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className="w-full text-left px-3 py-2 hover:bg-muted rounded-md text-sm transition-colors"
                        >
                          {suggestion.text}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
