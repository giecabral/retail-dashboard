'use client'

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { RegionSale } from '@/types/metrics'

interface Props {
  data: RegionSale[]
}

const COLORS = ['#2563eb', '#0ea5e9', '#06b6d4', '#14b8a6', '#0891b2']

export default function SalesByRegionChart({ data }: Props) {
  if (!data.length) return <p className="text-muted-foreground text-center py-8">No data</p>

  const chartData = data.map(r => ({ name: r.region, value: r.total_revenue }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
