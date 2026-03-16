'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import ChartEmptyState from '@/components/ui/ChartEmptyState'
import { CATEGORY_COLORS, TOOLTIP_STYLE } from '@/lib/constants'
import type { AgeGroupSale } from '@/types/metrics'

interface Props {
  data: AgeGroupSale[]
}

const AGE_ORDER = ['18-24', '25-34', '35-44', '45-54', '55+']

function pivotByAgeGroup(data: AgeGroupSale[]) {
  const map = new Map<string, Record<string, number | string>>()
  data.forEach(({ age_group, category, total_revenue }) => {
    if (!map.has(age_group)) map.set(age_group, { age_group })
    map.get(age_group)![category] = total_revenue
  })
  return AGE_ORDER
    .filter(g => map.has(g))
    .map(g => map.get(g)!)
}

export default function AgeGroupChart({ data }: Props) {
  if (!data.length) return <ChartEmptyState />

  const categories = [...new Set(data.map(d => d.category))].sort()
  const chartData  = pivotByAgeGroup(data)

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="age_group" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v, name) => [`$${Number(v).toLocaleString()}`, String(name)]}
        />
        {categories.map(cat => (
          <Bar
          key={cat}
          dataKey={cat}
          stackId="1"
          fill={CATEGORY_COLORS[cat] ?? '#94a3b8'}
          radius={cat === categories[categories.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
        <Legend dy={8}/>
      </BarChart>
    </ResponsiveContainer>
  )
}
