'use client'

import { MapPin, AlertTriangle, Users, Receipt } from 'lucide-react'
import type { RegionSale, AgeGroupSale, InventoryItem } from '@/types/metrics'

interface Props {
  regionData:    RegionSale[]
  ageGroupData:  AgeGroupSale[]
  inventoryData: InventoryItem[]
}

interface Insight {
  icon:        React.ReactNode
  metric:      string
  title:       string
  description: string
  borderColor: string
  iconBg:      string
  iconColor:   string
}

export default function InsightsPanel({ regionData, ageGroupData, inventoryData }: Props) {
  if (!regionData.length) return null

  // 1. Top revenue region and its share
  const totalRevenue = regionData.reduce((s, r) => s + r.total_revenue, 0)
  const topRegion    = [...regionData].sort((a, b) => b.total_revenue - a.total_revenue)[0]
  const regionShare  = totalRevenue > 0
    ? `${((topRegion.total_revenue / totalRevenue) * 100).toFixed(0)}%`
    : '—'

  // 2. Inventory at risk (turnover < 1×)
  const atRiskCount = inventoryData.filter(d => d.turnover_rate < 1).length

  // 3. Age group with highest spend + their top category
  const ageMap = new Map<string, Record<string, number>>()
  for (const row of ageGroupData) {
    if (!ageMap.has(row.age_group)) ageMap.set(row.age_group, {})
    const g = ageMap.get(row.age_group)!
    g[row.category] = (g[row.category] ?? 0) + row.total_revenue
  }
  let topAgeGroup = '—', topAgeCategory = '—', maxAgeRev = 0
  for (const [group, cats] of ageMap) {
    const total = Object.values(cats).reduce((s, v) => s + v, 0)
    if (total > maxAgeRev) {
      maxAgeRev      = total
      topAgeGroup    = group
      topAgeCategory = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    }
  }

  // 4. Region with highest AOV vs lowest — and the gap
  const regionAOV = regionData
    .filter(r => r.num_transactions > 0)
    .map(r => ({ region: r.region, aov: r.total_revenue / r.num_transactions }))
  const topAOV    = [...regionAOV].sort((a, b) => b.aov - a.aov)[0]
  const bottomAOV = [...regionAOV].sort((a, b) => a.aov - b.aov)[0]
  const aovGap    = topAOV && bottomAOV && bottomAOV.aov > 0
    ? `${(((topAOV.aov - bottomAOV.aov) / bottomAOV.aov) * 100).toFixed(0)}%`
    : '—'

  const insights: Insight[] = [
    {
      icon:        <MapPin className="h-5 w-5" />,
      metric:      regionShare,
      title:       `${topRegion?.region ?? '—'} leads in revenue`,
      description: `The ${topRegion?.region ?? '—'} region drives ${regionShare} of total revenue — the highest concentration of any region.`,
      borderColor: 'border-indigo-500',
      iconBg:      'bg-indigo-50',
      iconColor:   'text-indigo-600',
    },
    {
      icon:        <AlertTriangle className="h-5 w-5" />,
      metric:      `${atRiskCount} products`,
      title:       'Slow-moving stock at risk',
      description: `${atRiskCount} product${atRiskCount !== 1 ? 's' : ''} have a turnover rate below 1× and have not sold through their current stock.`,
      borderColor: 'border-amber-500',
      iconBg:      'bg-amber-50',
      iconColor:   'text-amber-600',
    },
    {
      icon:        <Users className="h-5 w-5" />,
      metric:      topAgeGroup,
      title:       'Highest-spending age group',
      description: `Customers aged ${topAgeGroup} generate the most revenue, concentrating purchases on ${topAgeCategory}.`,
      borderColor: 'border-emerald-500',
      iconBg:      'bg-emerald-50',
      iconColor:   'text-emerald-600',
    },
    {
      icon:        <Receipt className="h-5 w-5" />,
      metric:      topAOV ? `$${topAOV.aov.toFixed(2)}` : '—',
      title:       `${topAOV?.region ?? '—'} has highest avg order value`,
      description: `${topAOV?.region ?? '—'} customers average $${topAOV?.aov.toFixed(2) ?? '—'} per order — ${aovGap} more than ${bottomAOV?.region ?? '—'}, the lowest region.`,
      borderColor: 'border-violet-500',
      iconBg:      'bg-violet-50',
      iconColor:   'text-violet-600',
    },
  ]

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4">
        Based on the full dataset · filters do not apply to insights
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map(insight => (
          <div
            key={insight.title}
            className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${insight.borderColor}`}
          >
            <div className={`mb-3 inline-flex items-center justify-center rounded-lg p-2 ${insight.iconBg} ${insight.iconColor}`}>
              {insight.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-tight">{insight.metric}</p>
            <p className="text-sm font-semibold text-gray-700 mt-1">{insight.title}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{insight.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
