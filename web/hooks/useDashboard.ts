'use client'

import { useCallback, useEffect, useState } from 'react'
import { metricsService, type FilterParams } from '@/services/metrics'
import { DEFAULT_DATE_FROM, DEFAULT_DATE_TO } from '@/lib/constants'
import type {
  TopProduct, RegionSale, CategorySaleResponse,
  AgeGroupSale, CategoryRegionSale, InventoryItem,
} from '@/types/metrics'

export function useDashboard() {
  // Filter state
  const [regions,    setRegions]    = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [dateFrom,   setDateFrom]   = useState<Date>(DEFAULT_DATE_FROM)
  const [dateTo,     setDateTo]     = useState<Date>(DEFAULT_DATE_TO)
  const [activeTab,  setActiveTab]  = useState<'kpis' | 'insights'>('kpis')

  // Filtered data — used by charts and KPIs
  const [topProducts,   setTopProducts]   = useState<TopProduct[]>([])
  const [regionData,    setRegionData]    = useState<RegionSale[]>([])
  const [categoryData,  setCategoryData]  = useState<CategorySaleResponse>({ summary: [], monthly: [] })
  const [ageGroupData,  setAgeGroupData]  = useState<AgeGroupSale[]>([])
  const [catRegionData, setCatRegionData] = useState<CategoryRegionSale[]>([])
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // Unfiltered data — used only by InsightsPanel so insights are always dataset-wide
  const [regionFull,    setRegionFull]    = useState<RegionSale[]>([])
  const [ageGroupFull,  setAgeGroupFull]  = useState<AgeGroupSale[]>([])
  const [inventoryFull, setInventoryFull] = useState<InventoryItem[]>([])

  // Fetch full dataset once on mount for insights
  useEffect(() => {
    const empty: FilterParams = { regions: [], categories: [] }
    Promise.all([
      metricsService.salesByRegion(empty),
      metricsService.salesByAgeGroup(empty),
      metricsService.inventory(empty),
    ]).then(([rd, ag, inv]) => {
      setRegionFull(rd)
      setAgeGroupFull(ag)
      setInventoryFull(inv)
    })
  }, [])

  // Fetch filtered data whenever any filter changes
  const fetchFiltered = useCallback(async () => {
    setLoading(true)
    setError(null)
    const filters: FilterParams = { regions, categories }
    try {
      const [tp, rd, cd, ag, cr, inv] = await Promise.all([
        metricsService.topProducts(filters),
        metricsService.salesByRegion(filters),
        metricsService.salesByCategory(filters, dateFrom, dateTo),
        metricsService.salesByAgeGroup(filters),
        metricsService.categoryByRegion(filters),
        metricsService.inventory(filters),
      ])
      setTopProducts(tp)
      setRegionData(rd)
      setCategoryData(cd)
      setAgeGroupData(ag)
      setCatRegionData(cr)
      setInventoryData(inv)
    } catch {
      setError('Failed to load dashboard data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [regions, categories, dateFrom, dateTo])

  useEffect(() => { fetchFiltered() }, [fetchFiltered])

  // Derived KPIs
  const totalRevenue      = regionData.reduce((s, r) => s + r.total_revenue,     0)
  const totalUnits        = regionData.reduce((s, r) => s + r.total_units,        0)
  const totalTransactions = regionData.reduce((s, r) => s + r.num_transactions,   0)
  const avgOrderValue     = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
  const topCategory       = categoryData.summary.length
    ? [...categoryData.summary].sort((a, b) => b.total_revenue - a.total_revenue)[0].category
    : '—'

  return {
    // Filter state
    regions,    setRegions,
    categories, setCategories,
    dateFrom,   setDateFrom,
    dateTo,     setDateTo,
    activeTab,  setActiveTab,
    // Filtered chart data
    topProducts, regionData, categoryData, ageGroupData, catRegionData, inventoryData,
    loading, error,
    // Full dataset for insights
    regionFull, ageGroupFull, inventoryFull,
    // Derived KPIs
    totalRevenue, totalUnits, avgOrderValue, topCategory,
  }
}
