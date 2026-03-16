'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import KPICard from '@/components/ui/KPICard'
import TopProductsChart from '@/components/charts/TopProductsChart'
import SalesByRegionChart from '@/components/charts/SalesByRegionChart'
import SalesByCategoryChart from '@/components/charts/SalesByCategoryChart'
import AgeGroupChart from '@/components/charts/AgeGroupChart'
import CategoryRegionChart from '@/components/charts/CategoryRegionChart'
import InventoryTurnoverChart from '@/components/charts/InventoryTurnoverChart'
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

  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [regionData, setRegionData] = useState<RegionSale[]>([])
  const [categoryData, setCategoryData] = useState<CategorySaleResponse>({ summary: [], monthly: [] })
  const [ageGroupData, setAgeGroupData] = useState<AgeGroupSale[]>([])
  const [catRegionData, setCatRegionData]   = useState<CategoryRegionSale[]>([])
  const [inventoryData, setInventoryData]   = useState<InventoryItem[]>([])
  const [loading, setLoading]               = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    categories.forEach(c => params.append('category', c))
    regions.forEach(r => params.append('region', r))

    const toYearMonth = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    const [tp, rd, cd, ag, cr, inv] = await Promise.all([
      fetch(`/api/top-products?${params}&limit=10`).then(r => r.json()),
      fetch(`/api/sales-by-region?${params}`).then(r => r.json()),
      fetch(`/api/sales-by-category?${params}&from=${toYearMonth(dateFrom)}&to=${toYearMonth(dateTo)}`).then(r => r.json()),
      fetch(`/api/sales-by-age-group?${params}`).then(r => r.json()),
      fetch(`/api/category-by-region?${params}`).then(r => r.json()),
      fetch(`/api/inventory?${params}&limit=15`).then(r => r.json()),
    ])

    setTopProducts(tp)
    setRegionData(rd)
    setCategoryData(cd)
    setAgeGroupData(ag)
    setCatRegionData(cr)
    setInventoryData(inv)
    setLoading(false)
  }, [regions, categories, dateFrom, dateTo])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Derived KPIs
  const totalRevenue      = regionData.reduce((s, r) => s + r.total_revenue, 0)
  const totalUnits        = regionData.reduce((s, r) => s + r.total_units, 0)
  const totalTransactions = regionData.reduce((s, r) => s + r.num_transactions, 0)
  const avgOrderValue     = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </div>
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
            <InventoryTurnoverChart data={inventoryData} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
