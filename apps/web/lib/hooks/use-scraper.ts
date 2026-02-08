import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scraperApi, TriggerScraperRequest } from '../api/scraper'

// Query keys
export const scraperKeys = {
  all: ['scraper'] as const,
  jobs: () => [...scraperKeys.all, 'jobs'] as const,
  job: (id: string) => [...scraperKeys.jobs(), id] as const,
  stats: () => [...scraperKeys.all, 'stats'] as const,
  stores: () => [...scraperKeys.all, 'stores'] as const,
  schedule: () => [...scraperKeys.all, 'schedule'] as const,
}

// Get all scraper jobs
export function useScraperJobs(limit: number = 50) {
  return useQuery({
    queryKey: scraperKeys.jobs(),
    queryFn: () => scraperApi.getJobs(limit),
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    staleTime: 3000,
  })
}

// Get single job
export function useScraperJob(jobId: string) {
  return useQuery({
    queryKey: scraperKeys.job(jobId),
    queryFn: () => scraperApi.getJob(jobId),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data
      // Stop polling if job is completed or failed
      if (job?.status === 'completed' || job?.status === 'failed') {
        return false
      }
      return 3000 // Poll every 3 seconds while running
    },
  })
}

// Get scraper statistics
export function useScraperStats() {
  return useQuery({
    queryKey: scraperKeys.stats(),
    queryFn: () => scraperApi.getStats(),
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000,
  })
}

// Get supported stores
export function useStores() {
  return useQuery({
    queryKey: scraperKeys.stores(),
    queryFn: () => scraperApi.getStores(),
    staleTime: 60 * 60 * 1000, // 1 hour - stores don't change
  })
}

// Trigger scraper mutation
export function useTriggerScraper() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: TriggerScraperRequest) => scraperApi.triggerScraper(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scraperKeys.jobs() })
      queryClient.invalidateQueries({ queryKey: scraperKeys.stats() })
    },
  })
}

// Cancel job mutation
export function useCancelJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => scraperApi.cancelJob(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: scraperKeys.job(jobId) })
      queryClient.invalidateQueries({ queryKey: scraperKeys.jobs() })
    },
  })
}

// Retry job mutation
export function useRetryJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => scraperApi.retryJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scraperKeys.jobs() })
      queryClient.invalidateQueries({ queryKey: scraperKeys.stats() })
    },
  })
}

// Scrape single product
export function useScrapeProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (url: string) => scraperApi.scrapeProduct(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// Bulk scrape
export function useBulkScrape() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (urls: string[]) => scraperApi.bulkScrape(urls),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scraperKeys.jobs() })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// Get scraping schedule
export function useScraperSchedule() {
  return useQuery({
    queryKey: scraperKeys.schedule(),
    queryFn: () => scraperApi.getSchedule(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Update schedule mutation
export function useUpdateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (schedule: any) => scraperApi.updateSchedule(schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scraperKeys.schedule() })
    },
  })
}
