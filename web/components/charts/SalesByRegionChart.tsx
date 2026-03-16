'use client'

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import ChartEmptyState from '@/components/ui/ChartEmptyState'
import { REGION_COLORS, TOOLTIP_STYLE } from '@/lib/constants'
import type { RegionSale } from '@/types/metrics'

interface Props {
  data: RegionSale[]
}

export default function SalesByRegionChart({ data }: Props) {
  if (!data.length) return <ChartEmptyState />

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
          {chartData.map((entry, i) => (
            <Cell key={i} fill={REGION_COLORS[entry.name] ?? '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
