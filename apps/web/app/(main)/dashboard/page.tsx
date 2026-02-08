'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@chat-bot/ui'
import { 
  Navbar, 
  ProductGrid, 
  UserMenu, 
  Badge, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@chat-bot/ui'
import { useAuth } from '@/lib/hooks/use-auth'
import { useCurrentUser } from '@/lib/hooks/use-auth'
import { Heart, Bell, TrendingUp, ShoppingBag, Crown } from 'lucide-react'
import { ProductGridSkeleton } from '@chat-bot/ui'

export default function DashboardPage() {
  const { user } = useCurrentUser()

  const stats = {
    favorites: 23,
    alerts: 7,
    savings: 247.50,
    searches: 156,
    comparisons: 12,
  }

  const recentFavorites = [
    // Mock data - replace with real API call
    { id: '1', name: 'AirPods Pro 2', imageUrl: '', lowestPrice: 279, storeName: 'Amazon.de' },
    { id: '2', name: 'Sony XM5', imageUrl: '', lowestPrice: 389, storeName: 'MediaMarkt' },
  ]

  const activeAlerts = [
    { id: '1', productName: 'iPhone 15 Pro', targetPrice: 899, currentPrice: 999 },
    { id: '2', productName: 'MacBook Air M3', targetPrice: 1299, currentPrice: 1499 },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
              <p className="text-xl text-muted-foreground">
                Welcome back, {user?.name || 'User'}! Here's what's happening with your account.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold text-primary">
                €{stats.savings.toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total Saved</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">{stats.favorites}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Favorites</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">{stats.alerts}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Active Alerts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">{stats.searches}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total Searches</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="favorites">
              <Heart className="w-4 h-4 mr-2" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="w-4 h-4 mr-2" />
              Price Alerts
            </TabsTrigger>
            <TabsTrigger value="deals">
              <TrendingUp className="w-4 h-4 mr-2" />
              My Deals
            </TabsTrigger>
            <TabsTrigger value="history">
              <ShoppingBag className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Your Favorite Products ({stats.favorites})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductGrid
                  products={recentFavorites}
                  columns={3}
                  className="mt-4"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Active Price Alerts ({stats.alerts})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          📱
                        </div>
                        <div>
                          <p className="font-medium">{alert.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            Target: €{alert.targetPrice} | Current: €{alert.currentPrice}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Waiting...</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Deals You've Saved</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No recent deals found</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Search History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Search history coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
