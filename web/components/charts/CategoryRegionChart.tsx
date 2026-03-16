'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { CategoryRegionSale } from '@/types/metrics'

interface Props {
  data: CategoryRegionSale[]
}

const REGION_COLORS: Record<string, string> = {
  North: '#6366f1',
  South: '#f59e0b',
  East: '#10b981',
  West: '#f43f5e',
  Central: '#f97316',
}

function pivotByCategory(data: CategoryRegionSale[]) {
  const map = new Map<string, Record<string, number | string>>()
  data.forEach(({ category, region, total_revenue }) => {
    if (!map.has(category)) map.set(category, { category })
    map.get(category)![region] = total_revenue
  })
  return Array.from(map.values()).sort((a, b) =>
    String(a.category).localeCompare(String(b.category))
  )
}

export default function CategoryRegionChart({ data }: Props) {
  if (!data.length) return <p className="text-muted-foreground text-center py-8">No data</p>

  const regions = [...new Set(data.map(d => d.region))].sort()
  const chartData = pivotByCategory(data)

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ left: 10, right: 10, bottom: 55, top: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis angle={45} dataKey="category" tick={{ fontSize: 10, textAnchor: 'start' }} interval={0} dy={4} />
        <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#111827', fontWeight: 600 }}
          itemStyle={{ color: '#374151' }}
          formatter={(v, name) => [`$${Number(v).toLocaleString()}`, String(name)]}
        />
        {regions.map(r => (
          <Bar
            key={r}
            dataKey={r}
            fill={REGION_COLORS[r] ?? '#94a3b8'}
            radius={[3, 3, 0, 0]}
          />
        ))}
        <Legend verticalAlign="top" height={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
