'use client'

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
import AppHeader from '@/components/AppHeader'
import { useDashboard } from '@/hooks/useDashboard'

export default function DashboardPage() {
  const {
    regions, setRegions,
    categories, setCategories,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    activeTab, setActiveTab,
    topProducts, regionData, categoryData, ageGroupData, catRegionData, inventoryData,
    loading, error,
    regionFull, ageGroupFull, inventoryFull,
    totalRevenue, totalUnits, avgOrderValue, topCategory,
  } = useDashboard()

  return (
    <main className="min-h-screen bg-[#f0f4f8]">
      <AppHeader />
      <div className="p-6">

        {/* Filters */}
        <div className="flex flex-wrap items-start gap-4 mb-6">
          <CategoryFilter selected={categories} onChange={setCategories} />
          <RegionFilter selected={regions} onChange={setRegions} />
          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            onChange={(f, t) => { setDateFrom(f); setDateTo(t) }}
          />
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* KPIs / Insights tabs */}
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
                Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {loading ? (
            <><ChartCardSkeleton /><ChartCardSkeleton /></>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle>Top 10 Products by Revenue</CardTitle></CardHeader>
                <CardContent><TopProductsChart data={topProducts} /></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Revenue by Region</CardTitle></CardHeader>
                <CardContent><SalesByRegionChart data={regionData} /></CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <><ChartCardSkeleton /><ChartCardSkeleton /></>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle>Revenue by Age Group & Category</CardTitle></CardHeader>
                <CardContent><AgeGroupChart data={ageGroupData} /></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Category Preference by Region</CardTitle></CardHeader>
                <CardContent><CategoryRegionChart data={catRegionData} /></CardContent>
              </Card>
            </>
          )}
        </div>

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
            <CardContent><SalesByCategoryChart data={categoryData.monthly} /></CardContent>
          </Card>
        )}

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
            <CardContent><InventoryTurnoverChart data={inventoryData.slice(0, 15)} /></CardContent>
          </Card>
        )}

      </div>
    </main>
  )
}
