'use client'

import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { TopProduct } from '@/types/metrics'

const CATEGORY_COLORS: Record<string, string> = {
  Electronics:      '#6366f1',
  Clothing:         '#f59e0b',
  'Food & Beverage':'#10b981',
  'Home & Garden':  '#ec4899',
  Sports:           '#f97316',
  Books:            '#8b5cf6',
  Toys:             '#06b6d4',
  Other:            '#94a3b8',
}

interface Props {
  data: TopProduct[]
}

const truncate = (s: string, n = 22) => s.length > n ? s.slice(0, n - 1) + '…' : s

export default function TopProductsChart({ data }: Props) {
  if (!data.length) return <p className="text-muted-foreground text-center py-8">No data</p>

  const chartData = data.map(p => ({
    name: truncate(p.name),
    revenue: p.total_revenue,
    units: p.total_units,
    category: p.category,
  }))

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={v => `$${(v / 1000).toFixed(1)}k`}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#111827', fontWeight: 600 }}
          itemStyle={{ color: '#374151' }}
          formatter={(value, name) => [
            name === 'revenue' ? `$${Number(value).toLocaleString()}` : value,
            name === 'revenue' ? 'Revenue' : 'Units',
          ]}
        />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={CATEGORY_COLORS[entry.category] ?? '#94a3b8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
