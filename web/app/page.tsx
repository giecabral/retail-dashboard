'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import KPICard, { KPICardSkeleton } from '@/components/ui/KPICard'
import ChartCardSkeleton from '@/components/ui/ChartCardSkeleton'
import TopProductsChart from '@/components/charts/TopProductsChart'
import SalesByRegionChart from '@/components/charts/SalesByRegionChart'
import SalesByCategoryChart from '@/components/charts/SalesByCategoryChart'
import AgeGroupChart from '@/components/charts/AgeGroupChart'
import CategoryRegionChart from '@/components/charts/CategoryRegionChart'
import InventoryTurnoverChart from '@/components/charts/InventoryTurnoverChart'
import InsightsPanel from '@/components/InsightsPanel'
import RegionFilter from '@/components/filters/RegionFilter'
import CategoryFilter from '@/components/filters/CategoryFilter'
import DateRangeFilter from '@/components/filters/DateRangeFilter'
import type {
  TopProduct, RegionSale, CategorySaleResponse,
  AgeGroupSale, CategoryRegionSale, InventoryItem,
} from '@/types/metrics'
import AppHeader from '@/components/AppHeader'

export default function DashboardPage() {
  const [regions, setRegions] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState<Date>(new Date(2025, 0, 1))
  const [dateTo, setDateTo] = useState<Date>(new Date(2026, 2, 15))
  const [activeTab, setActiveTab] = useState<'kpis' | 'insights'>('kpis')

  // Filtered data — used by charts and KPIs
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [regionData, setRegionData] = useState<RegionSale[]>([])
  const [categoryData, setCategoryData] = useState<CategorySaleResponse>({ summary: [], monthly: [] })
  const [ageGroupData, setAgeGroupData] = useState<AgeGroupSale[]>([])
  const [catRegionData, setCatRegionData] = useState<CategoryRegionSale[]>([])
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Unfiltered data — used only by InsightsPanel so insights are always dataset-wide
  const [regionFull, setRegionFull] = useState<RegionSale[]>([])
  const [ageGroupFull, setAgeGroupFull] = useState<AgeGroupSale[]>([])
  const [inventoryFull, setInventoryFull] = useState<InventoryItem[]>([])

  // Fetch filtered data whenever filters change
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    categories.forEach(c => params.append('category', c))
    regions.forEach(r => params.append('region', r))

    const toYearMonth = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    try {
      const [tp, rd, cd, ag, cr, inv] = await Promise.all([
        fetch(`/api/top-products?${params}&limit=10`).then(r => { if (!r.ok) throw new Error('top-products'); return r.json() }),
        fetch(`/api/sales-by-region?${params}`).then(r => { if (!r.ok) throw new Error('sales-by-region'); return r.json() }),
        fetch(`/api/sales-by-category?${params}&from=${toYearMonth(dateFrom)}&to=${toYearMonth(dateTo)}`).then(r => { if (!r.ok) throw new Error('sales-by-category'); return r.json() }),
        fetch(`/api/sales-by-age-group?${params}`).then(r => { if (!r.ok) throw new Error('sales-by-age-group'); return r.json() }),
        fetch(`/api/category-by-region?${params}`).then(r => { if (!r.ok) throw new Error('category-by-region'); return r.json() }),
        fetch(`/api/inventory?${params}&limit=200`).then(r => { if (!r.ok) throw new Error('inventory'); return r.json() }),
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

  // Fetch full-dataset data once on mount for insights
  useEffect(() => {
    Promise.all([
      fetch('/api/sales-by-region').then(r => r.json()),
      fetch('/api/sales-by-age-group').then(r => r.json()),
      fetch('/api/inventory?limit=200').then(r => r.json()),
    ]).then(([rd, ag, inv]) => {
      setRegionFull(rd)
      setAgeGroupFull(ag)
      setInventoryFull(inv)
    })
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Derived KPIs
  const totalRevenue = regionData.reduce((s, r) => s + r.total_revenue, 0)
  const totalUnits = regionData.reduce((s, r) => s + r.total_units, 0)
  const totalTransactions = regionData.reduce((s, r) => s + r.num_transactions, 0)
  const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
  const topCategory = categoryData.summary.length
    ? [...categoryData.summary].sort((a, b) => b.total_revenue - a.total_revenue)[0].category
    : '—'

  return (
    <main className="min-h-screen bg-[#f0f4f8]">
      <AppHeader />
      <div className="p-6">
        <div className="flex flex-wrap items-start gap-4 mb-6">
          <CategoryFilter selected={categories} onChange={setCategories} />
          <RegionFilter selected={regions} onChange={setRegions} />
          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            onChange={(f, t) => { setDateFrom(f); setDateTo(t) }}
          />
        </div>
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex gap-1 mb-4 w-fit rounded-lg bg-white p-1 shadow-sm border border-input">
            {(['kpis', 'insights'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-md cursor-pointer px-4 py-1.5 text-sm font-medium transition-colors
                  ${activeTab === tab
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tab === 'kpis' ? 'Key Metrics' : 'Business Insights'}
              </button>
            ))}
          </div>
          {activeTab === 'kpis' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                <>
                  <KPICardSkeleton />
                  <KPICardSkeleton />
                  <KPICardSkeleton />
                  <KPICardSkeleton />
                </>
              ) : (
                <>
                  <KPICard
                    title="Total Revenue"
                    value={`$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    subtitle={regions.length === 0 ? 'All regions' : regions.join(', ')}
                    icon={<DollarSign className="h-4 w-4" />}
                  />
                  <KPICard
                    title="Units Sold"
                    value={totalUnits.toLocaleString()}
                    subtitle={regions.length === 0 ? 'All regions' : regions.join(', ')}
                    icon={<Package className="h-4 w-4" />}
                  />
                  <KPICard
                    title="Avg. Order Value"
                    value={`$${avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`}
                    subtitle={regions.length === 0 ? 'All regions' : regions.join(', ')}
                    icon={<ShoppingCart className="h-4 w-4" />}
                  />
                  <KPICard
                    title="Top Category"
                    value={topCategory}
                    subtitle="By total revenue"
                    icon={<TrendingUp className="h-4 w-4" />}
                  />
                </>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <InsightsPanel
              regionData={regionFull}
              ageGroupData={ageGroupFull}
              inventoryData={inventoryFull}
            />
          )}
        </div>

        {/* Row 1 — Top Products + Revenue by Region */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {loading ? (
            <>
              <ChartCardSkeleton />
              <ChartCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Products by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <TopProductsChart data={topProducts} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Region</CardTitle>
                </CardHeader>
                <CardContent>
                  <SalesByRegionChart data={regionData} />
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Row 2 — Age Group + Category × Region */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <>
              <ChartCardSkeleton />
              <ChartCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Age Group & Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <AgeGroupChart data={ageGroupData} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Category Preference by Region</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryRegionChart data={catRegionData} />
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Row 3 — Monthly trend */}
        {loading ? (
          <ChartCardSkeleton className="mt-6" />
        ) : (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-baseline gap-2">
                Monthly Revenue by Category
                <span className="text-xs font-normal text-muted-foreground">
                  {format(dateFrom, 'MMM yyyy')} – {format(dateTo, 'MMM yyyy')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalesByCategoryChart data={categoryData.monthly} />
            </CardContent>
          </Card>
        )}

        {/* Row 4 — Inventory turnover */}
        {loading ? (
          <ChartCardSkeleton className="mt-6" />
        ) : (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-baseline gap-2">
                Slowest-Moving Products
                <span className="text-xs font-normal text-muted-foreground">
                  by inventory turnover · {categories.length === 0 ? 'all categories' : categories.join(', ')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryTurnoverChart data={inventoryData.slice(0, 15)} />
            </CardContent>
          </Card>
        )}

      </div>
    </main>
  )
}
