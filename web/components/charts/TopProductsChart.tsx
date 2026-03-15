'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { TopProduct } from '@/types/metrics'

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
          width={145}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          formatter={(value, name) => [
            name === 'revenue' ? `$${Number(value).toLocaleString()}` : value,
            name === 'revenue' ? 'Revenue' : 'Units',
          ]}
        />
        <Bar dataKey="revenue" fill="#2563eb" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
