import type { NextApiRequest, NextApiResponse } from 'next'
import { loadMetric } from '@/lib/loadMetric'
import type { CategorySaleResponse, CategorySummary, MonthlyCategorySale } from '@/types/metrics'

interface RawSummary extends CategorySummary { region: string }
interface RawMonthly extends MonthlyCategorySale { region: string }
interface RawData { summary: RawSummary[]; monthly: RawMonthly[] }

function parseList(v: string | string[] | undefined): string[] {
  return Array.isArray(v) ? v : v ? [v] : []
}

export default function handler(req: NextApiRequest, res: NextApiResponse<CategorySaleResponse | { error: string }>) {
  if (req.method !== 'GET') { res.status(405).end(); return }

  try {
  const { category, region, from, to } = req.query
  const raw = loadMetric<RawData>('sales_by_category.json')

  const cats    = parseList(category as string | string[])
  const regions = parseList(region   as string | string[])

  let summary = raw.summary
  let monthly = raw.monthly

  if (cats.length    > 0) { summary = summary.filter(s => cats.includes(s.category));    monthly = monthly.filter(m => cats.includes(m.category)) }
  if (regions.length > 0) { summary = summary.filter(s => regions.includes(s.region));  monthly = monthly.filter(m => regions.includes(m.region)) }
  if (from && typeof from === 'string') monthly = monthly.filter(m => m.year_month >= from)
  if (to   && typeof to   === 'string') monthly = monthly.filter(m => m.year_month <= to)

  // Aggregate summary across regions → one row per category
  const sumMap = new Map<string, CategorySummary>()
  for (const row of summary) {
    const prev = sumMap.get(row.category)
    if (prev) {
      prev.total_revenue    = +(prev.total_revenue + row.total_revenue).toFixed(2)
      prev.total_units      += row.total_units
      prev.num_transactions += row.num_transactions
    } else {
      sumMap.set(row.category, {
        category:         row.category,
        total_revenue:    row.total_revenue,
        total_units:      row.total_units,
        num_transactions: row.num_transactions,
        avg_order_value:  row.avg_order_value,
      })
    }
  }
  // Recompute avg_order_value after aggregation
  for (const row of sumMap.values()) {
    row.avg_order_value = row.num_transactions > 0
      ? +(row.total_revenue / row.num_transactions).toFixed(2)
      : 0
  }

  // Aggregate monthly across regions → one row per (category, year_month)
  const monMap = new Map<string, MonthlyCategorySale>()
  for (const row of monthly) {
    const key  = `${row.category}__${row.year_month}`
    const prev = monMap.get(key)
    if (prev) {
      prev.monthly_revenue = +(prev.monthly_revenue + row.monthly_revenue).toFixed(2)
    } else {
      monMap.set(key, { category: row.category, year_month: row.year_month, monthly_revenue: row.monthly_revenue })
    }
  }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    res.status(200).json({
      summary: Array.from(sumMap.values()),
      monthly: Array.from(monMap.values()),
    })
  } catch (err) {
    console.error('[sales-by-category]', err)
    res.status(500).json({ error: 'Failed to load sales by category' })
  }
}
