'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { CategoryRegionSale } from '@/types/metrics'

interface Props {
  data: CategoryRegionSale[]
}

const REGION_COLORS: Record<string, string> = {
  North:   '#2563eb',
  South:   '#0ea5e9',
  East:    '#06b6d4',
  West:    '#14b8a6',
  Central: '#0891b2',
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

  const regions   = [...new Set(data.map(d => d.region))].sort()
  const chartData = pivotByCategory(data)

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} />
        <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v, name) => [`$${Number(v).toLocaleString()}`, String(name)]} />
        <Legend />
        {regions.map(r => (
          <Bar
            key={r}
            dataKey={r}
            fill={REGION_COLORS[r] ?? '#94a3b8'}
            radius={[3, 3, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
