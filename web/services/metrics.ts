import type {
  TopProduct, RegionSale, CategorySaleResponse,
  AgeGroupSale, CategoryRegionSale, InventoryItem,
} from '@/types/metrics'

export interface FilterParams {
  regions:    string[]
  categories: string[]
}

function buildParams({ regions, categories }: FilterParams): URLSearchParams {
  const p = new URLSearchParams()
  categories.forEach(c => p.append('category', c))
  regions.forEach(r => p.append('region', r))
  return p
}

function toYearMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${url}`)
  return res.json() as Promise<T>
}

export const metricsService = {
  topProducts: (filters: FilterParams, limit = 10) =>
    apiFetch<TopProduct[]>(`/api/top-products?${buildParams(filters)}&limit=${limit}`),

  salesByRegion: (filters: FilterParams) =>
    apiFetch<RegionSale[]>(`/api/sales-by-region?${buildParams(filters)}`),

  salesByCategory: (filters: FilterParams, from: Date, to: Date) =>
    apiFetch<CategorySaleResponse>(
      `/api/sales-by-category?${buildParams(filters)}&from=${toYearMonth(from)}&to=${toYearMonth(to)}`
    ),

  salesByAgeGroup: (filters: FilterParams) =>
    apiFetch<AgeGroupSale[]>(`/api/sales-by-age-group?${buildParams(filters)}`),

  categoryByRegion: (filters: FilterParams) =>
    apiFetch<CategoryRegionSale[]>(`/api/category-by-region?${buildParams(filters)}`),

  inventory: (filters: FilterParams, limit = 200) =>
    apiFetch<InventoryItem[]>(`/api/inventory?${buildParams(filters)}&limit=${limit}`),
}
