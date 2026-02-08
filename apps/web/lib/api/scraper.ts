import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export interface ScraperJob {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  store: string
  query?: string
  productsScraped: number
  totalProducts: number
  startedAt?: string
  completedAt?: string
  error?: string
  progress: number
}

export interface ScraperStats {
  totalJobs: number
  runningJobs: number
  completedJobs: number
  failedJobs: number
  productsScraped: number
  lastRunAt?: string
}

export interface TriggerScraperRequest {
  store: string
  query?: string
  category?: string
  maxProducts?: number
}

export const scraperApi = {
  // Get all scraper jobs
  getJobs: async (limit: number = 50) => {
    const { data } = await axios.get(`${API_URL}/api/scraper/jobs`, {
      params: { limit },
    })
    return data
  },

  // Get single job by ID
  getJob: async (jobId: string): Promise<ScraperJob> => {
    const { data } = await axios.get(`${API_URL}/api/scraper/jobs/${jobId}`)
    return data
  },

  // Trigger new scraping job
  triggerScraper: async (request: TriggerScraperRequest): Promise<ScraperJob> => {
    const { data } = await axios.post(`${API_URL}/api/scraper/trigger`, request)
    return data
  },

  // Get scraper statistics
  getStats: async (): Promise<ScraperStats> => {
    const { data } = await axios.get(`${API_URL}/api/scraper/stats`)
    return data
  },

  // Cancel running job
  cancelJob: async (jobId: string) => {
    const { data } = await axios.post(`${API_URL}/api/scraper/jobs/${jobId}/cancel`)
    return data
  },

  // Retry failed job
  retryJob: async (jobId: string): Promise<ScraperJob> => {
    const { data } = await axios.post(`${API_URL}/api/scraper/jobs/${jobId}/retry`)
    return data
  },

  // Get supported stores
  getStores: async () => {
    const { data } = await axios.get(`${API_URL}/api/scraper/stores`)
    return data
  },

  // Scrape specific product URL
  scrapeProduct: async (url: string) => {
    const { data } = await axios.post(`${API_URL}/api/scraper/product`, { url })
    return data
  },

  // Bulk scrape multiple URLs
  bulkScrape: async (urls: string[]) => {
    const { data } = await axios.post(`${API_URL}/api/scraper/bulk`, { urls })
    return data
  },

  // Get scraping schedule
  getSchedule: async () => {
    const { data } = await axios.get(`${API_URL}/api/scraper/schedule`)
    return data
  },

  // Update scraping schedule
  updateSchedule: async (schedule: any) => {
    const { data } = await axios.put(`${API_URL}/api/scraper/schedule`, schedule)
    return data
  },
}
