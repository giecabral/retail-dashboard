'use client'

import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import ChartEmptyState from '@/components/ui/ChartEmptyState'
import type { InventoryItem } from '@/types/metrics'

interface Props {
  data: InventoryItem[]
}

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: '#6366f1',
  Clothing: '#f59e0b',
  'Food & Beverage': '#10b981',
  'Home & Garden': '#ec4899',
  Sports: '#f97316',
  Books: '#8b5cf6',
  Toys: '#06b6d4',
  Other: '#94a3b8',
}

const truncate = (s: string, n = 24) => s.length > n ? s.slice(0, n - 1) + '…' : s

export default function InventoryTurnoverChart({ data }: Props) {
  if (!data.length) return <ChartEmptyState message="No inventory data for the selected category" />

  const chartData = data.map(d => ({
    name: truncate(d.name),
    category: d.category,
    turnover: d.turnover_rate,
    days: d.days_on_hand,
    stock: d.stock_quantity,
    units_sold: d.total_units_sold,
  }))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={v => `${v}×`}
          tick={{ fontSize: 11 }}
          label={{ value: 'Turnover rate (units sold ÷ stock)', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#6b7280' }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={160}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#111827', fontWeight: 600 }}
          itemStyle={{ color: '#374151' }}
          formatter={(value, name) => {
            if (name === 'turnover') return [`${value}×`, 'Turnover rate']
            return [value, name]
          }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-md">
                <p className="mb-1.5 font-semibold text-gray-900">{d.name}</p>
                <p className="text-gray-500">{d.category}</p>
                <div className="mt-2 space-y-1">
                  <p><span className="text-gray-500">Turnover rate: </span><span className="font-medium">{d.turnover}×</span></p>
                  <p><span className="text-gray-500">Days on hand: </span><span className="font-medium">{d.days === 9999 ? 'No sales' : `${d.days} days`}</span></p>
                  <p><span className="text-gray-500">Units in stock: </span><span className="font-medium">{d.stock}</span></p>
                  <p><span className="text-gray-500">Units sold: </span><span className="font-medium">{d.units_sold}</span></p>
                </div>
              </div>
            )
          }}
        />
        <ReferenceLine x={1} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: '1×', position: 'top', fontSize: 10, fill: '#94a3b8' }} />
        <Bar dataKey="turnover" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={CATEGORY_COLORS[entry.category] ?? '#94a3b8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
