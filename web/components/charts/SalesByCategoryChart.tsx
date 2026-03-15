'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { MonthlyCategorySale } from '@/types/metrics'

interface Props {
  data: MonthlyCategorySale[]
}

const COLORS: Record<string, string> = {
  Electronics:      '#2563eb',
  Clothing:         '#0ea5e9',
  'Food & Beverage':'#06b6d4',
  'Home & Garden':  '#14b8a6',
  Sports:           '#0891b2',
  Books:            '#3b82f6',
  Toys:             '#22d3ee',
  Other:            '#94a3b8',
}

function pivotMonthly(monthly: MonthlyCategorySale[]) {
  const map = new Map<string, Record<string, number | string>>()
  monthly.forEach(({ year_month, category, monthly_revenue }) => {
    if (!map.has(year_month)) map.set(year_month, { year_month })
    map.get(year_month)![category] = monthly_revenue
  })
  return Array.from(map.values()).sort((a, b) =>
    String(a.year_month).localeCompare(String(b.year_month))
  )
}

export default function SalesByCategoryChart({ data }: Props) {
  if (!data.length) return <p className="text-muted-foreground text-center py-8">No data</p>

  const categories = [...new Set(data.map(d => d.category))]
  const chartData = pivotMonthly(data)

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year_month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v, name) => [`$${Number(v).toLocaleString()}`, String(name)]} />
        <Legend />
        {categories.map(cat => (
          <Area
            key={cat}
            type="monotone"
            dataKey={cat}
            stackId="1"
            fill={COLORS[cat] ?? '#94a3b8'}
            stroke={COLORS[cat] ?? '#94a3b8'}
            fillOpacity={0.7}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
