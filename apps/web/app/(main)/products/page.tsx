'use client'

import { useState } from 'react'
import { useProducts } from '@/lib/hooks/use-products'
import {
  ProductGrid,
  FilterSidebar,
  SearchBar,
  ProductGridSkeleton,
  NoSearchResults,
  Button,
  Badge,
} from '@chat-bot/ui'
import { useRouter } from 'next/navigation'
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react'

export default function ProductsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<any>({
    category: [],
    brands: [],
    stores: [],
    price: { min: 0, max: 5000 },
    sortBy: 'newest',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const { data: products, isLoading, error } = useProducts({
    search: searchQuery,
    category: filters.category[0],
    minPrice: filters.price.min,
    maxPrice: filters.price.max,
    brands: filters.brands,
    stores: filters.stores,
    sortBy: filters.sortBy,
  })

  const filterSections = [
    {
      id: 'category',
      label: 'Category',
      type: 'checkbox' as const,
      options: [
        { value: 'electronics', label: 'Electronics', count: 1234 },
        { value: 'clothing', label: 'Clothing', count: 856 },
        { value: 'home', label: 'Home & Garden', count: 645 },
        { value: 'sports', label: 'Sports', count: 423 },
        { value: 'books', label: 'Books', count: 789 },
      ],
    },
    {
      id: 'price',
      label: 'Price Range (€)',
      type: 'range' as const,
      min: 0,
      max: 5000,
    },
    {
      id: 'brands',
      label: 'Brands',
      type: 'checkbox' as const,
      options: [
        { value: 'apple', label: 'Apple', count: 234 },
        { value: 'samsung', label: 'Samsung', count: 189 },
        { value: 'sony', label: 'Sony', count: 156 },
        { value: 'nike', label: 'Nike', count: 98 },
      ],
    },
    {
      id: 'stores',
      label: 'Stores',
      type: 'checkbox' as const,
      options: [
        { value: 'amazon', label: 'Amazon.de', count: 2345 },
        { value: 'mediamarkt', label: 'MediaMarkt', count: 1567 },
        { value: 'saturn', label: 'Saturn', count: 1234 },
        { value: 'thomann', label: 'Thomann', count: 890 },
      ],
    },
    {
      id: 'sortBy',
      label: 'Sort By',
      type: 'radio' as const,
      options: [
        { value: 'newest', label: 'Newest First' },
        { value: 'price_asc', label: 'Price: Low to High' },
        { value: 'price_desc', label: 'Price: High to Low' },
        { value: 'popularity', label: 'Most Popular' },
        { value: 'savings', label: 'Best Savings' },
      ],
    },
  ]

  const handleFilterChange = (filterId: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [filterId]: value }))
  }

  const handleClearFilters = () => {
    setFilters({
      category: [],
      brands: [],
      stores: [],
      price: { min: 0, max: 5000 },
      sortBy: 'newest',
    })
    setSearchQuery('')
  }

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'sortBy') return false
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return value.min > 0 || value.max < 5000
    return false
  }).length

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Browse Products</h1>
        <p className="text-muted-foreground">
          Discover the best deals across thousands of products from top German stores
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={(query) => setSearchQuery(query)}
          placeholder="Search for products, brands, or categories..."
          suggestions={[
            { text: 'Wireless headphones', type: 'trending', count: 234 },
            { text: 'Coffee machines', type: 'trending', count: 189 },
            { text: 'Gaming laptops', type: 'trending', count: 156 },
          ]}
          recentSearches={['iPhone 15', 'Nike shoes', 'Sony camera']}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            {products?.total || 0} products found
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside
          className={`lg:block lg:w-64 flex-shrink-0 ${
            showFilters ? 'block' : 'hidden'
          }`}
        >
          <FilterSidebar
            sections={filterSections}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearFilters}
          />
        </aside>

        {/* Products */}
        <div className="flex-1">
          {isLoading ? (
            <ProductGridSkeleton count={9} />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load products</p>
            </div>
          ) : !products?.products || products.products.length === 0 ? (
            <NoSearchResults
              query={searchQuery}
              onClearFilters={handleClearFilters}
              onNewSearch={() => router.push('/products')}
            />
          ) : (
            <ProductGrid
              products={products.products}
              onProductClick={(product) => router.push(`/products/${product.id}`)}
              columns={viewMode === 'grid' ? 3 : 1}
            />
          )}
        </div>
      </div>
    </div>
  )
}
