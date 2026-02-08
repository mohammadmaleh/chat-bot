'use client'

import { useScraperJobs, useScraperStats, useTriggerScraper, useStores } from '@/lib/hooks/use-scraper'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Badge, 
  Input, 
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Loader2 
} from '@chat-bot/ui'
import { Zap, Play, StopCircle, RefreshCw, Search, Clock } from 'lucide-react'

export default function ScraperDashboard() {
  const { data: stats, isLoading: statsLoading } = useScraperStats()
  const { data: jobs, isLoading: jobsLoading } = useScraperJobs(20)
  const { data: stores } = useStores()
  const { mutate: triggerScraper, isPending } = useTriggerScraper()

  const handleTriggerScraper = (store: string, query?: string) => {
    triggerScraper({ store, query })
  }

  const recentJobs = jobs?.slice(0, 5) || []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Zap className="w-12 h-12 text-primary" />
          Scraper Dashboard
        </h1>
        <p className="text-xl text-muted-foreground">
          Monitor and trigger real-time price scraping across stores
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl font-bold">{statsLoading ? '--' : stats?.totalJobs}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Total Jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl font-bold">
              {statsLoading ? '--' : stats?.runningJobs}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl font-bold">
              {statsLoading ? '--' : stats?.completedJobs}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl font-bold">
              {statsLoading ? '--' : stats?.productsScraped.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Products Scraped</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Trigger */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Quick Scrape
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <Label>Select Store</Label>
                <Select onValueChange={(value) => handleTriggerScraper(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores?.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Product Query (optional)</Label>
                <Input placeholder="iPhone 15, coffee machine, etc." />
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleTriggerScraper('amazon')}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Start Scraping
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-3 bg-muted w-32 rounded animate-pulse" />
                        <div className="h-2 bg-muted w-24 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : recentJobs.length === 0 ? (
              <p className="text-muted-foreground">No recent scraping jobs</p>
            ) : (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      job.status === 'running' 
                        ? 'bg-blue-100 text-blue-700' 
                        : job.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {job.status === 'running' ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : job.status === 'completed' ? '✓' : '⚠'}
                    </div>
                    <div>
                      <p className="font-medium">{job.store}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.productsScraped}/{job.totalProducts} products
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    job.status === 'running' ? 'default' : 
                    job.status === 'completed' ? 'secondary' : 'destructive'
                  }>
                    {job.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
